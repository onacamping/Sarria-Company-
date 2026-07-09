---
name: Landing Pages System
description: Architecture of the landing_pages / landing_contacts feature added to Sarria Company site.
---

## Tables
- `landing_pages`: id, title, slug (unique), category, heroTitle, heroSubtitle, content (HTML), metaDescription, formTitle, formDescription, active, sortOrder, createdAt, updatedAt
- `landing_contacts`: id, landingSlug, landingTitle, name, company, phone, email, message, createdAt

## Category values (must match projectsTable.category)
conjuntos_residenciales | colegios | edificios | centros_comerciales | empresas | clinicas

## API Routes
- Public: `GET /api/landing-pages` (active only), `GET /api/landing-pages/:slug`, `POST /api/landing-contacts`
- Admin: `GET/POST/PUT/DELETE /api/admin/landing-pages`, `GET/DELETE /api/admin/landing-contacts`

## Frontend
- Public page: `artifacts/jardineria/src/pages/landing-page.tsx` at route `/clientes/:slug`
- API helpers: `artifacts/jardineria/src/lib/landing-api.ts`
- Navbar fetches active landing pages on mount and shows them in a "Clientes" dropdown

**Why:** Allow B2B segmentation so different client types (condos, schools, etc.) each get a dedicated landing with filtered portfolio and origin-tagged contact form.

**How to apply:** When editing landing page routes/schema, category must stay in sync with project categories so the portfolio filter works.
