'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MaturityMeter } from '@/components/console/Maturity';
import type { GraphData, Status } from '@/lib/content/types';
import { GraphCanvas } from './GraphCanvas';
import { GraphLegend } from './GraphLegend';
import styles from './graph.module.css';

/**
 * Panel de consola del documento (plan, sección 10.6): grafo local, conteo de
 * enlaces y madurez. Ambos subgrafos se calculan en build; el toggle a
 * profundidad 2 solo aparece si agrega nodos.
 */
export function ConnectionsPanel({
  slug,
  status,
  depth1,
  depth2,
}: {
  slug: string;
  status: Status;
  depth1: GraphData;
  depth2: GraphData;
}) {
  const [depth, setDepth] = useState<1 | 2>(1);
  const data = depth === 1 ? depth1 : depth2;
  const canExpand = depth2.nodes.length > depth1.nodes.length;
  const incoming = depth1.edges.filter((edge) => edge.target === slug).length;
  const outgoing = depth1.edges.filter((edge) => edge.source === slug).length;

  return (
    <section className="console" aria-labelledby="conexiones-title">
      <div className={styles.panelHeader}>
        <h2 id="conexiones-title" className="console-label">
          Conexiones
        </h2>
        {canExpand && (
          <button type="button" className={styles.toggle} onClick={() => setDepth(depth === 1 ? 2 : 1)} aria-pressed={depth === 2}>
            prof. {depth === 1 ? '2' : '1'}
          </button>
        )}
      </div>

      {depth1.nodes.length <= 1 ? (
        <p className={styles.emptyLocal}>Este documento todavía no tiene conexiones.</p>
      ) : (
        <div className={styles.canvasFrame}>
          <GraphCanvas
            data={data}
            height={220}
            focusId={slug}
            cooldownTicks={80}
            alwaysShowLabels={data.nodes.length <= 8}
            ariaLabel={`Grafo local con ${data.nodes.length - 1} documentos conectados. La misma información está en "Mencionado en" y en los enlaces del texto.`}
          />
        </div>
      )}

      <ul className={styles.stats}>
        <li>
          entrantes <span className="console-value">{incoming}</span>
        </li>
        <li>
          salientes <span className="console-value">{outgoing}</span>
        </li>
        <li>
          madurez <MaturityMeter status={status} />
        </li>
      </ul>

      <GraphLegend />

      <Link href="/graph" className={styles.more}>
        Ver el grafo completo
      </Link>
    </section>
  );
}
