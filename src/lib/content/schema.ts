import { z } from 'zod';
import { isIsoDate } from './anotaciones';

/** YAML convierte `2026-10-06` en Date; se acepta ambos y se normaliza a `YYYY-MM-DD`. */
const isoDate = z
  .union([z.date(), z.string()])
  .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value.trim()))
  .refine(isIsoDate, {
    message: 'fecha inválida, se espera YYYY-MM-DD',
  });

export const frontmatterSchema = z
  .strictObject({
    title: z.string().trim().min(1),
    type: z.enum(['log', 'nota', 'pizca']),
    status: z.enum(['semilla', 'brote', 'arbol']),
    tags: z.array(z.string().trim().min(1)).min(1, 'al menos un tag'),
    created: isoDate,
    updated: isoDate,
    summary: z.string().trim().min(1).optional(),
    aliases: z.array(z.string().trim().min(1)).default([]),
    draft: z.boolean().default(false),
  })
  .refine((fm) => fm.updated >= fm.created, {
    message: '`updated` es anterior a `created`',
    path: ['updated'],
  });

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/** Entradas de "Ahora": separado del de documentos. La fecha es también su URL. */
export const ahoraSchema = z.strictObject({
  fecha: isoDate,
  titulo: z.string().trim().min(1).optional(),
  draft: z.boolean().default(false),
});

export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const where = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
    return `${where}: ${issue.message}`;
  });
}
