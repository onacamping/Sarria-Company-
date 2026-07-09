---
name: Home Section Visibility Toggles
description: How show/hide toggles for Home page sections work in Sarria Company.
---

## Keys
- `show_portfolio_section` — controls Portfolio section on Home
- `show_quote_form` — controls QuoteForm section on Home

## Pattern
- Stored in `site_settings` table as string values "true" or "false"
- Default: treat missing key as "true" (visible)
- `Home.tsx` reads via `useSettings()` hook: `(settings["show_portfolio_section"] ?? "true") !== "false"`
- Admin toggles via Switch in `settings-panel.tsx`; calls `updateSetting(key, "true"/"false")` immediately on toggle

**Why:** Client wants one-click show/hide for these sections without deleting content; site_settings is the existing key-value store for all runtime config.
