import { getAhora, getIndex } from '@/lib/content/load';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, formatDate } from '@/lib/site';

export const dynamic = 'force-static';

interface FeedItem {
  title: string;
  path: string;
  date: string; // YYYY-MM-DD
  description?: string;
  categories: string[];
}

/**
 * Feed de logs y entradas de "Ahora", ordenado por fecha de creación. Las notas
 * y pizcas se editan todo el tiempo y quedan fuera: un feed por `updated` sería
 * ruido (plan, Fase 7). "Ahora" es lo más cronológico del sitio, justo lo que sirve un feed.
 */
export function GET() {
  const logs: FeedItem[] = getIndex()
    .filter((doc) => doc.type === 'log' && !doc.draft)
    .map((doc) => ({ title: doc.title, path: `/n/${doc.slug}`, date: doc.created, description: doc.summary, categories: doc.tags }));

  const ahora: FeedItem[] = getAhora()
    .filter((entry) => !entry.draft)
    .map((entry) => ({
      title: `Ahora · ${formatDate(entry.fecha)}${entry.titulo ? ` · ${entry.titulo}` : ''}`,
      path: `/ahora/${entry.fecha}`,
      date: entry.fecha,
      categories: ['ahora'],
    }));

  const items = [...logs, ...ahora]
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'es'))
    .map((item) => {
      const url = `${SITE_URL}${item.path}`;
      return `    <item>
      <title>${escape(item.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${item.date}T00:00:00Z`).toUTCString()}</pubDate>
      ${item.description ? `<description>${escape(item.description)}</description>` : ''}
${item.categories.map((category) => `      <category>${escape(category)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escape(SITE_DESCRIPTION)}</description>
    <language>es</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
