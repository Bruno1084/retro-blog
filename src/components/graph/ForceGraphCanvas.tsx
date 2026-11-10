'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from 'react-force-graph-2d';
import type { DocType, GraphData, GraphNode, Status } from '@/lib/content/types';

/**
 * Canvas de grafo compartido por el grafo local y el global (plan, secciones 9 y 10.7).
 * Vive siempre dentro de un panel de consola:
 *   tipo -> forma, estado -> opacidad, grado -> tamaño, todo en la paleta ámbar.
 * Este módulo usa `window` y canvas: se importa solo desde GraphCanvas con `ssr: false`.
 */

export interface ForceGraphCanvasProps {
  data: GraphData;
  height: number;
  /** Nodo de la página actual: fijo en el centro y destacado. */
  focusId?: string;
  /** Tag resaltado en acento; el resto baja a `--console-border`. */
  highlightTag?: string | null;
  /** Nodos ocultos por filtros (no se reinicia la simulación). */
  hiddenIds?: ReadonlySet<string>;
  /** Nodo a centrar (búsqueda). Cambiar el valor dispara la animación. */
  centerOn?: string | null;
  /** Ticks de simulación antes de congelar el layout. */
  cooldownTicks?: number;
  /** Mostrar títulos de todos los nodos (si no, solo con zoom o al pasar el mouse). */
  alwaysShowLabels?: boolean;
  ariaLabel: string;
}

type Node = NodeObject<GraphNode & { radius: number }>;
type Link = LinkObject<Node, { weight: number }>;

const STATUS_ALPHA: Record<Status, number> = { semilla: 0.45, brote: 0.75, arbol: 1 };
/** Distancia inicial de los vecinos al nodo central en el grafo local. */
const SEED_RADIUS = 60;
/** Zoom máximo al encuadrar: con pocos nodos `zoomToFit` acercaría demasiado. */
const MAX_FIT_ZOOM = 2.5;

interface Palette {
  bg: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  font: string;
}

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    bg: read('--console'),
    accent: read('--console-accent'),
    text: read('--console-strong'),
    muted: read('--console-text'),
    border: read('--console-border'),
    font: getComputedStyle(document.body).fontFamily,
  };
}

export function nodeRadius(degree: number): number {
  return 4 + Math.sqrt(degree) * 2.2;
}

export default function ForceGraphCanvas({
  data,
  height,
  focusId,
  highlightTag = null,
  hiddenIds,
  centerOn = null,
  cooldownTicks = 120,
  alwaysShowLabels = false,
  ariaLabel,
}: ForceGraphCanvasProps) {
  const router = useRouter();
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // La fuente tiene que estar cargada antes del primer dibujo o las etiquetas salen con la de respaldo.
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setPalette(readPalette());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry!.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // La librería muta los objetos (x, y, vx...): se le pasan copias estables.
  const graphData = useMemo(() => {
    // En el grafo local, los vecinos arrancan en círculo alrededor del nodo central:
    // con muy pocos nodos la simulación sola no siempre los separa.
    const others = data.nodes.filter((node) => node.id !== focusId);
    const nodes: Node[] = data.nodes.map((node) => {
      const base = { ...node, radius: nodeRadius(node.degree) };
      if (!focusId) return base;
      if (node.id === focusId) return { ...base, x: 0, y: 0, fx: 0, fy: 0 };
      const angle = (others.indexOf(node) / others.length) * Math.PI * 2 - Math.PI / 2;
      return { ...base, x: Math.cos(angle) * SEED_RADIUS, y: Math.sin(angle) * SEED_RADIUS };
    });
    const links: Link[] = data.edges.map((edge) => ({ source: edge.source, target: edge.target, weight: edge.weight }));
    return { nodes, links };
  }, [data, focusId]);

  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const { source, target } of data.edges) {
      if (!map.has(source)) map.set(source, new Set());
      if (!map.has(target)) map.set(target, new Set());
      map.get(source)!.add(target);
      map.get(target)!.add(source);
    }
    return map;
  }, [data]);

  // Más distancia y repulsión que los valores por defecto: los nodos llevan etiqueta.
  const ready = palette !== null && width > 0;
  useEffect(() => {
    const graph = graphRef.current;
    if (!ready || !graph) return;
    graph.d3Force('link')?.distance(70);
    graph.d3Force('charge')?.strength(-240);
    // Con el nodo actual fijo en el origen, la fuerza de centrado arrastraría a los
    // vecinos hacia él (mueve el centroide, no solo los nodos libres).
    if (focusId) graph.d3Force('center', null);
    graph.d3ReheatSimulation();
  }, [ready, graphData, focusId]);

  function fit() {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoomToFit(400, 40);
    setTimeout(() => {
      if (graph.zoom() > MAX_FIT_ZOOM) graph.zoom(MAX_FIT_ZOOM, 200);
    }, 420);
  }

  useEffect(() => {
    if (!centerOn || !graphRef.current) return;
    const node = graphData.nodes.find((candidate) => candidate.id === centerOn);
    if (node?.x === undefined || node.y === undefined) return;
    graphRef.current.centerAt(node.x, node.y, 600);
    graphRef.current.zoom(3, 600);
  }, [centerOn, graphData]);

  const isDimmed = (id: string) => hovered !== null && id !== hovered && !neighbours.get(hovered)?.has(id);
  const endpointId = (end: Link['source']) => (typeof end === 'object' ? String(end?.id) : String(end));

  function drawNode(node: Node, ctx: CanvasRenderingContext2D, scale: number) {
    if (!palette || node.x === undefined || node.y === undefined) return;
    const id = String(node.id);
    const r = node.radius;
    const isFocus = id === focusId;
    const isHovered = id === hovered || id === centerOn;
    const matchesTag = highlightTag !== null && node.tags.includes(highlightTag);
    const color = isFocus || isHovered || matchesTag ? palette.accent : highlightTag !== null ? palette.border : palette.text;

    ctx.save();
    ctx.globalAlpha = (isDimmed(id) ? 0.15 : 1) * (isFocus ? 1 : STATUS_ALPHA[node.status]);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / Math.min(scale, 2);
    drawShape(ctx, node.type, node.x, node.y, r);

    if (isFocus) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1 / scale;
      ctx.strokeRect(node.x - r - 3, node.y - r - 3, (r + 3) * 2, (r + 3) * 2);
    }

    const showLabel = alwaysShowLabels || isFocus || isHovered || scale >= 2.2 || (hovered !== null && !isDimmed(id));
    if (showLabel) {
      const fontSize = Math.max(11 / scale, 3);
      ctx.font = `${fontSize}px ${palette.font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isFocus || isHovered ? palette.accent : palette.text;
      ctx.fillText(node.title + (node.draft ? ' [DRAFT]' : ''), node.x, node.y + r + 3);
    }
    ctx.restore();
  }

  function paintHitArea(node: Node, color: string, ctx: CanvasRenderingContext2D) {
    if (node.x === undefined || node.y === undefined) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const linkColor = (link: Link) => {
    if (!palette) return 'transparent';
    if (hovered === null) return palette.border;
    const touches = endpointId(link.source) === hovered || endpointId(link.target) === hovered;
    return touches ? palette.accent : `${palette.border}33`;
  };

  return (
    <div ref={containerRef} role="img" aria-label={ariaLabel} style={{ width: '100%', height }}>
      {ready && palette && (
        <ForceGraph2D<Node, { weight: number }>
          ref={graphRef}
          graphData={graphData}
          width={width}
          height={height}
          backgroundColor={palette.bg}
          nodeRelSize={1}
          nodeVal={(node) => node.radius * node.radius}
          nodeLabel={() => ''}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={paintHitArea}
          nodeVisibility={(node) => !hiddenIds?.has(String(node.id))}
          linkVisibility={(link) => !hiddenIds?.has(endpointId(link.source)) && !hiddenIds?.has(endpointId(link.target))}
          linkColor={linkColor}
          linkWidth={(link) => Math.min(1 + (link.weight - 1) * 0.5, 3)}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={linkColor}
          // El layout se precalcula antes del primer dibujo: con pocos nodos la animación
          // a veces no alcanza a separarlos antes de congelarse.
          warmupTicks={100}
          cooldownTicks={cooldownTicks}
          onEngineStop={fit}
          onNodeHover={(node) => {
            setHovered(node ? String(node.id) : null);
            if (containerRef.current) containerRef.current.style.cursor = node ? 'pointer' : 'default';
          }}
          onNodeClick={(node) => {
            if (node.id !== focusId) router.push(`/n/${node.id}`);
          }}
          enableNodeDrag={!focusId}
          minZoom={0.5}
          maxZoom={8}
        />
      )}
    </div>
  );
}

function drawShape(ctx: CanvasRenderingContext2D, type: DocType, x: number, y: number, r: number) {
  ctx.beginPath();
  if (type === 'log') {
    ctx.rect(x - r, y - r, r * 2, r * 2);
    ctx.fill();
    return;
  }
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (type === 'nota') ctx.fill();
  else ctx.stroke();
}
