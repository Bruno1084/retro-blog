import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/** Links a otros sitios: se abren en pestaña nueva y llevan la clase `external`. */
export function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return;
      const href = node.properties.href;
      if (typeof href !== 'string' || !/^https?:\/\//.test(href)) return;
      node.properties.target = '_blank';
      node.properties.rel = ['noopener', 'noreferrer'];
      node.properties.className = [...toClassList(node.properties.className), 'external'];
    });
  };
}

function toClassList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
}
