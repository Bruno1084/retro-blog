/**
 * Reportes de mantenimiento (plan, sección 8). Lee `.generated/report.json`.
 *
 *   npm run report             todo
 *   npm run report -- --strict sale con código 1 si hay errores
 */
import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';
import { GENERATED_DIR, STALE_AHORA_DAYS, STALE_ARBOL_DAYS, STALE_SEMILLA_DAYS } from '../src/lib/content/config';
import { formatIssue, formatSummary } from '../src/lib/content/format';
import { STATUS_LABEL, STATUS_ORDER } from '../src/lib/content/labels';
import type { Issue, IssueCode, Report } from '../src/lib/content/types';

const file = path.join(GENERATED_DIR, 'report.json');
if (!fs.existsSync(file)) {
  console.error('No existe .generated/report.json. Ejecutá `npm run content` primero.');
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(file, 'utf8')) as Report;

const SECTIONS: { title: string; codes: IssueCode[] }[] = [
  { title: 'Links rotos', codes: ['broken-link'] },
  {
    title: 'Integridad del contenido',
    codes: [
      'invalid-frontmatter',
      'invalid-mdx',
      'invalid-tag',
      'duplicate-slug',
      'alias-collision',
      'duplicate-ahora',
      'missing-image',
    ],
  },
  { title: 'Notas huérfanas', codes: ['isolated', 'no-incoming'] },
  {
    title: 'Anotaciones fechadas',
    codes: (['nota', 'tachado', 'agregado'] as const).flatMap((prefix) =>
      (['sin-fecha', 'fecha-invalida', 'posterior-a-updated', 'anterior-a-created'] as const).map(
        (problem) => `${prefix}-${problem}` as const,
      ),
    ),
  },
  {
    title: 'Validaciones adicionales',
    codes: ['self-link', 'missing-alt', 'markdown-internal-link', 'missing-summary'],
  },
];

function heading(title: string, count: number) {
  console.log(`\n${styleText('bold', title)} ${styleText('dim', `(${count})`)}`);
}

function list(issues: Issue[], showOk = true) {
  if (issues.length === 0 && showOk) console.log(styleText('green', '  ok'));
  for (const issue of issues) console.log(`  ${formatIssue(issue)}`);
}

console.log(formatSummary(report));
for (const section of SECTIONS) {
  const issues = report.issues.filter((issue) => section.codes.includes(issue.code));
  heading(section.title, issues.length);
  list(issues);
}

const { maturity } = report;
heading('Madurez', Object.values(maturity.counts).reduce((a, b) => a + b, 0));
console.log(`  ${STATUS_ORDER.map((status) => `${STATUS_LABEL[status]} ${maturity.counts[status]}`).join('  /  ')}`);
for (const doc of maturity.staleSemillas) {
  console.log(`  ${styleText('cyan', 'info')}  semilla sin tocar hace ${doc.days} días (> ${STALE_SEMILLA_DAYS}): ${doc.slug}`);
}
for (const doc of maturity.staleArboles) {
  console.log(`  ${styleText('cyan', 'info')}  árbol sin revisar hace ${doc.days} días (> ${STALE_ARBOL_DAYS}): ${doc.slug}`);
}
for (const doc of maturity.incoherent) {
  console.log(`  ${styleText('cyan', 'info')}  ${STATUS_LABEL[doc.status].toLowerCase()} sin actualizaciones desde que se creó: ${doc.slug}`);
}

heading('Por escribir', report.pendientes.length);
if (report.pendientes.length === 0) console.log(styleText('green', '  ok'));
for (const doc of report.pendientes) {
  const sections = `${doc.count} ${doc.count === 1 ? 'sección' : 'secciones'}`;
  console.log(`  ${styleText('cyan', 'info')}  ${sections}, sin tocar hace ${doc.days} días: ${doc.slug}`);
}
list(report.issues.filter((issue) => issue.code === 'arbol-con-pendientes'), false);

heading('Ahora', report.ahora.entradas);
if (report.ahora.ultima === null) {
  console.log(`  ${styleText('cyan', 'info')}  todavía no hay entradas en content/ahora/`);
} else {
  console.log(`  última entrada: ${report.ahora.ultima} (hace ${report.ahora.days} días; aviso a los ${STALE_AHORA_DAYS})`);
}
list(report.issues.filter((issue) => issue.code === 'ahora-desactualizado'), false);

if (process.argv.includes('--strict') && report.summary.errors > 0) process.exit(1);
