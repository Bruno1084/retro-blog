import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { FONT_PATH, ROOT_DIR } from '@/lib/content/config';

export const OG_SIZE = { width: 1200, height: 630 };

const PLEX_DIR = path.join(ROOT_DIR, 'node_modules', '@fontsource', 'ibm-plex-mono', 'files');

/**
 * Tarjeta OpenGraph "papel y consola": banda de consola con el logo y el resto en papel.
 * Los colores repiten los tokens de globals.css (Satori no lee CSS).
 */
export function ogCard({ title, subtitle, meta }: { title: string; subtitle?: string; meta?: string }) {
  const fonts = [
    { name: 'Sevastopol', data: fs.readFileSync(FONT_PATH), style: 'normal' as const, weight: 400 as const },
    { name: 'Plex', data: fs.readFileSync(path.join(PLEX_DIR, 'ibm-plex-mono-latin-400-normal.woff')), style: 'normal' as const, weight: 400 as const },
    { name: 'Plex', data: fs.readFileSync(path.join(PLEX_DIR, 'ibm-plex-mono-latin-500-normal.woff')), style: 'normal' as const, weight: 500 as const },
  ];

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#f2ede3', fontFamily: 'Plex' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 96, padding: '0 72px', background: '#16100a' }}>
          <div style={{ display: 'flex', fontFamily: 'Sevastopol', fontSize: 40, letterSpacing: 3, color: '#ff9f1c' }}>BRUNO&apos;S BLOG_</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 72px', gap: 24 }}>
          {meta && <div style={{ display: 'flex', fontSize: 24, letterSpacing: 2, color: '#6b5f4e' }}>{meta.toUpperCase()}</div>}
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 500, lineHeight: 1.15, color: '#2a231b' }}>{title}</div>
          {subtitle && <div style={{ display: 'flex', fontSize: 30, lineHeight: 1.4, color: '#6b5f4e' }}>{subtitle}</div>}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
