import type { Heading } from '@/lib/content/types';
import styles from './document.module.css';

export function TableOfContents({ headings }: { headings: Heading[] }) {
  return (
    <nav className={styles.toc} aria-labelledby="toc-title">
      <h2 id="toc-title">Contenido</h2>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? styles.tocNested : undefined}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
