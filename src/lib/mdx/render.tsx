import 'server-only';
import { evaluate, type EvaluateOptions } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { mdxComponents } from '@/components/mdx/MdxComponents';
import { PUBLIC_DIR } from '@/lib/content/config';
import { remarkHeadingIds } from '@/lib/content/headings';
import { rehypeAnotaciones } from './rehype-anotaciones';
import { rehypeExternalLinks } from './rehype-external-links';
import { rehypeImageSize } from './rehype-image-size';

export interface RenderOptions {
  /** Plugins de remark adicionales que corren antes de los propios (p. ej. wikilinks en modo render). */
  remarkPlugins?: PluggableList;
}

/**
 * Fase H del pipeline: compila el cuerpo MDX en el servidor (en build, porque
 * todas las páginas son estáticas) y devuelve el árbol de React.
 */
export async function renderMdx(source: string, options: RenderOptions = {}) {
  const { default: Content } = await evaluate(source, {
    ...(runtime as unknown as Pick<EvaluateOptions, 'Fragment' | 'jsx' | 'jsxs'>),
    development: false,
    remarkPlugins: [remarkGfm, remarkHeadingIds, ...(options.remarkPlugins ?? [])],
    rehypePlugins: [rehypeExternalLinks, [rehypeImageSize, { publicDir: PUBLIC_DIR }], rehypeAnotaciones],
    remarkRehypeOptions: {
      footnoteLabel: 'Notas',
      footnoteBackLabel: 'Volver al texto',
      footnoteBackContent: 'volver',
    },
  });

  return <Content components={mdxComponents} />;
}
