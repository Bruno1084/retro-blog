'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './shell.module.css';

const LINKS = [
  { href: '/', label: 'Índice' },
  { href: '/ahora', label: 'Ahora' },
  { href: '/tags', label: 'Tags' },
  { href: '/graph', label: 'Grafo' },
  { href: '/about', label: 'About' },
];

function isCurrent(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/n/');
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra de consola (plan, sección 10.6). En móvil los links se pliegan en un menú. */
export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Al navegar, el menú móvil se cierra.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <a href="#contenido" className={styles.skip}>
        Saltar al contenido
      </a>

      <div className={styles.bar}>
        <Link href="/" className={styles.logo} aria-label="Bruno's Blog, ir al índice">
          BRUNO&apos;S BLOG<span className={styles.cursor} aria-hidden="true">_</span>
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="nav-principal"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav id="nav-principal" aria-label="Principal" className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <ul>
            {LINKS.map(({ href, label }) => {
              const current = isCurrent(pathname, href);
              return (
                <li key={href}>
                  <Link href={href} aria-current={current ? 'page' : undefined} className={current ? styles.current : undefined}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
