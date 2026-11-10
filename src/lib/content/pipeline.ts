import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { isAnotacion, validateAnotacion } from './anotaciones';
import { AHORA_DIR, STALE_AHORA_DAYS, STALE_ARBOL_DAYS, STALE_SEMILLA_DAYS } from './config';
import { remarkHeadingIds } from './headings';
import { ahoraSchema, formatZodError, frontmatterSchema } from './schema';
import { slugify } from './slug';
import { TAGS, TAG_KEYS, isTag } from './tags';
import type {
  AhoraEntry,
  AhoraMention,
  AhoraMeta,
  Anotaciones,
  BrokenLink,
  DocMeta,
  GraphData,
  GraphEdge,
  GraphNode,
  Heading,
  IndexedDoc,
  Issue,
  MaturityReport,
  Report,
  Status,
  TagEntry,
} from './types';
import { remarkWikiLinks, type WikiLinkMatch } from './wikilinks';

export interface SourceDoc {
  meta: DocMeta;
  body: string;
  /** Líneas del archivo que preceden al cuerpo, para traducir posiciones del AST a líneas reales. */
  bodyLineOffset: number;
}

/** Entrada de "Ahora" (content/ahora/): fechada, sin tema ni estado. */
export interface SourceAhora {
  meta: AhoraMeta;
  body: string;
  bodyLineOffset: number;
}

export interface PipelineOptions {
  rootDir: string;
  contentDir: string;
  publicDir: string;
  /** En producción se excluyen los drafts y los errores hacen fallar el build. */
  production: boolean;
  /** Fecha de referencia para el reporte de madurez (YYYY-MM-DD). Por defecto, hoy en UTC. */
  today?: string;
}

export interface Artifacts {
  contentIndex: IndexedDoc[];
  graph: GraphData;
  backlinks: Record<string, string[]>;
  tags: TagEntry[];
  /** Entradas de "Ahora", de la más reciente a la más antigua. */
  ahora: AhoraEntry[];
  /** slug -> entradas de "Ahora" que lo mencionan. No son aristas del grafo. */
  ahoraBacklinks: Record<string, AhoraMention[]>;
  report: Report;
}

export function runPipeline(options: PipelineOptions): Artifacts {
  const issues: Issue[] = [];

  // Fase A — Descubrimiento. "Ahora" se separa antes del schema de documentos.
  const files = discover(options.contentDir);
  const ahoraDir = path.join(options.contentDir, AHORA_DIR) + path.sep;
  const ahoraFiles = files.filter((file) => file.startsWith(ahoraDir));
  const docFiles = files.filter((file) => !file.startsWith(ahoraDir));

  // Fase B — Parseo de frontmatter
  const parsed = parseDocuments(docFiles, options.rootDir);
  issues.push(...parsed.issues);
  const docs = parsed.docs.filter((doc) => !options.production || !doc.meta.draft);

  const parsedAhora = parseAhora(ahoraFiles, options.rootDir);
  issues.push(...parsedAhora.issues);
  const entries = parsedAhora.entries.filter((entry) => !options.production || !entry.meta.draft);

  // Fase C — Índice de resolución
  const resolution = buildResolutionIndex(docs.map((doc) => doc.meta));
  issues.push(...resolution.issues);
  const indexed = docs.filter((doc) => resolution.accepted.has(doc.meta.filePath));

  // Fase D — Extracción desde el AST
  const extracted = new Map<string, Extraction>();
  for (const doc of indexed) {
    const result = extract(doc, options);
    issues.push(...result.issues);
    extracted.set(doc.meta.slug, result);
  }
  const ahoraExtracted = new Map<string, Extraction>();
  for (const entry of entries) {
    const { filePath, fecha } = entry.meta;
    const result = extractBody({ filePath, body: entry.body, bodyLineOffset: entry.bodyLineOffset, range: { created: fecha } }, options);
    issues.push(...result.issues);
    ahoraExtracted.set(fecha, result);
  }

  // Fase E — Resolución y construcción del grafo. Las entradas de "Ahora" no están
  // en el índice de resolución (no se las enlaza) y sus links no son aristas.
  const graphResult = buildGraph(indexed, extracted, resolution.map);
  issues.push(...graphResult.issues);
  const ahoraResult = resolveAhora(entries, ahoraExtracted, resolution.map);
  issues.push(...ahoraResult.issues);

  // Fase F — Validación (lo que depende de cada documento ya está en `issues`; acá lo global)
  const orphans = findOrphans(graphResult.graph);
  for (const slug of orphans.isolated) {
    issues.push(warning('isolated', 'nota aislada: ni menciona ni es mencionada', fileOf(indexed, slug)));
  }
  for (const slug of orphans.noIncoming) {
    issues.push(warning('no-incoming', 'ningún documento enlaza a esta nota', fileOf(indexed, slug)));
  }
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const maturity = buildMaturity(indexed.map((doc) => doc.meta), today);
  const ahoraStatus = buildAhoraStatus(ahoraResult.entries, today);
  if (ahoraStatus.days !== null && ahoraStatus.days > STALE_AHORA_DAYS) {
    issues.push(
      warning(
        'ahora-desactualizado',
        `la última entrada de "Ahora" tiene ${ahoraStatus.days} días (> ${STALE_AHORA_DAYS})`,
        ahoraResult.entries.find((entry) => !entry.draft)?.filePath,
      ),
    );
  }

  // Fase G — Artefactos (ordenados de forma estable)
  const contentIndex: IndexedDoc[] = indexed
    .map((doc) => {
      const extraction = extracted.get(doc.meta.slug);
      return {
        ...doc.meta,
        headings: extraction?.headings ?? [],
        readingMinutes: readingMinutes(extraction?.words ?? 0),
        pendientes: extraction?.pendientes ?? 0,
        anotaciones: extraction?.anotaciones ?? { total: 0, ultima: null },
      };
    })
    .sort(bySlug);

  const sortedIssues = sortIssues(issues);
  return {
    contentIndex,
    graph: graphResult.graph,
    backlinks: graphResult.backlinks,
    tags: buildTagIndex(indexed.map((doc) => doc.meta)),
    ahora: ahoraResult.entries,
    ahoraBacklinks: ahoraResult.backlinks,
    report: {
      mode: options.production ? 'production' : 'development',
      today,
      summary: {
        errors: sortedIssues.filter((issue) => issue.severity === 'error').length,
        warnings: sortedIssues.filter((issue) => issue.severity === 'warning').length,
        documents: contentIndex.length,
      },
      issues: sortedIssues,
      brokenLinks: [...graphResult.brokenLinks, ...ahoraResult.brokenLinks].sort(
        (a, b) => a.file.localeCompare(b.file, 'en') || a.line - b.line,
      ),
      orphans,
      maturity,
      pendientes: contentIndex
        .filter((doc) => doc.pendientes > 0)
        .map((doc) => ({ slug: doc.slug, count: doc.pendientes, updated: doc.updated, days: daysBetween(doc.updated, today) })),
      ahora: ahoraStatus,
    },
  };
}

// ---------------------------------------------------------------------------
// Fase A — Descubrimiento
// ---------------------------------------------------------------------------

export function discover(contentDir: string): string[] {
  if (!fs.existsSync(contentDir)) return [];
  return fs
    .readdirSync(contentDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => path.join(contentDir, file))
    .sort((a, b) => toPosix(a).localeCompare(toPosix(b), 'en'));
}

// ---------------------------------------------------------------------------
// Fase B — Parseo de frontmatter
// ---------------------------------------------------------------------------

export function parseDocuments(files: string[], rootDir: string): { docs: SourceDoc[]; issues: Issue[] } {
  const docs: SourceDoc[] = [];
  const issues: Issue[] = [];

  for (const absolute of files) {
    const filePath = toPosix(path.relative(rootDir, absolute));
    const raw = fs.readFileSync(absolute, 'utf8').replace(/\r\n?/g, '\n');
    const result = readDocument(raw, filePath);
    if ('errors' in result) {
      for (const message of result.errors) issues.push(error('invalid-frontmatter', message, filePath));
      continue;
    }
    for (const tag of result.meta.tags) {
      if (!isTag(tag)) {
        issues.push(error('invalid-tag', `tag "${tag}" fuera de la lista controlada (src/lib/content/tags.ts)`, filePath));
      }
    }
    docs.push(result);
  }

  return { docs, issues };
}

/** Separa frontmatter y cuerpo, y cuenta las líneas que preceden al cuerpo. */
function splitFrontmatter(raw: string): { data: unknown; body: string; bodyLineOffset: number } | { errors: string[] } {
  let parsed: matter.GrayMatterFile<string>;
  try {
    // Pasar opciones desactiva la caché interna de gray-matter, que comparte objetos entre llamadas.
    parsed = matter(raw, {});
  } catch (cause) {
    return { errors: [`frontmatter YAML ilegible: ${(cause as Error).message}`] };
  }
  const body = parsed.content;
  const prefix = raw.endsWith(body) ? raw.slice(0, raw.length - body.length) : '';
  return { data: parsed.data, body, bodyLineOffset: prefix.split('\n').length - 1 };
}

/** Parsea un único archivo ya leído. Lo usan el pipeline y el render de Next. */
export function readDocument(raw: string, filePath: string): SourceDoc | { errors: string[] } {
  const split = splitFrontmatter(raw);
  if ('errors' in split) return split;
  const { body, bodyLineOffset } = split;

  const result = frontmatterSchema.safeParse(split.data);
  if (!result.success) return { errors: formatZodError(result.error) };
  const fm = result.data;

  return {
    meta: {
      slug: slugify(path.posix.basename(filePath, '.mdx')),
      title: fm.title,
      type: fm.type,
      status: fm.status,
      tags: fm.tags,
      created: fm.created,
      updated: fm.updated,
      summary: fm.summary,
      aliases: fm.aliases.map(slugify),
      draft: fm.draft,
      filePath,
    },
    body,
    bodyLineOffset,
  };
}

export function parseAhora(files: string[], rootDir: string): { entries: SourceAhora[]; issues: Issue[] } {
  const entries: SourceAhora[] = [];
  const issues: Issue[] = [];
  const seen = new Map<string, string>();

  for (const absolute of files) {
    const filePath = toPosix(path.relative(rootDir, absolute));
    const raw = fs.readFileSync(absolute, 'utf8').replace(/\r\n?/g, '\n');
    const result = readAhora(raw, filePath);
    if ('errors' in result) {
      for (const message of result.errors) issues.push(error('invalid-frontmatter', message, filePath));
      continue;
    }
    const existing = seen.get(result.meta.fecha);
    if (existing) {
      // La fecha es la URL (/ahora/<fecha>): dos entradas el mismo día colisionan.
      issues.push(error('duplicate-ahora', `ya hay una entrada de "Ahora" del ${result.meta.fecha} (${existing})`, filePath));
      continue;
    }
    seen.set(result.meta.fecha, filePath);
    entries.push(result);
  }

  return { entries, issues };
}

/** Parsea una entrada de "Ahora" ya leída. Schema propio: sin type, status, tags, summary ni aliases. */
export function readAhora(raw: string, filePath: string): SourceAhora | { errors: string[] } {
  const split = splitFrontmatter(raw);
  if ('errors' in split) return split;

  const result = ahoraSchema.safeParse(split.data);
  if (!result.success) return { errors: formatZodError(result.error) };
  const fm = result.data;

  return {
    meta: { fecha: fm.fecha, titulo: fm.titulo, draft: fm.draft, filePath },
    body: split.body,
    bodyLineOffset: split.bodyLineOffset,
  };
}

// ---------------------------------------------------------------------------
// Fase C — Índice de resolución
// ---------------------------------------------------------------------------

export interface ResolutionIndex {
  /** slug o alias -> slug canónico */
  map: Map<string, string>;
  /** filePath de los documentos que entraron al índice (los slugs duplicados quedan fuera). */
  accepted: Set<string>;
  issues: Issue[];
}

export function buildResolutionIndex(docs: DocMeta[]): ResolutionIndex {
  const map = new Map<string, string>();
  const owner = new Map<string, DocMeta>();
  const accepted = new Set<string>();
  const issues: Issue[] = [];

  for (const doc of docs) {
    const existing = owner.get(doc.slug);
    if (existing) {
      issues.push(error('duplicate-slug', `slug "${doc.slug}" duplicado (ya lo usa ${existing.filePath})`, doc.filePath));
      continue;
    }
    map.set(doc.slug, doc.slug);
    owner.set(doc.slug, doc);
    accepted.add(doc.filePath);
  }

  for (const doc of docs) {
    if (!accepted.has(doc.filePath)) continue;
    for (const alias of doc.aliases) {
      const taken = owner.get(alias);
      if (taken) {
        const what = map.get(alias) === alias ? 'el slug' : 'un alias';
        issues.push(error('alias-collision', `alias "${alias}" colisiona con ${what} de ${taken.filePath}`, doc.filePath));
        continue;
      }
      map.set(alias, doc.slug);
      owner.set(alias, doc);
    }
  }

  return { map, accepted, issues };
}

// ---------------------------------------------------------------------------
// Fase D — Extracción desde el AST
// ---------------------------------------------------------------------------

export interface Extraction {
  links: WikiLinkMatch[];
  headings: Heading[];
  /** Palabras del cuerpo (texto y código), para el tiempo de lectura. */
  words: number;
  /** Secciones marcadas con `<PorEscribir>`. */
  pendientes: number;
  /** Notas al margen `<Nota>`: cantidad y fecha de la más reciente. */
  anotaciones: Anotaciones;
  issues: Issue[];
}

/** Lo que necesita la extracción de un cuerpo MDX, sea un documento o una entrada de "Ahora". */
export interface BodySource {
  filePath: string;
  body: string;
  bodyLineOffset: number;
  /** Rango contra el que se validan las fechas de las anotaciones. */
  range: { created: string; updated?: string };
}

export function extract(doc: SourceDoc, options: Pick<PipelineOptions, 'publicDir'>): Extraction {
  const { filePath, created, updated } = doc.meta;
  const result = extractBody({ filePath, body: doc.body, bodyLineOffset: doc.bodyLineOffset, range: { created, updated } }, options);
  const { pendientes } = result;

  if (doc.meta.status === 'arbol' && pendientes > 0) {
    result.issues.push(
      warning('arbol-con-pendientes', `es árbol pero tiene ${pendientes} ${pendientes === 1 ? 'sección' : 'secciones'} <PorEscribir>`, filePath),
    );
  }

  if (doc.meta.type === 'log' && !doc.meta.summary) {
    result.issues.push(warning('missing-summary', 'los logs necesitan `summary` (SEO y tarjetas del índice)', filePath));
  }

  return result;
}

export function extractBody(source: BodySource, options: Pick<PipelineOptions, 'publicDir'>): Extraction {
  const { filePath } = source;
  const links: WikiLinkMatch[] = [];
  const headings: Heading[] = [];
  const issues: Issue[] = [];
  const anotaciones: Anotaciones = { total: 0, ultima: null };
  let words = 0;
  let pendientes = 0;
  const toLine = (line: number | undefined) => (line === undefined ? undefined : line + source.bodyLineOffset);

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .use(remarkHeadingIds, { collect: headings })
    .use(remarkWikiLinks, { mode: 'extract', collect: links });

  let tree: Root;
  try {
    tree = processor.runSync(processor.parse(source.body)) as Root;
  } catch (cause) {
    const place = (cause as { line?: number }).line;
    issues.push(error('invalid-mdx', `MDX inválido: ${(cause as Error).message}`, filePath, toLine(place)));
    return { links, headings, words, pendientes, anotaciones, issues };
  }

  for (const link of links) link.line = toLine(link.line) ?? link.line;

  visit(tree, (node) => {
    const line = toLine(node.position?.start.line);

    if (node.type === 'image') {
      if (!node.alt?.trim()) issues.push(warning('missing-alt', `imagen sin texto alternativo: ${node.url}`, filePath, line));
      if (node.url.startsWith('/') && !fs.existsSync(path.join(options.publicDir, decodeURIComponent(node.url)))) {
        issues.push(error('missing-image', `la imagen ${node.url} no existe en /public`, filePath, line));
      }
    }

    if (node.type === 'link' && /^\/n\//.test(node.url)) {
      issues.push(
        warning('markdown-internal-link', `link interno en markdown (${node.url}); usar [[wikilink]] para que entre al grafo`, filePath, line),
      );
    }

    if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') {
      words += node.value.split(/\s+/).filter(Boolean).length;
    }

    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;

    if (node.name === 'PorEscribir') pendientes++;

    const { name } = node;
    if (isAnotacion(name)) {
      const { fecha, issue } = validateAnotacion({ ...node, name }, source.range, { file: filePath, line });
      if (issue) issues.push(issue);
      if (name === 'Nota') {
        anotaciones.total++;
        if (fecha && (!anotaciones.ultima || fecha > anotaciones.ultima)) anotaciones.ultima = fecha;
      }
    }
  });

  return { links, headings, words, pendientes, anotaciones, issues };
}

// ---------------------------------------------------------------------------
// Fase E — Resolución y construcción del grafo
// ---------------------------------------------------------------------------

export function buildGraph(docs: SourceDoc[], extracted: Map<string, Extraction>, index: Map<string, string>) {
  const issues: Issue[] = [];
  const brokenLinks: (BrokenLink & { file: string })[] = [];
  const weights = new Map<string, Map<string, number>>();

  for (const doc of docs) {
    const { slug, filePath } = doc.meta;
    for (const link of extracted.get(slug)?.links ?? []) {
      const target = index.get(link.target);
      if (!target) {
        brokenLinks.push({ from: slug, target: link.raw, line: link.line, file: filePath });
        issues.push(error('broken-link', `[[${link.raw}]] no apunta a ningún documento`, filePath, link.line));
        continue;
      }
      if (target === slug) {
        issues.push(warning('self-link', `[[${link.raw}]] es una autorreferencia; se descarta`, filePath, link.line));
        continue;
      }
      const outgoing = weights.get(slug) ?? new Map<string, number>();
      outgoing.set(target, (outgoing.get(target) ?? 0) + 1);
      weights.set(slug, outgoing);
    }
  }

  const edges: GraphEdge[] = [...weights]
    .flatMap(([source, targets]) => [...targets].map(([target, weight]) => ({ source, target, weight })))
    .sort((a, b) => a.source.localeCompare(b.source, 'en') || a.target.localeCompare(b.target, 'en'));

  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  const sources = new Map<string, string[]>();
  for (const { source, target } of edges) {
    outDegree.set(source, (outDegree.get(source) ?? 0) + 1);
    inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
    sources.set(target, [...(sources.get(target) ?? []), source]);
  }

  const nodes: GraphNode[] = docs
    .map(({ meta }) => {
      const incoming = inDegree.get(meta.slug) ?? 0;
      const outgoing = outDegree.get(meta.slug) ?? 0;
      return {
        id: meta.slug,
        title: meta.title,
        type: meta.type,
        status: meta.status,
        tags: meta.tags,
        degree: incoming + outgoing,
        inDegree: incoming,
        outDegree: outgoing,
        draft: meta.draft,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));

  const backlinks: Record<string, string[]> = {};
  for (const slug of [...sources.keys()].sort((a, b) => a.localeCompare(b, 'en'))) {
    backlinks[slug] = sources.get(slug)!.sort((a, b) => a.localeCompare(b, 'en'));
  }

  return { graph: { nodes, edges }, backlinks, brokenLinks, issues };
}

/**
 * Wikilinks desde "Ahora": se resuelven igual (y un link roto falla igual), pero
 * no generan aristas. Sí generan backlinks, marcados con su origen.
 */
export function resolveAhora(entries: SourceAhora[], extracted: Map<string, Extraction>, index: Map<string, string>) {
  const issues: Issue[] = [];
  const brokenLinks: (BrokenLink & { file: string })[] = [];
  const backlinks: Record<string, AhoraMention[]> = {};
  const result: AhoraEntry[] = [];

  for (const { meta } of entries) {
    const menciones = new Set<string>();
    for (const link of extracted.get(meta.fecha)?.links ?? []) {
      const target = index.get(link.target);
      if (!target) {
        brokenLinks.push({ from: `${AHORA_DIR}/${meta.fecha}`, target: link.raw, line: link.line, file: meta.filePath });
        issues.push(error('broken-link', `[[${link.raw}]] no apunta a ningún documento`, meta.filePath, link.line));
        continue;
      }
      menciones.add(target);
    }
    result.push({ ...meta, menciones: [...menciones].sort((a, b) => a.localeCompare(b, 'en')) });
  }

  result.sort((a, b) => b.fecha.localeCompare(a.fecha));
  for (const entry of result) {
    for (const slug of entry.menciones) {
      (backlinks[slug] ??= []).push({ origen: 'ahora', fecha: entry.fecha, ...(entry.titulo ? { titulo: entry.titulo } : {}) });
    }
  }
  const sortedBacklinks: Record<string, AhoraMention[]> = {};
  for (const slug of Object.keys(backlinks).sort((a, b) => a.localeCompare(b, 'en'))) sortedBacklinks[slug] = backlinks[slug]!;

  return { entries: result, backlinks: sortedBacklinks, brokenLinks, issues };
}

// ---------------------------------------------------------------------------
// Fase F — Validación global
// ---------------------------------------------------------------------------

export function findOrphans(graph: GraphData) {
  return {
    isolated: graph.nodes.filter((node) => node.degree === 0).map((node) => node.id),
    noIncoming: graph.nodes.filter((node) => node.degree > 0 && node.inDegree === 0).map((node) => node.id),
  };
}

export function buildMaturity(docs: DocMeta[], today: string): MaturityReport {
  const counts: Record<Status, number> = { semilla: 0, brote: 0, arbol: 0 };
  const staleSemillas: MaturityReport['staleSemillas'] = [];
  const staleArboles: MaturityReport['staleArboles'] = [];
  const incoherent: MaturityReport['incoherent'] = [];

  for (const doc of [...docs].sort(bySlug)) {
    counts[doc.status]++;
    const days = daysBetween(doc.updated, today);
    if (doc.status === 'semilla' && days > STALE_SEMILLA_DAYS) {
      staleSemillas.push({ slug: doc.slug, updated: doc.updated, days });
    }
    if (doc.status === 'arbol' && days > STALE_ARBOL_DAYS) {
      staleArboles.push({ slug: doc.slug, updated: doc.updated, days });
    }
    if (doc.status !== 'semilla' && doc.updated === doc.created) incoherent.push({ slug: doc.slug, status: doc.status });
  }

  return { counts, staleSemillas, staleArboles, incoherent };
}

/** Sección 8.6: una página "Ahora" desactualizada comunica abandono. Los drafts no cuentan. */
export function buildAhoraStatus(entries: AhoraEntry[], today: string): Report['ahora'] {
  const published = entries.filter((entry) => !entry.draft);
  const ultima = published.reduce<string | null>((max, entry) => (max === null || entry.fecha > max ? entry.fecha : max), null);
  return { entradas: published.length, ultima, days: ultima ? daysBetween(ultima, today) : null };
}

// ---------------------------------------------------------------------------
// Fase G — Artefactos derivados
// ---------------------------------------------------------------------------

export function buildTagIndex(docs: DocMeta[]): TagEntry[] {
  return TAG_KEYS.map((tag) => {
    const slugs = docs
      .filter((doc) => doc.tags.includes(tag))
      .map((doc) => doc.slug)
      .sort((a, b) => a.localeCompare(b, 'en'));
    return { tag, label: TAGS[tag].label, description: TAGS[tag].description, count: slugs.length, slugs };
  });
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const;

function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      (a.file ?? '').localeCompare(b.file ?? '', 'en') ||
      (a.line ?? 0) - (b.line ?? 0) ||
      a.code.localeCompare(b.code, 'en'),
  );
}

function error(code: Issue['code'], message: string, file?: string, line?: number): Issue {
  return { severity: 'error', code, message, file, line };
}

function warning(code: Issue['code'], message: string, file?: string, line?: number): Issue {
  return { severity: 'warning', code, message, file, line };
}

function fileOf(docs: SourceDoc[], slug: string): string | undefined {
  return docs.find((doc) => doc.meta.slug === slug)?.meta.filePath;
}

function bySlug(a: { slug: string }, b: { slug: string }): number {
  return a.slug.localeCompare(b.slug, 'en');
}

/** Minutos de lectura a 200 palabras por minuto, como mínimo 1 (plan, sección 10.6). */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

function daysBetween(from: string, to: string): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}
