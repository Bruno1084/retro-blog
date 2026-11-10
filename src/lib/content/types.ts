import type { AnotacionIssue, AnotacionPrefix } from './anotaciones';

export type DocType = 'log' | 'nota' | 'pizca';
export type Status = 'semilla' | 'brote' | 'arbol';

export interface DocMeta {
  slug: string;
  title: string;
  type: DocType;
  status: Status;
  tags: string[];
  created: string; // ISO (YYYY-MM-DD)
  updated: string; // ISO (YYYY-MM-DD)
  summary?: string;
  aliases: string[];
  draft: boolean;
  filePath: string; // relativa a la raíz del repo, con separadores `/`
}

export interface Heading {
  depth: 2 | 3;
  text: string;
  id: string;
}

export interface IndexedDoc extends DocMeta {
  headings: Heading[];
  readingMinutes: number;
  /** Cantidad de `<PorEscribir>` en el cuerpo. */
  pendientes: number;
  anotaciones: Anotaciones;
}

/** Notas al margen fechadas (`<Nota fecha="">`) de un documento. */
export interface Anotaciones {
  total: number;
  /** Fecha (YYYY-MM-DD) de la nota más reciente. */
  ultima: string | null;
}

/** Entrada de "Ahora" (content/ahora/<fecha>.mdx). */
export interface AhoraMeta {
  fecha: string; // ISO (YYYY-MM-DD); también es la URL: /ahora/<fecha>
  titulo?: string;
  draft: boolean;
  filePath: string;
}

export interface AhoraEntry extends AhoraMeta {
  /** Slugs de los documentos que menciona con wikilinks. */
  menciones: string[];
}

/** Backlink desde "Ahora": no es una arista del grafo, se muestra aparte en "Mencionado en". */
export interface AhoraMention {
  origen: 'ahora';
  fecha: string;
  titulo?: string;
}

export interface GraphNode {
  id: string; // slug
  title: string;
  type: DocType;
  status: Status;
  tags: string[];
  degree: number; // entrantes + salientes
  inDegree: number;
  outDegree: number;
  draft: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number; // cantidad de menciones de target dentro de source
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BrokenLink {
  from: string; // slug origen
  target: string; // texto del wikilink no resuelto
  line: number;
}

export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  severity: Severity;
  code: IssueCode;
  message: string;
  file?: string;
  line?: number;
}

export type IssueCode =
  | 'invalid-frontmatter'
  | 'invalid-mdx'
  | 'invalid-tag'
  | 'duplicate-slug'
  | 'alias-collision'
  | 'broken-link'
  | 'self-link'
  | 'missing-alt'
  | 'missing-image'
  | 'markdown-internal-link'
  | 'missing-summary'
  | 'isolated'
  | 'no-incoming'
  | 'arbol-con-pendientes'
  | 'duplicate-ahora'
  | 'ahora-desactualizado'
  | `${AnotacionPrefix}-${AnotacionIssue}`;

export interface MaturityReport {
  counts: Record<Status, number>;
  staleSemillas: { slug: string; updated: string; days: number }[];
  staleArboles: { slug: string; updated: string; days: number }[];
  incoherent: { slug: string; status: Status }[];
}

export interface Report {
  mode: 'development' | 'production';
  today: string;
  summary: { errors: number; warnings: number; documents: number };
  issues: Issue[];
  brokenLinks: (BrokenLink & { file: string })[];
  orphans: { isolated: string[]; noIncoming: string[] };
  maturity: MaturityReport;
  /** Documentos con secciones `<PorEscribir>` (sección 8.5). */
  pendientes: { slug: string; count: number; updated: string; days: number }[];
  /** Estado de "Ahora" (sección 8.6). */
  ahora: { entradas: number; ultima: string | null; days: number | null };
}

export interface TagEntry {
  tag: string;
  label: string;
  description: string;
  count: number;
  slugs: string[];
}
