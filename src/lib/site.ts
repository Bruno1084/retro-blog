export const SITE_NAME = "Bruno's Blog";
export const SITE_DESCRIPTION = 'Jardín digital de Bruno: logs, notas y pizcas sobre literatura, cine, manga, videojuegos y software.';
export const AUTHOR = { name: 'Bruno', url: 'https://porfolio-bruno.netlify.app/' } as const;

/** URL pública del sitio. En Vercel se toma del dominio de producción si no se define `SITE_URL`. */
export const SITE_URL = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/$/, '');

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** `2026-10-06` -> `6 oct 2026` (sin el "de" que agrega `es-AR`). */
export function formatDate(iso: string): string {
  const parts = dateFormat.formatToParts(new Date(`${iso}T00:00:00Z`));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')} ${get('month').replace('.', '')} ${get('year')}`;
}
