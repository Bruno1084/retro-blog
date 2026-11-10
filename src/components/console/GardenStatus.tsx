import Link from 'next/link';
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/content/labels';
import type { Report } from '@/lib/content/types';
import styles from './console.module.css';

/** Panel "Estado del jardín" del índice: datos derivados del pipeline (plan, sección 10.6). */
export function GardenStatus({ documents, edges, report }: { documents: number; edges: number; report: Report }) {
  const total = Math.max(documents, 1);
  return (
    <section className="console" aria-labelledby="estado-title">
      <h2 id="estado-title" className="console-label">
        Estado del jardín
      </h2>
      <ul className={styles.rows}>
        <li>
          documentos <span className="console-value">{documents}</span>
        </li>
        <li>
          enlaces <span className="console-value">{edges}</span>
        </li>
        <li>
          enlaces rotos <span className="console-value">{report.brokenLinks.length}</span>
        </li>
      </ul>
      <hr className={styles.divider} />
      {STATUS_ORDER.map((status) => {
        const count = report.maturity.counts[status];
        return (
          <div key={status}>
            <div className={styles.row}>
              {STATUS_LABEL[status].toLowerCase()} <span className="console-value">{count}</span>
            </div>
            <span className={styles.bar} aria-hidden="true">
              <span style={{ width: `${(count / total) * 100}%` }} />
            </span>
          </div>
        );
      })}
      <hr className={styles.divider} />
      <Link href="/graph">Ver el grafo completo</Link>
    </section>
  );
}
