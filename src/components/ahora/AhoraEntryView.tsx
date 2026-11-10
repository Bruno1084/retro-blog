import Link from 'next/link';
import type { ReactNode } from 'react';
import proseStyles from '@/components/mdx/prose.module.css';
import type { AhoraEntry } from '@/lib/content/types';
import { formatDate } from '@/lib/site';
import styles from './ahora.module.css';

/**
 * Entrada de "Ahora" en papel: la fecha es la cabecera. Sin panel de consola,
 * sin tipo ni madurez (cambios-manuscrito, sección 7).
 */
export function AhoraEntryView({
  entry,
  body,
  headingLevel = 1,
}: {
  entry: AhoraEntry;
  body: ReactNode;
  /** En /ahora el h1 es "Ahora" y la fecha baja a h2. */
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <article className={styles.entry}>
      <header className={styles.header}>
        <Heading className={styles.fecha}>
          <time dateTime={entry.fecha}>{formatDate(entry.fecha)}</time>
          {entry.draft && <span className="draft-mark"> [DRAFT]</span>}
        </Heading>
        {entry.titulo && <p className={styles.titulo}>{entry.titulo}</p>}
      </header>
      <div className={proseStyles.prose}>{body}</div>
    </article>
  );
}

/** Lista de entradas, de la más reciente a la más antigua. */
export function AhoraList({ entries, title }: { entries: AhoraEntry[]; title: string }) {
  if (entries.length === 0) return null;
  return (
    <section className={styles.list} aria-labelledby="ahora-lista-title">
      <h2 id="ahora-lista-title">{title}</h2>
      <ol>
        {entries.map((entry) => (
          <li key={entry.fecha}>
            <Link href={`/ahora/${entry.fecha}`}>
              <time dateTime={entry.fecha}>{formatDate(entry.fecha)}</time>
            </Link>
            {entry.titulo && <span className={styles.listTitulo}>{entry.titulo}</span>}
            {entry.draft && <span className="draft-mark"> [DRAFT]</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
