import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Backlinks } from '@/components/docs/Backlinks';
import { DocumentView } from '@/components/docs/DocumentView';
import { ConnectionsPanel } from '@/components/graph/ConnectionsPanel';
import { WithPanel } from '@/components/layout/WithPanel';
import { localSubgraph } from '@/lib/content/graph';
import { createResolver, getAhoraMentions, getBacklinks, getDocBody, getDocMeta, getGraph, getIndex } from '@/lib/content/load';
import { remarkWikiLinks } from '@/lib/content/wikilinks';
import { renderMdx } from '@/lib/mdx/render';
import { SITE_NAME } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return getIndex().map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: PageProps<'/n/[slug]'>): Promise<Metadata> {
  const doc = getDocMeta((await params).slug);
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.summary,
    alternates: { canonical: `/n/${doc.slug}` },
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      locale: 'es_AR',
      title: doc.title,
      description: doc.summary,
      url: `/n/${doc.slug}`,
      publishedTime: doc.created,
      modifiedTime: doc.updated,
      tags: doc.tags,
    },
  };
}

export default async function DocumentPage({ params }: PageProps<'/n/[slug]'>) {
  const doc = getDocMeta((await params).slug);
  if (!doc) notFound();

  const body = await renderMdx(getDocBody(doc), {
    remarkPlugins: [[remarkWikiLinks, { mode: 'render', resolve: createResolver() }]],
  });
  const graph = getGraph();

  return (
    <WithPanel
      panelLabel="Conexiones del documento"
      panel={
        <ConnectionsPanel
          slug={doc.slug}
          status={doc.status}
          depth1={localSubgraph(graph, doc.slug, 1)}
          depth2={localSubgraph(graph, doc.slug, 2)}
        />
      }
    >
      <DocumentView doc={doc} body={body}>
        <Backlinks docs={getBacklinks(doc.slug)} ahora={getAhoraMentions(doc.slug)} />
      </DocumentView>
    </WithPanel>
  );
}
