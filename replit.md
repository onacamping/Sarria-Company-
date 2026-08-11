# Sarria Company — Sitio Web de Jardinería

Sitio público y panel administrativo para gestionar servicios de jardinería, portafolio,
tienda, cotizaciones, testimonios, Landing Pages segmentadas y el diseño visual del sitio.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/jardineria run dev` — run the frontend (port 22763)
- `pnpm run typecheck` — full typecheck across all packages
- `PORT=22763 BASE_PATH=/ pnpm --filter @workspace/jardineria run build` — build the frontend
- `pnpm --filter @workspace/api-server run build` — build the API server
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/jardineria/src/pages/home.tsx` — página principal.
- `artifacts/jardineria/src/pages/landing-page.tsx` — páginas públicas `/clientes/:slug`
  y renderer de bloques.
- `artifacts/jardineria/src/pages/admin/style-editor-panel.tsx` — Editor Visual general.
- `artifacts/jardineria/src/pages/admin/landing-pages-panel.tsx` — gestión de Landing Pages,
  bloques y Editor Visual por landing.
- `artifacts/jardineria/src/components/admin/block-editor.tsx` — bloques de contenido,
  reordenamiento y arrastrado desde la paleta.
- `artifacts/jardineria/src/components/element-inspector-provider.tsx` y
  `artifacts/jardineria/src/components/admin/element-style-popover.tsx` — motor compartido
  de selección visual y edición inline.
- `artifacts/api-server/src/routes/admin.ts` — endpoints protegidos del panel.
- `lib/db/src/schema/` — esquema PostgreSQL y tablas de contenido.

## Architecture decisions

- Los cambios del Editor Visual se mantienen como borrador en el cliente y solo se persisten
  mediante una acción explícita de guardado.
- Los overrides por elemento se guardan como JSON en `site_settings` para el sitio general
  y dentro de `landing_pages.custom_styles` para una Landing Page concreta.
- La vista previa se comunica con el panel mediante `postMessage`; no duplica la aplicación
  pública ni necesita un renderer alternativo.
- Los bloques se serializan en `landing_pages.blocks`, manteniendo la estructura existente
  y compatibilidad con el contenido HTML legado.

## Product

Los administradores pueden crear Landing Pages por sector, construir su contenido con
bloques de texto, imágenes, carruseles, videos y separadores, vincularlas a tarjetas
personalizadas de sectores y editar directamente texto, color y tipografía desde una
vista previa visual.

## User preferences

- Mantener la estructura pnpm existente; no migrar ni reestructurar el monorepo.
- La identidad visual usa Azul Principal `#4164AE`, Teal `#3DA39A`, Lima `#8DC665`,
  Poppins para títulos y Metropolis para cuerpo.

## Gotchas

- El build de Vite requiere `PORT` y `BASE_PATH`; el workflow ya los proporciona.
- El servidor API requiere `DATABASE_URL`. Si no está configurado, el frontend público
  puede renderizar el shell, pero las consultas de contenido devuelven errores 500.
- Los tokens del panel administrativo viven en memoria del API y se invalidan al reiniciarlo.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
