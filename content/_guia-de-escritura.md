# Guía rápida de escritura

Machete para escribir en el jardín. Este archivo es `.md`, así que el pipeline lo ignora y no se publica.

## Archivo nuevo

- Va en `content/logs/` o `content/notes/` (las carpetas son solo orden; el tipo sale del frontmatter).
- Extensión `.mdx`. El nombre del archivo es el slug y la URL: `mi-texto.mdx` → `/n/mi-texto`.
- Nombre en minúsculas y con guiones. Las tildes se quitan solas en la URL.

## Frontmatter

```yaml
---
title: Título del texto
type: nota             # log | nota | pizca
status: semilla        # semilla | brote | arbol   (arbol sin tilde)
tags: [literatura]     # al menos uno, de la lista de abajo
created: 2026-11-10
updated: 2026-11-10    # actualizarlo a mano cada vez que lo tocás
summary: Una línea.    # obligatorio en logs
aliases: [slug-viejo]  # opcional: si renombrás el archivo, el slug anterior redirige
draft: true            # opcional: no se publica
---
```

| Tipo | Qué es |
|---|---|
| `log` | Recorrido largo sobre un tema. Tiene hilo, no necesariamente conclusión. |
| `nota` | Exploración de algo que todavía no entiendo del todo. |
| `pizca` | Enlace, cita o pensamiento diminuto. |

| Estado | Qué significa |
|---|---|
| `semilla` | Recién plantada. Puede estar incompleta. |
| `brote` | Tiene forma, pero todavía cambia. |
| `arbol` | Estable. No espero reescribirla. |

**Tags válidos.** Cualquier otro rompe el build. La lista está en `src/lib/content/tags.ts`.

`literatura` (ficción), `cine` (películas, series y animación), `manga`, `videojuegos`, `musica`, `arte`, `software`.

Los tags dicen de qué trata el texto, no en qué formato está la obra: un ensayo sobre IA va con su tema, no con `literatura`. Qué clase de texto es lo dice el tipo (log, nota, pizca).

Un tema nuevo (por ejemplo `automatizacion`) se agrega a `src/lib/content/tags.ts` cuando dos o más textos lo comparten.

## Links

| Qué | Cómo |
|---|---|
| Otro texto del jardín | `[[nombre-del-archivo]]` |
| Otro texto, con otro texto visible | `[[nombre-del-archivo\|lo que se lee]]` |
| Página externa | `[texto](https://...)` |

- Los wikilinks son la **única** forma de enlazar textos del jardín. Un link markdown a `/n/...` no entra al grafo.
- Se escribe el nombre del archivo sin `.mdx`. Con o sin tildes funciona igual.
- Un wikilink a algo que no existe rompe el build de producción.

## Componentes

**Aparte**: digresión escrita junto con el texto.

```mdx
<Aparte>
Imagina que viajas al pasado...
</Aparte>
```

**Cita** con autor y fuente (todos opcionales):

```mdx
<Cita autor="Nombre del autor" fuente="Título de la obra" url="https://...">
Texto citado.
</Cita>
```

**Nota**: anotación posterior, con fecha. Va **después** del párrafo que anota.

```mdx
<Nota fecha="2026-11-10">
Releyendo esto, no estoy de acuerdo con lo que dije.
</Nota>
```

**Tachado y Agregado**: cambio de idea dentro de un párrafo.

```mdx
<Tachado fecha="2026-11-10">El libro demuestra</Tachado> <Agregado fecha="2026-11-10">El libro argumenta</Agregado> que...
```

**PorEscribir**: sección planificada sin escribir. El mensaje es opcional.

```mdx
<PorEscribir />
<PorEscribir>Falta el resumen de la parábola.</PorEscribir>
```

Reglas:
- `Nota`, `Tachado` y `Agregado` necesitan `fecha="AAAA-MM-DD"`. Sin fecha, el build de producción falla.
- Si la fecha es posterior a `updated`, el reporte avisa: actualizá `updated`.
- Se tacha solo cuando cambia una idea. La ortografía se corrige sin dejar rastro.
- `~~texto~~` tacha sin fecha, como garabato.

## Markdown

| Qué | Cómo |
|---|---|
| Subtítulos | `## Sección` y `### Subsección` (el título principal sale de `title`) |
| Negrita, itálica | `**negrita**`, `*itálica*` |
| Listas | `- item` o `1. item` |
| Cita simple | `> texto` |
| Imagen | `![descripción obligatoria](/images/nombre-del-archivo/foto.png)` (archivo en `public/images/nombre-del-archivo/`) |
| Nota al pie | `texto[^1]` y abajo `[^1]: la nota` |
| Tabla | `\| a \| b \|` con `\|---\|---\|` debajo del encabezado |
| Código | tres acentos graves y el lenguaje: `` ```ts `` |

## Cosas que rompen el MDX

- `<` pegado a una letra (`a <b`) se lee como un componente. Usá `a < b` o `&lt;`.
- `{` abre código: `{algo}` falla o se reemplaza. Escribí `\{` para mostrar una llave.
- Los comentarios HTML `<!-- -->` no funcionan. Para comentarios que no se publican: `{/* esto no se ve */}`.
- `// texto` no es un comentario: se publica tal cual.

## Ahora

Entradas tipo diario en `content/ahora/AAAA-MM-DD.mdx`. Sin tipo, estado ni tags. No entran al grafo y no se pueden enlazar, pero pueden enlazar a otros textos.

```yaml
---
fecha: 2026-11-10
titulo: Noviembre    # opcional
---
```

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Ver el sitio en `localhost:3000` mientras escribís |
| `npm run report` | Links rotos, notas aisladas, semillas abandonadas, secciones por escribir |
