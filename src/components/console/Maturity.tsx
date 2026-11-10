import { STATUS_LABEL, STATUS_ORDER } from '@/lib/content/labels';
import type { Status } from '@/lib/content/types';
import styles from './console.module.css';

/** Medidor de madurez en tres segmentos. Siempre acompañado de la palabra: el color no es la única señal. */
export function MaturityMeter({ status }: { status: Status }) {
  return (
    <span className={styles.maturity}>
      <span className={styles.segments} aria-hidden="true">
        {[1, 2, 3].map((segment) => (
          <span key={segment} className={segment <= STATUS_ORDER.indexOf(status) + 1 ? styles.on : undefined} />
        ))}
      </span>
      {STATUS_LABEL[status]}
    </span>
  );
}
