import { ogCard, OG_SIZE } from '@/lib/og/card';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return ogCard({ title: 'Jardín digital', subtitle: SITE_DESCRIPTION, meta: 'logs · notas · ideas' });
}
