# Bruno's Blog: jardín digital

Sitio personal sobre literatura, cine, manga, videojuegos y software, escrito como *digital garden*: los textos son archivos MDX en el repo, se enlazan entre sí con wikilinks y el sitio entero se genera de forma estática.

Lo interesante no es el blog sino el pipeline de contenido: el grafo de enlaces se deriva en build, la integridad referencial se valida (un link roto hace fallar el deploy) y hay herramientas de mantenimiento para notas huérfanas o abandonadas. El diseño completo está en [`plan.md`](plan.md).

## Uso

Requiere Node 20.9 o superior.

```sh
npm install
npm run dev        # pipeline en modo watch + next dev
npm run report     # links rotos, notas huérfanas, madurez, pendientes, "Ahora"
npm run build      # pipeline en modo producción + next build
```

| Script | Qué hace |
|---|---|
| `npm run content` | Corre el pipeline una vez y escribe `.generated/` |
| `npm run content:watch` | Lo mismo, y regenera al guardar en `content/` |
| `npm run report` | Imprime el reporte de mantenimiento (`--strict` sale con 1 ante errores) |
| `npm test` | Tests del pipeline (`node:test`) |
| `npm run lint` / `npm run typecheck` | ESLint y TypeScript |

## Escribir

Cada documento es un `.mdx` en `content/` (las carpetas `logs/` y `notes/` son solo organización: el tipo sale del frontmatter). El nombre del archivo es el slug y la URL queda en `/n/<slug>`.

```yaml
---
title: Grafos dirigidos y backlinks
type: nota              # log | nota | pizca
status: semilla         # semilla | brote | arbol
tags: [software]        # temas; lista cerrada en src/lib/content/tags.ts
created: 2026-10-06
updated: 2026-10-06
summary: Una línea para las tarjetas y el SEO.   # obligatorio en logs
aliases: [slug-anterior]                         # opcional: redirige 301
draft: false                                     # opcional: no se publica
---
```

En el cuerpo:

- `[[slug]]` o `[[slug|texto]]` para enlazar otro documento. Es la **única** forma de enlace interno: los links markdown a `/n/...` dan warning porque no entran al grafo.
- `<Cita autor="" fuente="" url="">...</Cita>` y `<Aparte>...</Aparte>` (digresión escrita junto con el texto).
- `<Nota fecha="AAAA-MM-DD">...</Nota>` después del párrafo que anota: anotación posterior, con fecha. En línea por debajo de 1440px, en el margen izquierdo desde ahí.
- `<Tachado fecha="AAAA-MM-DD">...</Tachado>` y `<Agregado fecha="AAAA-MM-DD">...</Agregado>` dentro de un párrafo, para cambios de idea. Solo se tacha cuando cambia una idea; la ortografía se corrige sin rastro. `~~texto~~` sigue disponible como garabato, sin fecha.
- `<PorEscribir>mensaje opcional</PorEscribir>` en secciones planificadas pero sin escribir.

Una anotación sin `fecha` o con fecha inválida corta el build de producción; una fecha posterior a `updated` da warning (recordatorio de actualizarlo).

### Ahora

Entradas tipo diario en `content/ahora/<fecha>.mdx`, publicadas en `/ahora` (la más reciente) y `/ahora/<fecha>`. Sin tipo, estado ni tags; no entran al grafo ni se pueden enlazar con `[[...]]`, pero sus wikilinks se validan y aparecen en "Mencionado en" del documento enlazado. Entran al RSS junto a los logs.

```yaml
---
fecha: 2026-10-12
titulo: Octubre      # opcional
draft: false         # opcional
---
```
- Imágenes en `public/images/<slug>/` con texto alternativo: `![descripción](/images/<slug>/x.png)`.
- Notas al pie con `[^1]`, tablas y listas de tareas (GFM).

## Cómo funciona

```
content/**/*.mdx
  └─ scripts/build-content.ts
       A descubrimiento   B frontmatter (zod)   C índice slug/alias
       D extracción AST   E grafo + backlinks   F validación   G artefactos
  └─ .generated/{content-index,graph,backlinks,tags,ahora,ahora-backlinks,report}.json
       └─ Next.js (App Router, SSG): compila cada MDX con @mdx-js/mdx
```

- `src/lib/content/pipeline.ts`: fases A–G, sin dependencias de Next.
- `src/lib/content/wikilinks.ts`: un plugin de remark con dos modos (extracción y render), para que los dos lados no se desincronicen.
- `src/lib/content/labels.ts`: etiquetas visibles de tipos, estados y medios. Ningún componente las escribe a mano.
- `src/lib/mdx/rehype-anotaciones.ts`: agrupa cada `<Nota>` con el bloque que anota para el layout de margen.
- `src/components/graph/`: grafo local y global con `react-force-graph-2d`; tipo por forma, estado por opacidad y grado por tamaño.

En producción (`--production`, `NODE_ENV=production` o `CI`) se excluyen los drafts y cualquier error (link roto, tag desconocido, frontmatter inválido, slug duplicado) corta el build.

## Deploy

Vercel, sin configuración extra: `npm run build` ya corre el pipeline en `prebuild`. Para fijar la URL pública (RSS, sitemap, OpenGraph), definir `SITE_URL`; si no está, se usa el dominio de producción de Vercel.
