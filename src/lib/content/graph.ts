import type { GraphData } from './types';

/**
 * Vecindario de `slug` hasta `depth` saltos, sin importar la dirección de las aristas.
 * Se calcula en build y se pasa como prop: cada página no carga graph.json completo.
 */
export function localSubgraph(graph: GraphData, slug: string, depth = 1): GraphData {
  const neighbours = new Map<string, Set<string>>();
  for (const { source, target } of graph.edges) {
    if (!neighbours.has(source)) neighbours.set(source, new Set());
    if (!neighbours.has(target)) neighbours.set(target, new Set());
    neighbours.get(source)!.add(target);
    neighbours.get(target)!.add(source);
  }

  const included = new Set([slug]);
  let frontier = [slug];
  for (let level = 0; level < depth; level++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbour of neighbours.get(id) ?? []) {
        if (!included.has(neighbour)) {
          included.add(neighbour);
          next.push(neighbour);
        }
      }
    }
    frontier = next;
  }

  return {
    nodes: graph.nodes.filter((node) => included.has(node.id)),
    edges: graph.edges.filter((edge) => included.has(edge.source) && included.has(edge.target)),
  };
}
