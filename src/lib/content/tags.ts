/**
 * Lista controlada de tags. Un tag que no esté acá hace fallar el build.
 * La clave es lo que se escribe en el frontmatter; `label` es lo que se muestra.
 * Son temas: de qué trata el texto. El formato lo dice el tipo (log, nota, pizca).
 * El orden es el de los filtros del índice.
 */
export const TAGS = {
  literatura: { label: 'Literatura', description: 'Novelas, cuentos y ficción escrita.' },
  cine: { label: 'Cine', description: 'Películas, series y animación: todo lo audiovisual.' },
  manga: { label: 'Manga', description: 'Lecturas de manga y notas sobre autores.' },
  videojuegos: { label: 'Videojuegos', description: 'Juegos, diseño y experiencias jugables.' },
  musica: { label: 'Música', description: 'Discos, artistas y escucha.' },
  arte: { label: 'Arte', description: 'Pintura, ilustración y todo lo que se mira.' },
  software: { label: 'Software', description: 'Programación, herramientas y arquitectura.' },
} as const satisfies Record<string, { label: string; description: string }>;

export type Tag = keyof typeof TAGS;

export const TAG_KEYS = Object.keys(TAGS) as Tag[];

export function isTag(value: string): value is Tag {
  return Object.hasOwn(TAGS, value);
}

export function tagLabel(tag: string): string {
  return isTag(tag) ? TAGS[tag].label : tag;
}
