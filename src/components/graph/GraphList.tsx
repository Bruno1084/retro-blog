import Link from 'next/link';
import type { GraphData, TagEntry } from '@/lib/content/types';
import { STATUS_LABEL, TYPE_LABEL } from '@/lib/content/labels';
import styles from './graphList.module.css';

/**
 * Alternativa accesible al canvas: la misma información como lista navegable,
 * documentos agrupados por tag con sus conexiones (plan, sección 9.3).
 */
export function GraphList({ graph, tags }: { graph: GraphData; tags: TagEntry[] }) {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoing = (id: string) => graph.edges.filter((edge) => edge.source === id).map((edge) => byId.get(edge.target)!);
  const incoming = (id: string) => graph.edges.filter((edge) => edge.target === id).map((edge) => byId.get(edge.source)!);

  return (
    <section className={styles.list} aria-labelledby="graph-list-title">
      <h2 id="graph-list-title">Documentos y conexiones</h2>
      {tags
        .filter((entry) => entry.count > 0)
        .map((entry) => (
          <section key={entry.tag} aria-labelledby={`tag-${entry.tag}`} className={styles.tag}>
            <h3 id={`tag-${entry.tag}`}>
              <Link href={`/tags/${entry.tag}`}>{entry.label}</Link>
            </h3>
            <ul>
              {entry.slugs.map((slug) => {
                const node = byId.get(slug);
                if (!node) return null;
                const out = outgoing(slug);
                const inc = incoming(slug);
                return (
                  <li key={slug}>
                    <Link href={`/n/${slug}`} className={styles.doc}>
                      {node.title}
                    </Link>{' '}
                    <span className={styles.meta}>
                      {TYPE_LABEL[node.type].singular} / {STATUS_LABEL[node.status]}
                    </span>
                    {out.length > 0 && <Connections label="Enlaza a" docs={out} />}
                    {inc.length > 0 && <Connections label="Mencionado en" docs={inc} />}
                    {out.length === 0 && inc.length === 0 && <p className={styles.none}>Sin conexiones.</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </section>
  );
}

function Connections({ label, docs }: { label: string; docs: { id: string; title: string }[] }) {
  return (
    <p className={styles.connections}>
      {label}:{' '}
      {docs.map((doc, index) => (
        <span key={doc.id}>
          {index > 0 && ', '}
          <Link href={`/n/${doc.id}`}>{doc.title}</Link>
        </span>
      ))}
    </p>
  );
}
