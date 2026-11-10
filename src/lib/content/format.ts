import { styleText } from 'node:util';
import type { Issue, Report } from './types';

const LABEL = {
  error: styleText('red', 'error  '),
  warning: styleText('yellow', 'warning'),
  info: styleText('cyan', 'info   '),
} as const;

/** `error   content/notes/x.mdx:12  mensaje  (código)` */
export function formatIssue(issue: Issue): string {
  const where = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ''}` : '';
  return `${LABEL[issue.severity]}  ${styleText('dim', where)}  ${issue.message} ${styleText('dim', `(${issue.code})`)}`;
}

export function formatSummary(report: Report): string {
  const { errors, warnings, documents } = report.summary;
  const parts = [
    `${documents} documentos`,
    errors > 0 ? styleText('red', `${errors} errores`) : '0 errores',
    warnings > 0 ? styleText('yellow', `${warnings} warnings`) : '0 warnings',
  ];
  return `content [${report.mode}]: ${parts.join(', ')}`;
}
