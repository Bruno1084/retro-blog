import { getDocMeta, getIndex } from '@/lib/content/load';
import { ogCard, OG_SIZE } from '@/lib/og/card';
import { TYPE_LABEL } from '@/lib/content/labels';
import { tagLabel } from '@/lib/content/tags';
import { SITE_NAME, formatDate } from '@/lib/site';

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return getIndex().map((doc) => ({ slug: doc.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const doc = getDocMeta((await params).slug);
  if (!doc) return ogCard({ title: SITE_NAME });
  return ogCard({
    title: doc.title,
    subtitle: doc.summary,
    meta: `${TYPE_LABEL[doc.type].singular} · ${formatDate(doc.created)} · ${doc.tags.map(tagLabel).join(', ')}`,
  });
}
