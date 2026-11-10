import path from 'node:path';

export const ROOT_DIR = process.cwd();
export const CONTENT_DIR = path.join(ROOT_DIR, 'content');
export const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
export const GENERATED_DIR = path.join(ROOT_DIR, '.generated');

/** Días sin actualizar a partir de los cuales una `semilla` se considera abandonada. */
export const STALE_SEMILLA_DAYS = 90;
/** Días sin actualizar a partir de los cuales un `arbol` merece revisión. */
export const STALE_ARBOL_DAYS = 365;

/** Subcarpeta de /content con las entradas de "Ahora". */
export const AHORA_DIR = 'ahora';
/** Días sin entradas nuevas a partir de los cuales "Ahora" se considera desactualizada. */
export const STALE_AHORA_DAYS = 60;

/** Fuente del logo (Sevastopol Interface). La usan las imágenes OpenGraph. */
export const FONT_PATH = path.join(ROOT_DIR, 'src', 'assets', 'fonts', 'Sevastopol-Interface.ttf');

/** Slug del log que se muestra en /about. */
export const ABOUT_SLUG = 'introduccion-al-jardin-digital';
