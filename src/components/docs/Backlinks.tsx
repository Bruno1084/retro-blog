import Link from 'next/link';
import type { AhoraMention, IndexedDoc } from '@/lib/content/types';
import { formatDate } from '@/lib/site';
import cardStyles from './docCard.module.css';
import { DocCard } from './DocCard';
import styles from './document.module.css';

/**
 * "Mencionado en…": resuelto en build, sin JS en cliente (plan, sección 9.1).
 * Las menciones desde "Ahora" van después de los documentos, con su origen.
 */
export function Backlinks({ docs, ahora = [] }: { docs: IndexedDoc[]; ahora?: AhoraMention[] }) {
  return (
    <section className={styles.backlinks} aria-labelledby="backlinks-title">
      <h2 id="backlinks-title">Mencionado en</h2>
      {docs.length === 0 && ahora.length === 0 && <p className={styles.empty}>Ningún documento enlaza a este todavía.</p>}
      {docs.map((doc) => (
        <DocCard key={doc.slug} doc={doc} compact />
      ))}
      {ahora.map((mention) => (
        <article key={mention.fecha} className={`${cardStyles.card} ${cardStyles.compact}`}>
          <p className="meta">Ahora</p>
          <h3 className={cardStyles.title}>
            <Link href={`/ahora/${mention.fecha}`}>
              Ahora · <time dateTime={mention.fecha}>{formatDate(mention.fecha)}</time>
              {mention.titulo && ` · ${mention.titulo}`}
            </Link>
          </h3>
        </article>
      ))}
    </section>
  );
}
