import type { Heading as MdastHeading, Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { createSlugger } from './slug';
import type { Heading } from './types';

/** Texto plano de un nodo mdast. Los wikilinks cuentan con su texto visible. */
export function plainText(node: unknown): string {
  const current = node as { type?: string; value?: unknown; children?: unknown[] };
  if (current.type === 'text' && typeof current.value === 'string') {
    return current.value.replace(/\[\[([^\[\]|]+?)(?:\|([^\[\]]+?))?\]\]/g, (_, target: string, label?: string) =>
      (label ?? target).trim(),
    );
  }
  if (typeof current.value === 'string') return current.value;
  return (current.children ?? []).map(plainText).join('');
}

/**
 * Plugin de remark: asigna un `id` estable a los headings h2 y h3 y, si se pasa
 * `collect`, los registra para la tabla de contenidos. Lo usan tanto la
 * extracción del pipeline como el render, así los ids coinciden siempre.
 */
export function remarkHeadingIds(options: { collect?: Heading[] } = {}) {
  return (tree: Root) => {
    const slug = createSlugger();
    visit(tree, 'heading', (node: MdastHeading) => {
      const text = plainText(node).trim();
      const id = slug(text);
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
      if (options.collect && (node.depth === 2 || node.depth === 3)) {
        options.collect.push({ depth: node.depth, text, id });
      }
    });
  };
}
