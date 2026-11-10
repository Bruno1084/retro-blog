import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { GENERATED_DIR, ROOT_DIR } from './config';
import { readAhora, readDocument } from './pipeline';
import type { AhoraEntry, AhoraMention, GraphData, IndexedDoc, Report, TagEntry } from './types';
import type { ResolvedLink } from './wikilinks';

/**
 * Lectura de los artefactos de `.generated` desde las páginas de Next.
 * En producción se cachean en memoria (el build es estático); en dev se releen
 * en cada request para reflejar lo que regenera `npm run content:watch`.
 */
const cache = new Map<string, unknown>();
const shouldCache = process.env.NODE_ENV === 'production';

function readGenerated<T>(name: string): T {
  if (shouldCache && cache.has(name)) return cache.get(name) as T;
  const file = path.join(GENERATED_DIR, name);
  if (!fs.existsSync(file)) {
    throw new Error(`Falta ${path.relative(ROOT_DIR, file)}. Ejecutá \`npm run content\` antes de levantar Next.`);
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  if (shouldCache) cache.set(name, data);
  return data;
}

export function getIndex(): IndexedDoc[] {
  return readGenerated<IndexedDoc[]>('content-index.json');
}

/** Documentos ordenados por última actualización (desempate: creación, luego título). */
export function getDocsByUpdated(): IndexedDoc[] {
  return [...getIndex()].sort(
    (a, b) =>
      b.updated.localeCompare(a.updated) || b.created.localeCompare(a.created) || a.title.localeCompare(b.title, 'es'),
  );
}

export function getDocMeta(slug: string): IndexedDoc | undefined {
  return getIndex().find((doc) => doc.slug === slug);
}

/** Cuerpo MDX del documento, sin frontmatter. */
export function getDocBody(doc: IndexedDoc): string {
  const raw = fs.readFileSync(path.join(ROOT_DIR, doc.filePath), 'utf8').replace(/\r\n?/g, '\n');
  const parsed = readDocument(raw, doc.filePath);
  if ('errors' in parsed) throw new Error(`${doc.filePath}: ${parsed.errors.join('; ')}`);
  return parsed.body;
}

export function getTags(): TagEntry[] {
  return readGenerated<TagEntry[]>('tags.json');
}

export function getGraph(): GraphData {
  return readGenerated<GraphData>('graph.json');
}

export function getBacklinks(slug: string): IndexedDoc[] {
  const sources = readGenerated<Record<string, string[]>>('backlinks.json')[slug] ?? [];
  return sources.map((source) => getDocMeta(source)).filter((doc): doc is IndexedDoc => Boolean(doc));
}

/** Entradas de "Ahora", de la más reciente a la más antigua. */
export function getAhora(): AhoraEntry[] {
  return readGenerated<AhoraEntry[]>('ahora.json');
}

export function getAhoraEntry(fecha: string): AhoraEntry | undefined {
  return getAhora().find((entry) => entry.fecha === fecha);
}

/** Cuerpo MDX de una entrada de "Ahora", sin frontmatter. */
export function getAhoraBody(entry: AhoraEntry): string {
  const raw = fs.readFileSync(path.join(ROOT_DIR, entry.filePath), 'utf8').replace(/\r\n?/g, '\n');
  const parsed = readAhora(raw, entry.filePath);
  if ('errors' in parsed) throw new Error(`${entry.filePath}: ${parsed.errors.join('; ')}`);
  return parsed.body;
}

/** Entradas de "Ahora" que mencionan a `slug` (no son aristas del grafo). */
export function getAhoraMentions(slug: string): AhoraMention[] {
  return readGenerated<Record<string, AhoraMention[]>>('ahora-backlinks.json')[slug] ?? [];
}

export function getReport(): Report {
  return readGenerated<Report>('report.json');
}

/** Resolver de wikilinks para el modo render: slug o alias -> documento. */
export function createResolver(): (target: string) => ResolvedLink {
  const docs = getIndex();
  const bySlugOrAlias = new Map<string, IndexedDoc>();
  for (const doc of docs) bySlugOrAlias.set(doc.slug, doc);
  for (const doc of docs) for (const alias of doc.aliases) if (!bySlugOrAlias.has(alias)) bySlugOrAlias.set(alias, doc);
  return (target) => {
    const doc = bySlugOrAlias.get(target);
    return doc ? { slug: doc.slug, title: doc.title } : null;
  };
}
