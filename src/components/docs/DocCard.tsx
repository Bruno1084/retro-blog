import Link from 'next/link';
import { STATUS_LABEL, TYPE_LABEL } from '@/lib/content/labels';
import { tagLabel } from '@/lib/content/tags';
import type { Anotaciones, DocMeta } from '@/lib/content/types';
import { formatDate } from '@/lib/site';
import styles from './docCard.module.css';

type CardDoc = DocMeta & { readingMinutes?: number; anotaciones?: Anotaciones };

/** Entrada del índice en papel, estilo maqueta A·1 (plan, sección 10.6). */
export function DocCard({ doc, compact = false }: { doc: CardDoc; compact?: boolean }) {
  const meta = [TYPE_LABEL[doc.type].singular];
  meta.push(doc.tags.map(tagLabel).join(', '));
  if (doc.readingMinutes) meta.push(`${doc.readingMinutes} min`);

  return (
    <article className={`${styles.card} ${compact ? styles.compact : ''}`}>
      <p className="meta">{meta.join(' · ')}</p>
      <h2 className={styles.title}>
        <Link href={`/n/${doc.slug}`}>{doc.title}</Link>
        {doc.draft && <span className="draft-mark"> [DRAFT]</span>}
      </h2>
      {doc.summary && <p className={styles.summary}>{doc.summary}</p>}
      {!compact && (
        <p className={styles.status}>
          {STATUS_LABEL[doc.status]} · cuidado el <time dateTime={doc.updated}>{formatDate(doc.updated)}</time>
        </p>
      )}
      {!compact && doc.anotaciones && doc.anotaciones.total > 0 && (
        <p className={styles.anotaciones}>
          {doc.anotaciones.total} {doc.anotaciones.total === 1 ? 'anotación' : 'anotaciones'}
          {doc.anotaciones.ultima && (
            <>
              {' '}
              · última el <time dateTime={doc.anotaciones.ultima}>{formatDate(doc.anotaciones.ultima)}</time>
            </>
          )}
        </p>
      )}
    </article>
  );
}
