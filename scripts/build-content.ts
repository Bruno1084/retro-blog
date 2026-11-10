/**
 * Pipeline de contenido (plan, sección 6). Lee /content, valida y emite los
 * artefactos de /.generated que consumen las páginas de Next.
 *
 *   npm run content                 build único (modo dev: los errores no cortan)
 *   npm run content -- --production excluye drafts y sale con código 1 ante errores
 *   npm run content:watch           regenera al guardar
 */
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR, GENERATED_DIR, PUBLIC_DIR, ROOT_DIR } from '../src/lib/content/config';
import { formatIssue, formatSummary } from '../src/lib/content/format';
import { runPipeline } from '../src/lib/content/pipeline';

const args = new Set(process.argv.slice(2));
const production = args.has('--production') || process.env.NODE_ENV === 'production' || Boolean(process.env.CI);

function build(): boolean {
  const started = performance.now();
  const artifacts = runPipeline({
    rootDir: ROOT_DIR,
    contentDir: CONTENT_DIR,
    publicDir: PUBLIC_DIR,
    production,
  });

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  writeJson('content-index.json', artifacts.contentIndex);
  writeJson('graph.json', artifacts.graph);
  writeJson('backlinks.json', artifacts.backlinks);
  writeJson('tags.json', artifacts.tags);
  writeJson('ahora.json', artifacts.ahora);
  writeJson('ahora-backlinks.json', artifacts.ahoraBacklinks);
  writeJson('report.json', artifacts.report);

  for (const issue of artifacts.report.issues) {
    if (issue.severity === 'error' || !production) console.log(formatIssue(issue));
  }
  console.log(`${formatSummary(artifacts.report)} (${Math.round(performance.now() - started)} ms)`);
  return artifacts.report.summary.errors === 0;
}

/** Escribe solo si cambió, para no disparar recargas de Next innecesarias. */
function writeJson(name: string, data: unknown) {
  const file = path.join(GENERATED_DIR, name);
  const next = `${JSON.stringify(data, null, 2)}\n`;
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === next) return;
  fs.writeFileSync(file, next);
}

async function watch() {
  const { watch: chokidarWatch } = await import('chokidar');
  let timer: NodeJS.Timeout | undefined;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
      } catch (cause) {
        console.error(cause);
      }
    }, 100);
  };

  chokidarWatch([CONTENT_DIR, path.join(PUBLIC_DIR, 'images'), path.join(ROOT_DIR, 'src', 'lib', 'content', 'tags.ts')], {
    ignoreInitial: true,
  }).on('all', rebuild);
  console.log('content: observando /content');
}

const ok = build();
if (args.has('--watch')) {
  await watch();
} else if (!ok && production) {
  console.error('content: el build falla por los errores de arriba.');
  process.exit(1);
}
