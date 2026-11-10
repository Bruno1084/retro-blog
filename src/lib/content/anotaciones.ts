import type { Issue } from './types';

/**
 * Anotaciones fechadas del modelo "manuscrito": notas al margen (`<Nota>`),
 * tachaduras (`<Tachado>`) y agregados (`<Agregado>`). Todas llevan `fecha="AAAA-MM-DD"`.
 */
export const ANOTACIONES = { Nota: 'nota', Tachado: 'tachado', Agregado: 'agregado' } as const;

export type AnotacionName = keyof typeof ANOTACIONES;
export type AnotacionPrefix = (typeof ANOTACIONES)[AnotacionName];
export type AnotacionIssue = 'sin-fecha' | 'fecha-invalida' | 'posterior-a-updated' | 'anterior-a-created';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `AAAA-MM-DD` y una fecha que existe (`2026-02-30` no pasa). */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function isAnotacion(name: string | null | undefined): name is AnotacionName {
  return typeof name === 'string' && Object.hasOwn(ANOTACIONES, name);
}

interface JsxNode {
  name: string | null;
  attributes: { type: string; name?: string; value?: unknown }[];
}

/**
 * Valor literal de un atributo JSX. `undefined` si no está; `null` si está pero
 * no es un string literal (`fecha` sin valor o `fecha={...}`).
 */
export function getAttr(node: JsxNode, name: string): string | null | undefined {
  const attribute = node.attributes.find((attr) => attr.type === 'mdxJsxAttribute' && attr.name === name);
  if (!attribute) return undefined;
  return typeof attribute.value === 'string' ? attribute.value.trim() : null;
}

/**
 * Valida la fecha de una anotación contra el rango del documento. Una fecha
 * posterior a `updated` es un warning y no un ajuste: `updated` es manual
 * (plan, decisión 1) y este es el recordatorio de actualizarlo.
 */
export function validateAnotacion(
  node: JsxNode & { name: AnotacionName },
  range: { created: string; updated?: string },
  where: { file: string; line?: number },
): { fecha: string | null; issue?: Issue } {
  const prefix = ANOTACIONES[node.name];
  const tag = `<${node.name}>`;
  const fecha = getAttr(node, 'fecha');
  const issue = (severity: Issue['severity'], code: AnotacionIssue, message: string): Issue => ({
    severity,
    code: `${prefix}-${code}`,
    message,
    file: where.file,
    line: where.line,
  });

  if (fecha === undefined || fecha === '') {
    return { fecha: null, issue: issue('error', 'sin-fecha', `${tag} sin fecha; se espera fecha="AAAA-MM-DD"`) };
  }
  if (fecha === null || !isIsoDate(fecha)) {
    return { fecha: null, issue: issue('error', 'fecha-invalida', `${tag} con fecha inválida; se espera fecha="AAAA-MM-DD"`) };
  }
  if (range.updated && fecha > range.updated) {
    return {
      fecha,
      issue: issue('warning', 'posterior-a-updated', `${tag} del ${fecha} es posterior a updated (${range.updated}); actualizar updated`),
    };
  }
  if (fecha < range.created) {
    return { fecha, issue: issue('warning', 'anterior-a-created', `${tag} del ${fecha} es anterior a created (${range.created})`) };
  }
  return { fecha };
}
