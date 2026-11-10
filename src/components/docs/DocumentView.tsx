import Link from 'next/link';
import type { ReactNode } from 'react';
import proseStyles from '@/components/mdx/prose.module.css';
import { STATUS_LABEL, TYPE_LABEL } from '@/lib/content/labels';
import { tagLabel } from '@/lib/content/tags';
import type { IndexedDoc } from '@/lib/content/types';
import { AUTHOR, formatDate } from '@/lib/site';
import styles from './document.module.css';
import { TableOfContents } from './TableOfContents';

/** Con menos headings un índice no aporta. */
const TOC_MIN_HEADINGS = 3;

/** Documento en papel: cabecera, cuerpo ya renderizado y lo que venga después (backlinks). */
export function DocumentView({ doc, body, children }: { doc: IndexedDoc; body: ReactNode; children?: ReactNode }) {
  return (
    <article>
      <header className={styles.header}>
        <p className="meta">
          {[TYPE_LABEL[doc.type].singular, STATUS_LABEL[doc.status], `${doc.readingMinutes} min`]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className={styles.dates}>
          Plantado el <time dateTime={doc.created}>{formatDate(doc.created)}</time>
          {doc.updated !== doc.created && (
            <>
              {' '}
              · Cuidado por última vez el <time dateTime={doc.updated}>{formatDate(doc.updated)}</time>
            </>
          )}
        </p>
        <h1 className={styles.title}>
          {doc.title}
          {doc.draft && <span className="draft-mark"> [DRAFT]</span>}
        </h1>
        {doc.summary && <p className={styles.summary}>{doc.summary}</p>}
        <ul className="tag-list" aria-label="Tags">
          {doc.tags.map((tag, index) => (
            <li key={tag}>
              <Link href={`/tags/${tag}`} className={`tag-item ${index === 0 ? 'tag-item--primary' : ''}`}>
                {tagLabel(tag)}
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.byline}>
          por{' '}
          <a href={AUTHOR.url} target="_blank" rel="noopener noreferrer">
            {AUTHOR.name}
          </a>
        </p>
      </header>

      {doc.headings.length >= TOC_MIN_HEADINGS && <TableOfContents headings={doc.headings} />}

      <div className={proseStyles.prose}>{body}</div>

      {children}
    </article>
  );
}
