import type { Link, Parent, PhrasingContent, Root, Text } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';
import { slugify } from './slug';

/**
 * Plugin de wikilinks `[[target]]` / `[[target|texto visible]]`.
 *
 * Un único núcleo (`splitWikiLinks`) y dos modos, para que extracción y render
 * no puedan desincronizarse (plan, sección 6.4):
 *   - `extract`: registra cada wikilink en `collect`; no modifica el árbol.
 *   - `render`: reemplaza cada wikilink por un nodo `link` a `/n/<slug>`.
 */

const WIKILINK = /\[\[([^\[\]|\n]+?)(?:\|([^\[\]\n]+?))?\]\]/g;

export interface WikiLinkMatch {
  /** Texto del target tal como se escribió. */
  raw: string;
  /** Target normalizado con la misma función que los slugs de archivo. */
  target: string;
  /** Texto visible, si se escribió con `|`. */
  label?: string;
  /** Línea relativa al cuerpo (1-based). */
  line: number;
}

type Segment = { kind: 'text'; value: string } | { kind: 'wikilink'; raw: string; label?: string; offset: number };

export function splitWikiLinks(value: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of value.matchAll(WIKILINK)) {
    const index = match.index;
    if (index > last) segments.push({ kind: 'text', value: value.slice(last, index) });
    segments.push({ kind: 'wikilink', raw: match[1]!.trim(), label: match[2]?.trim(), offset: index });
    last = index + match[0].length;
  }
  if (last < value.length) segments.push({ kind: 'text', value: value.slice(last) });
  return segments;
}

export type ResolvedLink = { slug: string; title: string } | null;

export type WikiLinkOptions =
  | { mode: 'extract'; collect: WikiLinkMatch[] }
  | { mode: 'render'; resolve: (target: string) => ResolvedLink };

export function remarkWikiLinks(options: WikiLinkOptions) {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent: Parent | undefined) => {
      if (!node.value.includes('[[')) return;
      // Un wikilink dentro de un link markdown no se interpreta: no puede haber links anidados.
      if (parent?.type === 'link' || parent?.type === 'linkReference') return;
      const segments = splitWikiLinks(node.value);
      if (!segments.some((segment) => segment.kind === 'wikilink')) return;

      const startLine = node.position?.start.line ?? 0;
      const lineAt = (offset: number) => startLine + (node.value.slice(0, offset).match(/\n/g)?.length ?? 0);

      if (options.mode === 'extract') {
        for (const segment of segments) {
          if (segment.kind !== 'wikilink') continue;
          options.collect.push({
            raw: segment.raw,
            target: slugify(segment.raw),
            label: segment.label,
            line: lineAt(segment.offset),
          });
        }
        return;
      }

      if (!parent || index === undefined) return;
      const replacement: PhrasingContent[] = segments.map((segment) => {
        if (segment.kind === 'text') return { type: 'text', value: segment.value };
        return toLink(segment, options.resolve(slugify(segment.raw)));
      });
      parent.children.splice(index, 1, ...(replacement as Parent['children']));
      return [SKIP, index + replacement.length];
    });
  };
}

function toLink(segment: Extract<Segment, { kind: 'wikilink' }>, resolved: ResolvedLink): Link {
  const text = segment.label ?? resolved?.title ?? segment.raw;
  if (!resolved) {
    // Solo puede ocurrir en dev: en producción un link roto hace fallar el build.
    return {
      type: 'link',
      url: '#',
      children: [{ type: 'text', value: text }],
      data: { hProperties: { className: ['wikilink', 'wikilink--broken'], title: `No existe: ${segment.raw}` } },
    };
  }
  return {
    type: 'link',
    url: `/n/${resolved.slug}`,
    children: [{ type: 'text', value: text }],
    data: { hProperties: { className: ['wikilink'] } },
  };
}
