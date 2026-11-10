import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, test } from 'node:test';
import { runPipeline, type PipelineOptions } from '../src/lib/content/pipeline';
import { splitWikiLinks } from '../src/lib/content/wikilinks';

const tmpDirs: string[] = [];
after(() => tmpDirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

/** Crea un repo de contenido temporal: `{ 'notes/a.mdx': '...' }`. */
function fixture(files: Record<string, string>, overrides: Partial<PipelineOptions> = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'garden-'));
  tmpDirs.push(root);
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, 'content', name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  fs.mkdirSync(path.join(root, 'public'), { recursive: true });
  return runPipeline({
    rootDir: root,
    contentDir: path.join(root, 'content'),
    publicDir: path.join(root, 'public'),
    production: false,
    today: '2026-10-06',
    ...overrides,
  });
}

function doc(body: string, fm: Record<string, string> = {}) {
  const frontmatter = {
    title: 'Título',
    type: 'nota',
    status: 'semilla',
    tags: '[software]',
    created: '2026-10-01',
    updated: '2026-10-01',
    ...fm,
  };
  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  return `---\n${yaml}\n---\n\n${body}\n`;
}

const codes = (artifacts: ReturnType<typeof fixture>) => artifacts.report.issues.map((issue) => issue.code);

describe('splitWikiLinks', () => {
  test('separa texto, target y texto visible', () => {
    assert.deepEqual(splitWikiLinks('ver [[a]] y [[b|la B]].'), [
      { kind: 'text', value: 'ver ' },
      { kind: 'wikilink', raw: 'a', label: undefined, offset: 4 },
      { kind: 'text', value: ' y ' },
      { kind: 'wikilink', raw: 'b', label: 'la B', offset: 12 },
      { kind: 'text', value: '.' },
    ]);
  });

  test('ignora corchetes que no forman un wikilink', () => {
    assert.deepEqual(splitWikiLinks('[[]] [a] [[sin cerrar'), [{ kind: 'text', value: '[[]] [a] [[sin cerrar' }]);
  });
});

describe('runPipeline', () => {
  test('resuelve wikilinks por slug y alias, deduplica aristas y calcula backlinks', () => {
    const result = fixture({
      'notes/a.mdx': doc('Uno [[b]], dos [[viejo-b|otra vez]] y [[c]].'),
      'notes/b.mdx': doc('Vuelta a [[a]].', { aliases: '[viejo-b]' }),
      'notes/c.mdx': doc('Sin salida.'),
    });

    assert.deepEqual(result.report.issues.filter((issue) => issue.severity === 'error'), []);
    assert.deepEqual(result.graph.edges, [
      { source: 'a', target: 'b', weight: 2 },
      { source: 'a', target: 'c', weight: 1 },
      { source: 'b', target: 'a', weight: 1 },
    ]);
    assert.deepEqual(result.backlinks, { a: ['b'], b: ['a'], c: ['a'] });
    assert.equal(result.graph.nodes.find((node) => node.id === 'a')?.degree, 3);
  });

  test('un link roto es error y reporta archivo y línea reales', () => {
    const result = fixture({ 'notes/a.mdx': doc('Primera línea.\n\nAcá [[no-existe]].') });
    assert.deepEqual(result.report.brokenLinks, [{ from: 'a', target: 'no-existe', line: 12, file: 'content/notes/a.mdx' }]);
    assert.equal(result.report.summary.errors, 1);
  });

  test('el orden de lectura no produce falsos links rotos', () => {
    const result = fixture({ 'a.mdx': doc('[[z]]'), 'z.mdx': doc('[[a]]') });
    assert.equal(result.report.brokenLinks.length, 0);
  });

  test('descarta autorreferencias con warning', () => {
    const result = fixture({ 'a.mdx': doc('Yo: [[a]].') });
    assert.deepEqual(result.graph.edges, []);
    assert.ok(codes(result).includes('self-link'));
  });

  test('frontmatter inválido y tag fuera de lista son errores acumulados', () => {
    const result = fixture({
      'a.mdx': doc('x', { type: 'ensayo' }),
      'b.mdx': doc('x', { tags: '[programming]' }),
      'c.mdx': '---\ntitle: [sin cerrar\n---\n',
    });
    assert.deepEqual(
      result.report.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.code),
      ['invalid-frontmatter', 'invalid-tag', 'invalid-frontmatter'],
    );
  });

  test('los valores en inglés de type y status ya no son válidos', () => {
    const result = fixture({
      'a.mdx': doc('x', { type: 'note' }),
      'b.mdx': doc('x', { type: 'idea' }),
      'c.mdx': doc('x', { status: 'evergreen' }),
      'd.mdx': doc('x', { type: 'pizca', status: 'brote', updated: '2026-10-02' }),
    });
    assert.deepEqual(codes(result), ['invalid-frontmatter', 'invalid-frontmatter', 'invalid-frontmatter', 'isolated']);
  });

  test('reflexion y resena no son tags; el campo medium ya no existe', () => {
    const result = fixture({
      'a.mdx': doc('x', { tags: '[reflexion]' }),
      'b.mdx': doc('x', { tags: '[resena]' }),
      'c.mdx': doc('x', { tags: '[literatura, software]' }),
      'd.mdx': doc('x', { medium: 'libro' }),
    });
    const errors = result.report.issues.filter((issue) => issue.severity === 'error');
    assert.deepEqual(
      errors.map((issue) => `${issue.file} ${issue.code}`),
      ['content/a.mdx invalid-tag', 'content/b.mdx invalid-tag', 'content/d.mdx invalid-frontmatter'],
    );
    const c = result.contentIndex.find((entry) => entry.slug === 'c');
    assert.deepEqual(c?.tags, ['literatura', 'software']);
    assert.ok(c && !('medium' in c));
  });

  test('slugs duplicados y aliases que colisionan son errores', () => {
    const result = fixture({
      'logs/a.mdx': doc('x'),
      'notes/a.mdx': doc('x'),
      'notes/b.mdx': doc('x', { aliases: '[a]' }),
    });
    assert.ok(codes(result).includes('duplicate-slug'));
    assert.ok(codes(result).includes('alias-collision'));
  });

  test('los drafts se excluyen en producción y quedan como links rotos', () => {
    const files = { 'a.mdx': doc('[[b]]'), 'b.mdx': doc('x', { draft: 'true' }) };
    assert.equal(fixture(files).report.summary.errors, 0);
    const production = fixture(files, { production: true });
    assert.deepEqual(production.contentIndex.map((d) => d.slug), ['a']);
    assert.equal(production.report.brokenLinks.length, 1);
  });

  test('distingue notas aisladas de notas sin entrantes', () => {
    const result = fixture({ 'a.mdx': doc('[[b]]'), 'b.mdx': doc('x'), 'c.mdx': doc('x') });
    assert.deepEqual(result.report.orphans, { isolated: ['c'], noIncoming: ['a'] });
  });

  test('avisa imágenes sin alt, links internos en markdown y logs sin summary', () => {
    const result = fixture({ 'a.mdx': doc('![](/x.png)\n\n[otra](/n/b)', { type: 'log' }) });
    const found = codes(result);
    for (const code of ['missing-alt', 'missing-image', 'markdown-internal-link', 'missing-summary'] as const) {
      assert.ok(found.includes(code), `falta ${code}`);
    }
  });

  test('reporte de madurez', () => {
    const result = fixture({
      'viejo.mdx': doc('x', { created: '2026-01-01', updated: '2026-01-01' }),
      'raro.mdx': doc('x', { status: 'arbol' }),
    });
    assert.deepEqual(result.report.maturity.staleSemillas, [{ slug: 'viejo', updated: '2026-01-01', days: 278 }]);
    assert.deepEqual(result.report.maturity.incoherent, [{ slug: 'raro', status: 'arbol' }]);
  });

  test('cuenta <PorEscribir> y avisa si un árbol tiene secciones pendientes', () => {
    const result = fixture({
      'a.mdx': doc('## Uno\n\n<PorEscribir />\n\n## Dos\n\n<PorEscribir>Falta el ejemplo.</PorEscribir>', { updated: '2026-10-03' }),
      'b.mdx': doc('<PorEscribir />', { status: 'arbol', updated: '2026-10-02' }),
      'c.mdx': doc('Completo.'),
    });
    assert.deepEqual(
      result.contentIndex.map((entry) => [entry.slug, entry.pendientes]),
      [['a', 2], ['b', 1], ['c', 0]],
    );
    assert.deepEqual(result.report.pendientes, [
      { slug: 'a', count: 2, updated: '2026-10-03', days: 3 },
      { slug: 'b', count: 1, updated: '2026-10-02', days: 4 },
    ]);
    const arbol = result.report.issues.filter((issue) => issue.code === 'arbol-con-pendientes');
    assert.deepEqual(arbol.map((issue) => [issue.severity, issue.file]), [['warning', 'content/b.mdx']]);
  });

  test('valida las fechas de <Nota>, <Tachado> y <Agregado>', () => {
    const range = { created: '2026-10-01', updated: '2026-10-10' };
    const result = fixture({
      'a.mdx': doc(
        [
          'Párrafo.',
          '<Nota>Sin fecha.</Nota>',
          '<Nota fecha="20-10-2026">Formato al revés.</Nota>',
          '<Nota fecha="2026-02-30">No existe.</Nota>',
          '<Nota fecha="2026-10-20">Posterior a updated.</Nota>',
          '<Nota fecha="2026-09-01">Anterior a created.</Nota>',
          '<Nota fecha="2026-10-05">Bien.</Nota>',
          'Texto <Tachado>viejo</Tachado> <Agregado fecha={x}>nuevo</Agregado> y <Tachado fecha="2026-10-08">ok</Tachado>.',
        ].join('\n\n'),
        range,
      ),
    });
    assert.deepEqual(
      result.report.issues.filter((issue) => issue.code !== 'isolated').map((issue) => [issue.severity, issue.code, issue.line]),
      [
        ['error', 'nota-sin-fecha', 12],
        ['error', 'nota-fecha-invalida', 14],
        ['error', 'nota-fecha-invalida', 16],
        ['error', 'agregado-fecha-invalida', 24],
        ['error', 'tachado-sin-fecha', 24],
        ['warning', 'nota-posterior-a-updated', 18],
        ['warning', 'nota-anterior-a-created', 20],
      ],
    );
    // Cuentan todas las <Nota>; la última es la más reciente con fecha válida.
    assert.deepEqual(result.contentIndex[0]?.anotaciones, { total: 6, ultima: '2026-10-20' });
  });

  test('una anotación sin fecha corta el build de producción', () => {
    const result = fixture({ 'a.mdx': doc('Hola <Tachado>chau</Tachado>.') }, { production: true });
    assert.equal(result.report.summary.errors, 1);
    assert.equal(result.report.issues[0]?.code, 'tachado-sin-fecha');
  });

  test('un documento sin notas tiene anotaciones vacías', () => {
    const result = fixture({ 'a.mdx': doc('Texto ~~garabato~~ sin fecha.') });
    assert.deepEqual(result.contentIndex[0]?.anotaciones, { total: 0, ultima: null });
    assert.equal(result.report.summary.errors, 0);
  });

  test('genera ids de headings estables y sin acentos', () => {
    const result = fixture({ 'a.mdx': doc('## Qué es\n\n### Qué es\n\n## Ver [[b|la otra]]'), 'b.mdx': doc('x') });
    assert.deepEqual(result.contentIndex[0]?.headings, [
      { depth: 2, text: 'Qué es', id: 'que-es' },
      { depth: 3, text: 'Qué es', id: 'que-es-1' },
      { depth: 2, text: 'Ver la otra', id: 'ver-la-otra' },
    ]);
  });
});

describe('Ahora', () => {
  const entrada = (fecha: string, body: string, extra = '') => `---\nfecha: ${fecha}\n${extra}---\n\n${body}\n`;

  test('no entra al grafo ni al índice, pero sus wikilinks generan backlinks con origen', () => {
    const result = fixture({
      'notes/a.mdx': doc('Sola.'),
      'ahora/2026-10-12.mdx': entrada('2026-10-12', 'Leyendo [[a]] y otra vez [[a]].', 'titulo: Octubre\n'),
      'ahora/2026-09-01.mdx': entrada('2026-09-01', 'También [[a]].'),
    });
    assert.deepEqual(result.graph.nodes.map((node) => node.id), ['a']);
    assert.deepEqual(result.graph.edges, []);
    assert.deepEqual(result.backlinks, {});
    assert.deepEqual(result.contentIndex.map((entry) => entry.slug), ['a']);
    assert.deepEqual(result.ahoraBacklinks, {
      a: [
        { origen: 'ahora', fecha: '2026-10-12', titulo: 'Octubre' },
        { origen: 'ahora', fecha: '2026-09-01' },
      ],
    });
    assert.deepEqual(
      result.ahora.map((entry) => [entry.fecha, entry.menciones]),
      [['2026-10-12', ['a']], ['2026-09-01', ['a']]],
    );
    assert.equal(result.report.summary.errors, 0);
  });

  test('un wikilink roto desde "Ahora" falla en producción', () => {
    const result = fixture({ 'ahora/2026-10-01.mdx': entrada('2026-10-01', 'Ver [[no-existe]].') }, { production: true });
    assert.deepEqual(result.report.brokenLinks, [
      { from: 'ahora/2026-10-01', target: 'no-existe', line: 5, file: 'content/ahora/2026-10-01.mdx' },
    ]);
    assert.equal(result.report.summary.errors, 1);
  });

  test('las entradas no se pueden enlazar con [[...]]', () => {
    const result = fixture({ 'a.mdx': doc('Ver [[2026-10-01]].'), 'ahora/2026-10-01.mdx': entrada('2026-10-01', 'Hola.') });
    assert.deepEqual(result.report.brokenLinks.map((link) => link.target), ['2026-10-01']);
  });

  test('schema propio, fechas duplicadas y drafts', () => {
    const files = {
      'ahora/2026-10-01.mdx': entrada('2026-10-01', 'x', 'type: nota\n'),
      'ahora/a.mdx': entrada('2026-10-02', 'x'),
      'ahora/b.mdx': entrada('2026-10-02', 'x'),
      'ahora/2026-10-03.mdx': entrada('2026-10-03', 'x', 'draft: true\n'),
    };
    const dev = fixture(files);
    assert.deepEqual(
      dev.report.issues.map((issue) => [issue.code, issue.file]),
      [
        ['invalid-frontmatter', 'content/ahora/2026-10-01.mdx'],
        ['duplicate-ahora', 'content/ahora/b.mdx'],
      ],
    );
    assert.deepEqual(dev.ahora.map((entry) => entry.fecha), ['2026-10-03', '2026-10-02']);
    assert.deepEqual(fixture(files, { production: true }).ahora.map((entry) => entry.fecha), ['2026-10-02']);
  });

  test('avisa si la última entrada tiene más de 60 días', () => {
    const files = { 'ahora/2026-08-01.mdx': entrada('2026-08-01', 'x') };
    const stale = fixture(files, { today: '2026-10-06' });
    assert.deepEqual(stale.report.ahora, { entradas: 1, ultima: '2026-08-01', days: 66 });
    assert.deepEqual(
      stale.report.issues.map((issue) => [issue.severity, issue.code]),
      [['warning', 'ahora-desactualizado']],
    );
    assert.equal(fixture(files, { today: '2026-09-15' }).report.issues.length, 0);
    assert.deepEqual(fixture({}).report.ahora, { entradas: 0, ultima: null, days: null });
  });
});

describe('rehypeAnotaciones', () => {
  const p = (text: string) => ({ type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: text }] });
  const nota = (fecha: string) => ({ type: 'mdxJsxFlowElement', name: 'Nota', attributes: [{ type: 'mdxJsxAttribute', name: 'fecha', value: fecha }], children: [] });
  const nl = { type: 'text', value: '\n' };

  test('agrupa cada nota con el bloque anterior, y las notas seguidas en el mismo grupo', async () => {
    const { rehypeAnotaciones } = await import('../src/lib/mdx/rehype-anotaciones');
    const tree = { type: 'root', children: [nota('2026-01-01'), nl, p('uno'), nl, nota('a'), nl, nota('b'), nl, p('dos')] };
    rehypeAnotaciones()(tree as never);

    const shape = (node: { type: string; tagName?: string; name?: string; properties?: { className?: string[] }; children?: unknown[] }): unknown =>
      node.type === 'text'
        ? 'nl'
        : node.type === 'mdxJsxFlowElement'
          ? node.name
          : node.properties?.className
            ? { [node.properties.className[0]!]: (node.children as never[]).map(shape) }
            : node.tagName;

    assert.deepEqual(tree.children.map(shape as never), [
      'Nota', // sin bloque anterior: queda en línea
      'nl',
      { anotado: ['p', { 'anotado-notas': ['Nota', 'Nota'] }] },
      'nl',
      'p',
    ]);
  });
});

describe('localSubgraph', () => {
  test('incluye vecinos entrantes y salientes a la profundidad pedida', async () => {
    const { localSubgraph } = await import('../src/lib/content/graph');
    const result = fixture({
      'a.mdx': doc('[[b]]'),
      'b.mdx': doc('[[c]]'),
      'c.mdx': doc('x'),
      'd.mdx': doc('[[a]]'),
      'e.mdx': doc('x'),
    });
    const ids = (depth: number) => localSubgraph(result.graph, 'a', depth).nodes.map((node) => node.id);
    assert.deepEqual(ids(1), ['a', 'b', 'd']);
    assert.deepEqual(ids(2), ['a', 'b', 'c', 'd']);
    assert.deepEqual(localSubgraph(result.graph, 'a', 1).edges.length, 2);
  });
});

describe('readingMinutes', () => {
  test('redondea hacia arriba con un mínimo de 1 minuto', async () => {
    const { readingMinutes } = await import('../src/lib/content/pipeline');
    assert.equal(readingMinutes(0), 1);
    assert.equal(readingMinutes(200), 1);
    assert.equal(readingMinutes(201), 2);
  });

  test('se emite en el índice de contenido', () => {
    const result = fixture({ 'a.mdx': doc(Array.from({ length: 450 }, () => 'palabra').join(' ')) });
    assert.equal(result.contentIndex[0]?.readingMinutes, 3);
  });
});
