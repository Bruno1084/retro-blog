import { STATUS_LABEL, STATUS_ORDER } from '@/lib/content/labels';
import type { Report } from '@/lib/content/types';
import styles from './graphList.module.css';

/** Reporte de mantenimiento en /graph. Solo se renderiza en dev (plan, sección 8). */
export function ReportPanel({ report }: { report: Report }) {
  const { errors, warnings } = report.summary;
  return (
    <details className={`console ${styles.report}`} open={errors > 0}>
      <summary>
        Reporte (solo dev): {errors} errores, {warnings} warnings
      </summary>
      {report.issues.length === 0 ? (
        <p>Sin problemas.</p>
      ) : (
        <ul>
          {report.issues.map((issue, index) => (
            <li key={index} className={issue.severity === 'error' ? styles.error : undefined}>
              <code>
                {issue.file}
                {issue.line ? `:${issue.line}` : ''}
              </code>{' '}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
      <p>
        Madurez: {STATUS_ORDER.map((status) => `${STATUS_LABEL[status]} ${report.maturity.counts[status]}`).join(' / ')}.
        Detalle completo con <code>npm run report</code>.
      </p>
    </details>
  );
}
