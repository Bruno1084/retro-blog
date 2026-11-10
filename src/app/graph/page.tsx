import type { Metadata } from 'next';
import { GlobalGraph } from '@/components/graph/GlobalGraph';
import { GraphList } from '@/components/graph/GraphList';
import { ReportPanel } from '@/components/graph/ReportPanel';
import { getGraph, getReport, getTags } from '@/lib/content/load';

export const metadata: Metadata = {
  title: 'Grafo',
  description: 'Todos los documentos del jardín y cómo se enlazan entre sí.',
};

export default function GraphPage() {
  const graph = getGraph();
  const tags = getTags();
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="main--container">
      <h1 className="page-title">Grafo</h1>
      <p className="page-lead">
        Cada documento es un nodo y cada wikilink, una arista. Click en un nodo para abrirlo; pasá el mouse para ver sus
        vecinos.
      </p>

      {isDev && <ReportPanel report={getReport()} />}

      <GlobalGraph
        data={graph}
        tags={tags.filter((entry) => entry.count > 0).map(({ tag, label }) => ({ tag, label }))}
      />

      <GraphList graph={graph} tags={tags} />
    </div>
  );
}
