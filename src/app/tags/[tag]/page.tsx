import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocCard } from '@/components/docs/DocCard';
import { getDocsByUpdated, getTags } from '@/lib/content/load';

export const dynamicParams = false;

export function generateStaticParams() {
  return getTags()
    .filter((entry) => entry.count > 0)
    .map((entry) => ({ tag: entry.tag }));
}

export async function generateMetadata({ params }: PageProps<'/tags/[tag]'>): Promise<Metadata> {
  const { tag } = await params;
  const entry = getTags().find((candidate) => candidate.tag === tag);
  return entry ? { title: entry.label, description: entry.description } : {};
}

export default async function TagPage({ params }: PageProps<'/tags/[tag]'>) {
  const { tag } = await params;
  const entry = getTags().find((candidate) => candidate.tag === tag);
  if (!entry) notFound();

  const docs = getDocsByUpdated().filter((doc) => doc.tags.includes(tag));

  return (
    <div className="main--container">
      <h1 className="page-title">{entry.label}</h1>
      <p className="page-lead">
        {entry.description} {docs.length} {docs.length === 1 ? 'documento' : 'documentos'}.{' '}
        <Link href="/tags">Ver todos los tags</Link>
      </p>
      {docs.map((doc) => (
        <DocCard key={doc.slug} doc={doc} />
      ))}
    </div>
  );
}
