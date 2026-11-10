'use client';

import { useState } from 'react';
import { TYPE_LABEL, TYPE_ORDER } from '@/lib/content/labels';
import type { Anotaciones, DocMeta, DocType } from '@/lib/content/types';
import { DocCard } from './DocCard';
import styles from './docIndex.module.css';

/** Listado del índice con filtros por tipo y tag. Los documentos ya vienen ordenados. */
export function DocIndex({
  docs,
  tags,
}: {
  docs: (DocMeta & { readingMinutes?: number; anotaciones?: Anotaciones })[];
  tags: { tag: string; label: string; count: number }[];
}) {
  const [type, setType] = useState<DocType | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const visible = docs.filter((doc) => (!type || doc.type === type) && (!tag || doc.tags.includes(tag)));
  const availableTypes = TYPE_ORDER.filter((value) => docs.some((doc) => doc.type === value));

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filtros">
        <FilterRow label="Tipo">
          <Chip active={type === null} onClick={() => setType(null)}>
            Todos
          </Chip>
          {availableTypes.map((value) => (
            <Chip key={value} active={type === value} onClick={() => setType(type === value ? null : value)}>
              {TYPE_LABEL[value].plural}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Tag">
          <Chip active={tag === null} onClick={() => setTag(null)}>
            Todos
          </Chip>
          {tags.map((entry) => (
            <Chip
              key={entry.tag}
              active={tag === entry.tag}
              disabled={entry.count === 0}
              onClick={() => setTag(tag === entry.tag ? null : entry.tag)}
            >
              {entry.label} <span className={styles.chipCount}>{entry.count}</span>
            </Chip>
          ))}
        </FilterRow>
      </div>

      {type && <p className={styles.typeDescription}>{TYPE_LABEL[type].description}</p>}

      <p className={`meta ${styles.count}`} aria-live="polite">
        {visible.length === docs.length ? `${docs.length} documentos` : `${visible.length} de ${docs.length} documentos`}
      </p>

      {visible.length === 0 ? (
        <p className={styles.empty}>Ningún documento coincide con estos filtros.</p>
      ) : (
        visible.map((doc) => <DocCard key={doc.slug} doc={doc} />)
      )}
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.chips}>{children}</div>
    </div>
  );
}

function Chip({
  active,
  disabled = false,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.active : ''}`}
      aria-pressed={active}
      disabled={disabled}
      title={disabled ? 'Todavía no hay documentos con este tag' : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
