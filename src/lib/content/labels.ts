import type { DocType, Status } from './types';

/**
 * Etiquetas visibles de tipos y estados. Los valores internos (frontmatter, JSON)
 * van sin tilde, como los slugs; ningún componente escribe estas palabras a mano.
 */
export const TYPE_LABEL: Record<DocType, { singular: string; plural: string; description: string }> = {
  log: { singular: 'Log', plural: 'Logs', description: 'Recorridos largos sobre un tema. Tienen hilo, no necesariamente conclusión.' },
  nota: { singular: 'Nota', plural: 'Notas', description: 'Exploraciones de cosas que todavía no entiendo del todo.' },
  pizca: { singular: 'Pizca', plural: 'Pizcas', description: 'Enlaces, citas y pensamientos diminutos.' },
};

export const TYPE_ORDER: DocType[] = ['log', 'nota', 'pizca'];

export const STATUS_LABEL: Record<Status, string> = {
  semilla: 'Semilla',
  brote: 'Brote',
  arbol: 'Árbol',
};

/** Orden de madurez; el índice + 1 es la cantidad de segmentos del medidor (▮▯▯ / ▮▮▯ / ▮▮▮). */
export const STATUS_ORDER: Status[] = ['semilla', 'brote', 'arbol'];
