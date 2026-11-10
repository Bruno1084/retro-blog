import Image from 'next/image';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { isIsoDate } from '@/lib/content/anotaciones';
import { formatDate } from '@/lib/site';
import styles from './prose.module.css';

/** Fecha legible de una anotación. Una fecha inválida corta el build de producción; en dev se muestra tal cual. */
function fechaLegible(fecha: string | undefined): string | null {
  if (!fecha) return null;
  return isIsoDate(fecha) ? formatDate(fecha) : fecha;
}

export function Cita({ autor, fuente, url, children }: { autor?: string; fuente?: string; url?: string; children: ReactNode }) {
  const source = fuente && (url ? <a href={url} target="_blank" rel="noopener noreferrer" className="external">{fuente}</a> : fuente);
  return (
    <figure className={styles.cita}>
      <blockquote>{children}</blockquote>
      {(autor || fuente) && (
        <figcaption>
          {autor}
          {autor && fuente && ', '}
          {source && <cite>{source}</cite>}
        </figcaption>
      )}
    </figure>
  );
}

export function Aparte({ children }: { children: ReactNode }) {
  return (
    <aside className={styles.aparte}>
      <span className={styles.aparteLabel}>Aparte</span>
      {children}
    </aside>
  );
}

/**
 * Nota al margen: anotación posterior al texto, con fecha. Se escribe después
 * del párrafo que anota; `rehype-anotaciones` la agrupa con él para el layout.
 */
export function Nota({ fecha, children }: { fecha?: string; children?: ReactNode }) {
  const legible = fechaLegible(fecha);
  return (
    <aside className={styles.nota} aria-label={legible ? `Nota del ${legible}` : 'Nota sin fecha'}>
      {legible && <time dateTime={fecha}>{legible}</time>}
      {children}
    </aside>
  );
}

/**
 * Cambio de idea visible: texto eliminado / agregado con fecha. El texto oculto
 * existe porque varios lectores de pantalla no anuncian `<del>` ni `<ins>`.
 * Solo se tacha cuando cambia una idea; la ortografía se corrige sin rastro.
 */
export function Tachado({ fecha, children }: { fecha?: string; children?: ReactNode }) {
  const legible = fechaLegible(fecha);
  const descripcion = legible ? `eliminado el ${legible}` : 'eliminado';
  return (
    <del dateTime={fecha} title={`Texto ${descripcion}`} data-fecha={descripcion} tabIndex={0} className={styles.tachado}>
      <span className="visually-hidden">[texto {descripcion}] </span>
      {children}
    </del>
  );
}

export function Agregado({ fecha, children }: { fecha?: string; children?: ReactNode }) {
  const legible = fechaLegible(fecha);
  const descripcion = legible ? `agregado el ${legible}` : 'agregado';
  return (
    <ins dateTime={fecha} title={`Texto ${descripcion}`} data-fecha={descripcion} tabIndex={0} className={styles.agregado}>
      <span className="visually-hidden">[texto {descripcion}] </span>
      {children}
    </ins>
  );
}

/** Sección planificada pero sin escribir: que un hueco no parezca un corte del texto. */
export function PorEscribir({ children }: { children?: ReactNode }) {
  return (
    <aside className={styles.porEscribir} aria-label="Sección por escribir">
      <span className={styles.porEscribirLabel}>Por escribir</span>
      {children}
    </aside>
  );
}

function MdxLink({ href = '', children, ...rest }: ComponentProps<'a'>) {
  if (href.startsWith('/')) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

function MdxImage({ src, alt = '', width, height }: ComponentProps<'img'>) {
  if (typeof src !== 'string') return null;
  if (!width || !height) {
    // Imágenes externas: sin dimensiones conocidas no se pueden pasar por next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={Number(width)}
      height={Number(height)}
      sizes="(max-width: 720px) 100vw, 720px"
      unoptimized={src.endsWith('.svg')}
    />
  );
}

export const mdxComponents = {
  a: MdxLink,
  img: MdxImage,
  Cita,
  Aparte,
  PorEscribir,
  Nota,
  Tachado,
  Agregado,
};
