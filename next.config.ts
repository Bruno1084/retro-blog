import fs from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Los aliases del frontmatter (slugs anteriores) redirigen de forma permanente
 * al slug actual, así renombrar un archivo no rompe links externos.
 * El índice lo genera `npm run content`, que corre antes de `next dev` y `next build`.
 */
function aliasRedirects() {
  const file = path.join(process.cwd(), '.generated', 'content-index.json');
  if (!fs.existsSync(file)) return [];
  const docs = JSON.parse(fs.readFileSync(file, 'utf8')) as { slug: string; aliases: string[] }[];
  return docs.flatMap((doc) =>
    doc.aliases.map((alias) => ({ source: `/n/${alias}`, destination: `/n/${doc.slug}`, permanent: true })),
  );
}

const nextConfig: NextConfig = {
  async redirects() {
    return aliasRedirects();
  },
};

export default nextConfig;
