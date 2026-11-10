import fs from 'node:fs';
import path from 'node:path';
import type { Element, Root } from 'hast';
import { imageSize } from 'image-size';
import { visit } from 'unist-util-visit';

/**
 * Agrega `width` y `height` a las imágenes locales (`/images/...`) leyendo el
 * archivo de `/public`, que es lo que `next/image` necesita para no saltar el layout.
 */
export function rehypeImageSize(options: { publicDir: string }) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return;
      const src = node.properties.src;
      if (typeof src !== 'string' || !src.startsWith('/')) return;

      const file = path.join(options.publicDir, decodeURIComponent(src));
      if (!fs.existsSync(file)) throw new Error(`Imagen inexistente: ${src} (se buscó en ${file})`);
      const { width, height } = imageSize(fs.readFileSync(file));
      node.properties.width = width;
      node.properties.height = height;
    });
  };
}
