import type { Metadata } from 'next';
import Link from 'next/link';
import { getTags } from '@/lib/content/load';
import styles from './tags.module.css';

export const metadata: Metadata = { title: 'Tags', description: 'Todos los temas del jardín.' };

export default function TagsPage() {
  const tags = getTags();

  return (
    <div className="main--container">
      <h1 className="page-title">Tags</h1>
      <p className="page-lead">Cada documento puede tener varios. La lista es cerrada para que no se dispersen.</p>

      <ul className={styles.list}>
        {tags.map((entry) => (
          <li key={entry.tag} className={entry.count === 0 ? styles.empty : undefined}>
            {entry.count > 0 ? (
              <Link href={`/tags/${entry.tag}`} className={styles.name}>
                {entry.label}
              </Link>
            ) : (
              <span className={styles.name}>{entry.label}</span>
            )}
            <span className="meta">
              {entry.count} {entry.count === 1 ? 'documento' : 'documentos'}
            </span>
            <p className={styles.description}>{entry.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
