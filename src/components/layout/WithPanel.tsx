import type { ReactNode } from 'react';
import styles from './withPanel.module.css';

/**
 * Columna de papel + panel de consola (plan, sección 10.6). Desde 1100px el panel
 * va al costado y es sticky; por debajo queda después del contenido.
 */
export function WithPanel({ children, panel, panelLabel }: { children: ReactNode; panel: ReactNode; panelLabel: string }) {
  return (
    <div className={styles.layout}>
      <div className={styles.column}>{children}</div>
      <aside className={styles.panel} aria-label={panelLabel}>
        {panel}
      </aside>
    </div>
  );
}
