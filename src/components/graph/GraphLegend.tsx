import styles from './graph.module.css';

/** Leyenda de la codificación visual del grafo (plan, sección 10.6). */
export function GraphLegend() {
  return (
    <dl className={styles.legend}>
      <div>
        <dt>
          <svg width="12" height="12" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" fill="currentColor" />
          </svg>
        </dt>
        <dd>log</dd>
      </div>
      <div>
        <dt>
          <svg width="12" height="12" aria-hidden="true">
            <circle cx="6" cy="6" r="5" fill="currentColor" />
          </svg>
        </dt>
        <dd>nota</dd>
      </div>
      <div>
        <dt>
          <svg width="12" height="12" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </dt>
        <dd>pizca</dd>
      </div>
      <div className={styles.legendNote}>
        <dt className="visually-hidden">Opacidad</dt>
        <dd>tenue = semilla, sólido = árbol. Tamaño = conexiones.</dd>
      </div>
    </dl>
  );
}
