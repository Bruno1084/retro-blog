import { GardenStatus } from '@/components/console/GardenStatus';
import { DocIndex } from '@/components/docs/DocIndex';
import { WithPanel } from '@/components/layout/WithPanel';
import { getDocsByUpdated, getGraph, getReport, getTags } from '@/lib/content/load';

export default function HomePage() {
  // Al cliente solo viaja la metadata: los headings no hacen falta en el índice.
  const docs = getDocsByUpdated().map(({ headings, ...meta }) => meta);
  // Todos los tags, incluso los vacíos: el índice muestra la lista completa y deshabilita los que no tienen documentos.
  const tags = getTags().map(({ tag, label, count }) => ({ tag, label, count }));
  const graph = getGraph();

  return (
    <WithPanel
      panelLabel="Estado del jardín"
      panel={<GardenStatus documents={docs.length} edges={graph.edges.length} report={getReport()} />}
    >
      <h1 className="page-title">Índice</h1>
      {docs.length === 0 ? <p>Todavía no hay documentos publicados.</p> : <DocIndex docs={docs} tags={tags} />}
    </WithPanel>
  );
}
