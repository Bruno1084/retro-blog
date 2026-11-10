import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { Header } from '@/components/shell/Header';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

/** Fuente de todo el texto (plan, sección 10.4). */
const plexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-plex-mono',
  display: 'swap',
});

/** Solo para el logo: es donde sobrevive la estética Sevastopol. */
const sevastopol = localFont({
  src: '../assets/fonts/Sevastopol-Interface.ttf',
  variable: '--font-sevastopol',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { types: { 'application/rss+xml': [{ url: '/rss.xml', title: `${SITE_NAME}: logs y Ahora` }] } },
  openGraph: { type: 'website', locale: 'es_AR', siteName: SITE_NAME },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${plexMono.variable} ${sevastopol.variable}`}>
      <body>
        <Header />
        <main id="contenido">{children}</main>
      </body>
    </html>
  );
}
