import type { Element, Root, RootContent } from 'hast';

/**
 * Agrupa cada `<Nota>` con el bloque que anota (el anterior) en un contenedor:
 *
 *   <div class="anotado">
 *     <p>…párrafo…</p>
 *     <div class="anotado-notas"><Nota … /></div>
 *   </div>
 *
 * El autor escribe la nota después del párrafo y el CSS decide la posición:
 * en línea por defecto, en el margen izquierdo desde 1440px y alineada con el
 * inicio del párrafo (con `float` quedaría junto al párrafo siguiente).
 * Solo actúa en el nivel superior del documento: una nota dentro de una lista
 * o un aparte queda en línea.
 */
export function rehypeAnotaciones() {
  return (tree: Root) => {
    const out: RootContent[] = [];
    for (const child of tree.children) {
      if (!isNota(child)) {
        out.push(child);
        continue;
      }

      let index = out.length - 1;
      while (index >= 0 && isWhitespace(out[index]!)) index--;
      const previous = out[index];

      if (previous && isAnotado(previous)) {
        // Varias notas seguidas anotan el mismo bloque.
        (previous.children[1] as Element).children.push(child as Element);
        out.length = index + 1;
      } else if (previous && previous.type !== 'text' && previous.type !== 'comment' && previous.type !== 'doctype') {
        out.splice(index, out.length - index, wrap(previous, child));
      } else {
        out.push(child);
      }
    }
    tree.children = out;
  };
}

function wrap(block: RootContent, nota: RootContent): Element {
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['anotado'] },
    children: [
      block as Element,
      { type: 'element', tagName: 'div', properties: { className: ['anotado-notas'] }, children: [nota as Element] },
    ],
  };
}

function isNota(node: RootContent): boolean {
  return node.type === 'mdxJsxFlowElement' && node.name === 'Nota';
}

function isAnotado(node: RootContent): node is Element {
  const className = node.type === 'element' ? node.properties.className : undefined;
  return Array.isArray(className) && className.includes('anotado');
}

function isWhitespace(node: RootContent): boolean {
  return node.type === 'text' && node.value.trim() === '';
}
