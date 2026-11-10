'use client';

import { useMemo, useState } from 'react';
import { STATUS_LABEL, STATUS_ORDER, TYPE_LABEL, TYPE_ORDER } from '@/lib/content/labels';
import type { DocType, GraphData, Status } from '@/lib/content/types';
import { GraphCanvas } from './GraphCanvas';
import { GraphLegend } from './GraphLegend';
import styles from './globalGraph.module.css';

/** Por debajo de este número de nodos el grafo global se ve pobre (plan, sección 9.3). */
export const MIN_NODES_FOR_CANVAS = 20;

export function GlobalGraph({ data, tags }: { data: GraphData; tags: { tag: string; label: string }[] }) {
  const tooFew = data.nodes.length < MIN_NODES_FOR_CANVAS;
  const [showAnyway, setShowAnyway] = useState(false);
  const [types, setTypes] = useState<Set<DocType>>(new Set());
  const [statuses, setStatuses] = useState<Set<Status>>(new Set());
  const [tag, setTag] = useState<string | null>(null);
  const [onlyTag, setOnlyTag] = useState(false);
  const [query, setQuery] = useState('');
  const [centerOn, setCenterOn] = useState<string | null>(null);

  const hidden = useMemo(() => {
    const ids = new Set<string>();
    for (const node of data.nodes) {
      if (types.size > 0 && !types.has(node.type)) ids.add(node.id);
      if (statuses.size > 0 && !statuses.has(node.status)) ids.add(node.id);
      if (tag && onlyTag && !node.tags.includes(tag)) ids.add(node.id);
    }
    return ids;
  }, [data, types, statuses, tag, onlyTag]);

  const matches = query.trim()
    ? data.nodes.filter((node) => !hidden.has(node.id) && normalize(node.title).includes(normalize(query))).slice(0, 8)
    : [];

  const select = (id: string) => {
    setCenterOn(id);
    setQuery('');
  };

  if (tooFew && !showAnyway) {
    return (
      <div className={`console ${styles.notice}`}>
        <h2 className="console-label">Grafo</h2>
        <p>
          El jardín tiene {data.nodes.length} {data.nodes.length === 1 ? 'documento' : 'documentos'} todavía. Con menos de{' '}
          {MIN_NODES_FOR_CANVAS} el grafo se ve casi vacío, así que abajo está la misma información como lista.
        </p>
        <button type="button" className={styles.button} onClick={() => setShowAnyway(true)}>
          Ver el grafo igual
        </button>
      </div>
    );
  }

  return (
    <div className={`console ${styles.wrapper}`}>
      <h2 className="console-label">Grafo</h2>
      <div className={styles.controls}>
        <form
          className={styles.search}
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (matches[0]) select(matches[0].id);
          }}
        >
          <label htmlFor="graph-search">Buscar</label>
          <input
            id="graph-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Título del documento"
            autoComplete="off"
          />
          {matches.length > 0 && (
            <ul className={styles.results}>
              {matches.map((node) => (
                <li key={node.id}>
                  <button type="button" onClick={() => select(node.id)}>
                    {node.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <fieldset className={styles.group}>
          <legend>Tipo</legend>
          {TYPE_ORDER.map((value) => (
            <Toggle key={value} active={types.has(value)} onClick={() => setTypes(toggle(types, value))}>
              {TYPE_LABEL[value].plural}
            </Toggle>
          ))}
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Estado</legend>
          {STATUS_ORDER.map((status) => (
            <Toggle key={status} active={statuses.has(status)} onClick={() => setStatuses(toggle(statuses, status))}>
              {STATUS_LABEL[status]}
            </Toggle>
          ))}
        </fieldset>

        <div className={styles.group}>
          <label htmlFor="graph-tag">Resaltar tag</label>
          <select id="graph-tag" value={tag ?? ''} onChange={(event) => setTag(event.target.value || null)}>
            <option value="">Ninguno</option>
            {tags.map((entry) => (
              <option key={entry.tag} value={entry.tag}>
                {entry.label}
              </option>
            ))}
          </select>
          <label className={styles.check}>
            <input type="checkbox" checked={onlyTag} disabled={!tag} onChange={(event) => setOnlyTag(event.target.checked)} />
            Solo este tag
          </label>
        </div>
      </div>

      <div className={styles.canvas}>
        <GraphCanvas
          data={data}
          height={560}
          highlightTag={tag}
          hiddenIds={hidden}
          centerOn={centerOn}
          cooldownTicks={200}
          ariaLabel={`Grafo de ${data.nodes.length} documentos y ${data.edges.length} conexiones. La lista debajo tiene la misma información.`}
        />
      </div>
      <GraphLegend />
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`${styles.toggle} ${active ? styles.active : ''}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
