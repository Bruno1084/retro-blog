import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Backlinks } from '@/components/docs/Backlinks';
import { DocumentView } from '@/components/docs/DocumentView';
import { DocTypes } from '@/components/docs/DocTypes';
import { ABOUT_SLUG } from '@/lib/content/config';
import { createResolver, getAhoraMentions, getBacklinks, getDocBody, getDocMeta } from '@/lib/content/load';
import { remarkWikiLinks } from '@/lib/content/wikilinks';
import { renderMdx } from '@/lib/mdx/render';

/** /about muestra el log de propósito del sitio; la URL canónica sigue siendo /n/<slug>. */
export function generateMetadata(): Metadata {
  const doc = getDocMeta(ABOUT_SLUG);
  return {
    title: 'About',
    description: doc?.summary,
    alternates: { canonical: `/n/${ABOUT_SLUG}` },
  };
}

export default async function AboutPage() {
  const doc = getDocMeta(ABOUT_SLUG);
  if (!doc) notFound();

  const body = await renderMdx(getDocBody(doc), {
    remarkPlugins: [[remarkWikiLinks, { mode: 'render', resolve: createResolver() }]],
  });

  return (
    <div className="main--container">
      <DocumentView doc={doc} body={body}>
        <DocTypes />
        <Backlinks docs={getBacklinks(doc.slug)} ahora={getAhoraMentions(doc.slug)} />
      </DocumentView>
    </div>
  );
}
