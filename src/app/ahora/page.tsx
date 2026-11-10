import type { Metadata } from 'next';
import { AhoraEntryView, AhoraList } from '@/components/ahora/AhoraEntryView';
import styles from '@/components/ahora/ahora.module.css';
import { createResolver, getAhora, getAhoraBody } from '@/lib/content/load';
import { remarkWikiLinks } from '@/lib/content/wikilinks';
import { renderMdx } from '@/lib/mdx/render';

export const metadata: Metadata = {
  title: 'Ahora',
  description: 'Entradas fechadas sobre lo que ocupa estos días.',
  alternates: { canonical: '/ahora' },
};

/** /ahora: la entrada más reciente con la fecha bien visible, y debajo las anteriores. */
export default async function AhoraPage() {
  const [latest, ...previous] = getAhora();

  return (
    <div className="main--container">
      <h1 className="page-title">Ahora</h1>
      <p className="page-lead">Entradas fechadas sobre lo que ocupa estos días. Sin tema ni estado de madurez.</p>

      {latest ? (
        <AhoraEntryView
          entry={latest}
          headingLevel={2}
          body={await renderMdx(getAhoraBody(latest), {
            remarkPlugins: [[remarkWikiLinks, { mode: 'render', resolve: createResolver() }]],
          })}
        />
      ) : (
        <p className={styles.empty}>Todavía no hay entradas.</p>
      )}

      <AhoraList entries={previous} title="Entradas anteriores" />
    </div>
  );
}
