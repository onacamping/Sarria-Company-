---
name: Jardinería site style editor conventions
description: How visual styling (fonts, text colors, buttons, logo size) is wired for the Sarria Company site — read before touching admin style controls or theming.
---

The public site's visual identity (fonts, heading/body text color, per-button colors+labels, logo size) is driven entirely by generic key/value rows in the settings table — no schema change needed to add a new styleable property, just add the key to the admin panel's key list and to the CSS-var mapping.

**Where the wiring lives:**
- CSS variables (`--font-heading`, `--font-subheading`, `--font-body`, `--color-heading-text`, `--color-body-text`, `--btn-primary-bg/text`, `--btn-secondary-bg/text`, `--logo-size`, `--logo-size-footer`) are defined with sane defaults in `index.css` and consumed by base-layer selectors and by `button.tsx`/`navbar.tsx`/`footer.tsx`.
- `site-settings.tsx`'s `ThemeProvider` applies fetched settings onto `document.documentElement` via a key→CSS-var map, and also listens for `postMessage({type: "sarria-style-preview", draft})` so an admin iframe can preview unsaved draft styles live without persisting them.
- The admin "Editor Visual" panel (`style-editor-panel.tsx`) holds local draft state, pushes it into the live iframe preview via postMessage on every keystroke, and only calls `PUT /api/admin/settings/:key` once the user clicks "Guardar y confirmar" (explicit-save pattern, with unsaved-changes guards on tab switch/logout/beforeunload).

**Why:** the user wanted a WYSIWYG-style editor where nothing touches the live site until an explicit confirm, and wanted brand-manual defaults (Poppins headings / Metropolis body) easy to reapply — this is done via a `BRAND_DEFAULTS` constant + "Aplicar valores del manual de marca" button in `font-catalog.ts`.

**How to apply:** when adding a new styleable property, add it to `STYLE_KEYS`/`DEFAULTS` in `style-editor-panel.tsx` AND to the `CSS_VAR_MAP`/`FONT_VAR_MAP` in `site-settings.tsx` — both sides must stay in sync or the new control will silently do nothing.
