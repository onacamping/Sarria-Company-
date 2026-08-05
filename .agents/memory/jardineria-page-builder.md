---
name: Landing pages block-based page builder
description: Block-based visual content builder for landing pages — architecture, block types, and DB column details.
---

## Architecture

Landing pages now support a block-based page builder stored in `landing_pages.blocks` (text, JSON array, added via drizzle push).

**Admin flow**: Landing Pages panel → "Constructor de Página" tab → BlockEditor component
**Public flow**: `landing-page.tsx` parses `page.blocks`, renders each block type with `BlocksRenderer`

## Component locations

- Admin block editor: `artifacts/jardineria/src/components/admin/block-editor.tsx`
- Public block renderer: inside `artifacts/jardineria/src/pages/landing-page.tsx` → `BlocksRenderer` + per-type components
- Block types shared via re-export in `artifacts/jardineria/src/lib/landing-api.ts`

## Block types supported

| type | Admin editor | Public render |
|---|---|---|
| `heading` | title + subtitle + alignment | styled h2 + subtitle |
| `text` | Quill RichTextEditor (lazy) | `dangerouslySetInnerHTML` |
| `image` | ImageUpload + URL fallback + size/align controls | `<figure>` + `<img>` |
| `carousel` | multi-image upload + captions + reorder | `embla-carousel-react` with arrows + dots |
| `video` | YouTube URL → embed preview | `<iframe>` embed |
| `divider` | size selector (sm/md/lg) | `<div>` spacer |

## Backwards compatibility

Legacy `content` (Quill HTML) is still stored and rendered IF `blocks` array is empty. New pages created after the builder was added will use blocks exclusively. No migration of old content is needed — the public page checks `blocks.length > 0` first.

## Drag-and-drop reordering

HTML5 native `draggable` attribute + `onDragStart`/`onDragOver`/`onDrop` handlers on each block card. Also up/down buttons for accessibility. `dragIndexRef` tracks the dragging block's index; on drop, array splice-and-insert.

## Carousel implementation

Uses `embla-carousel-react` (already in jardineria's package.json, `^8.6.0`). API: `useEmblaCarousel({ loop: true })` returns `[emblaRef, emblaApi]`. Arrows call `emblaApi?.scrollPrev/Next()`. Dots call `emblaApi?.scrollTo(i)`. Selected index tracked with `useCallback` + `emblaApi.on("select", ...)`.

## Segment → Landing Page links

Four sectors ("Entendemos Su Negocio" home section) can be linked to landing pages via site_settings keys:
- `segment_conjuntos_landing` → slug of landing page
- `segment_colegios_landing`
- `segment_edificios_landing`
- `segment_centros_landing`

Configured in **Settings panel** → "Vinculación de sectores con Landing Pages" card.
Read in `client-types.tsx` via `useSettings()` hook. Card wraps in `<Link href="/clientes/{slug}">` when key is set.

**Why:** Avoids a new DB table — reuses the existing key-value settings system. Slugs are stable identifiers for landing pages.
