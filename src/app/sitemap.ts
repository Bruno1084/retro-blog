import type { MetadataRoute } from 'next';
import { getAhora, getIndex, getTags } from '@/lib/content/load';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = getIndex().filter((doc) => !doc.draft);
  const latest = docs.reduce((max, doc) => (doc.updated > max ? doc.updated : max), '1970-01-01');
  const ahora = getAhora().filter((entry) => !entry.draft);

  return [
    { url: `${SITE_URL}/`, lastModified: latest },
    { url: `${SITE_URL}/ahora`, lastModified: ahora[0]?.fecha ?? latest },
    { url: `${SITE_URL}/about`, lastModified: latest },
    { url: `${SITE_URL}/tags`, lastModified: latest },
    { url: `${SITE_URL}/graph`, lastModified: latest },
    ...getTags()
      .filter((entry) => entry.count > 0)
      .map((entry) => ({ url: `${SITE_URL}/tags/${entry.tag}`, lastModified: latest })),
    ...docs.map((doc) => ({ url: `${SITE_URL}/n/${doc.slug}`, lastModified: doc.updated })),
    ...ahora.map((entry) => ({ url: `${SITE_URL}/ahora/${entry.fecha}`, lastModified: entry.fecha })),
  ];
}
