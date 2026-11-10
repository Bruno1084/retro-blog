'use client';

import dynamic from 'next/dynamic';
import type { ForceGraphCanvasProps } from './ForceGraphCanvas';

/** `ssr: false` es obligatorio: react-force-graph-2d usa `window` y canvas. */
const ForceGraphCanvas = dynamic(() => import('./ForceGraphCanvas'), {
  ssr: false,
  loading: () => null,
});

export function GraphCanvas(props: ForceGraphCanvasProps) {
  return (
    <div style={{ minHeight: props.height }}>
      <ForceGraphCanvas {...props} />
    </div>
  );
}
