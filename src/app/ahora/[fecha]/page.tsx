import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AhoraEntryView } from '@/components/ahora/AhoraEntryView';
import styles from '@/components/ahora/ahora.module.css';
import { createResolver, getAhora, getAhoraBody, getAhoraEntry } from '@/lib/content/load';
import { remarkWikiLinks } from '@/lib/content/wikilinks';
import { renderMdx } from '@/lib/mdx/render';
import { formatDate } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAhora().map((entry) => ({ fecha: entry.fecha }));
}

export async function generateMetadata({ params }: PageProps<'/ahora/[fecha]'>): Promise<Metadata> {
  const entry = getAhoraEntry((await params).fecha);
  if (!entry) return {};
  const title = `Ahora · ${formatDate(entry.fecha)}${entry.titulo ? ` · ${entry.titulo}` : ''}`;
  return { title, alternates: { canonical: `/ahora/${entry.fecha}` } };
}

export default async function AhoraEntryPage({ params }: PageProps<'/ahora/[fecha]'>) {
  const { fecha } = await params;
  const entry = getAhoraEntry(fecha);
  if (!entry) notFound();

  // Las entradas vienen de la más reciente a la más antigua.
  const entries = getAhora();
  const position = entries.findIndex((candidate) => candidate.fecha === fecha);
  const newer = entries[position - 1];
  const older = entries[position + 1];

  const body = await renderMdx(getAhoraBody(entry), {
    remarkPlugins: [[remarkWikiLinks, { mode: 'render', resolve: createResolver() }]],
  });

  return (
    <div className="main--container">
      <p className="meta">
        <Link href="/ahora">Ahora</Link>
      </p>
      <AhoraEntryView entry={entry} body={body} />

      {(older || newer) && (
        <nav className={styles.pager} aria-label="Otras entradas">
          {older && (
            <Link href={`/ahora/${older.fecha}`} rel="prev">
              ← {formatDate(older.fecha)}
            </Link>
          )}
          {newer && (
            <Link href={`/ahora/${newer.fecha}`} rel="next" className={styles.next}>
              {formatDate(newer.fecha)} →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
