export type ElementOverride = { color?: string; font?: string };
export type ElementOverrideMap = Record<string, ElementOverride>;

const EDITABLE_SELECTOR = "h1,h2,h3,h4,h5,h6,p,button,a";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
}

/**
 * Walks the public site DOM and assigns each editable text/button element a
 * stable `data-el-id` derived from its nearest ancestor id, tag name and
 * text content. This lets the admin "Editor Visual" click-to-select feature
 * and the saved per-element overrides both refer to the same element across
 * reloads without requiring every component to be manually instrumented.
 */
export function tagEditableElements(root: ParentNode = document.body): Map<string, HTMLElement> {
  const map = new Map<string, HTMLElement>();
  const counts = new Map<string, number>();
  const elements = Array.from(root.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR));

  for (const el of elements) {
    if (el.closest("[data-no-edit]")) continue;
    const text = (el.textContent ?? "").trim();
    if (!text) continue;

    const ancestor = el.closest("[id]");
    const sectionId = ancestor ? ancestor.id : "root";
    const tag = el.tagName.toLowerCase();
    const slug = slugify(text) || "texto";
    const baseKey = `${sectionId}__${tag}__${slug}`;
    const n = counts.get(baseKey) ?? 0;
    counts.set(baseKey, n + 1);
    const id = n === 0 ? baseKey : `${baseKey}__${n}`;

    el.setAttribute("data-el-id", id);
    map.set(id, el);
  }

  return map;
}

/** Applies (or clears) per-element color/font overrides on already-tagged elements. */
export function applyElementOverrides(overrides: ElementOverrideMap, map: Map<string, HTMLElement>) {
  for (const [id, el] of map) {
    const o = overrides[id];
    if (o?.color) el.style.setProperty("color", `hsl(${o.color})`, "important");
    else el.style.removeProperty("color");

    if (o?.font) el.style.setProperty("font-family", `'${o.font}', sans-serif`, "important");
    else el.style.removeProperty("font-family");
  }
}

export function parseOverrides(value: string | undefined | null): ElementOverrideMap {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

/** Converts a computed `rgb(r, g, b)` / `rgba(...)` string into our "h s% l%" format. */
export function rgbStringToHslString(rgb: string): string {
  const match = rgb.match(/rgba?\(([^)]+)\)/);
  if (!match) return "153 30% 15%";
  const parts = match[1].split(",").map((p) => parseFloat(p.trim()));
  const [r, g, b] = [parts[0] / 255, parts[1] / 255, parts[2] / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function firstFontFamily(fontFamily: string): string {
  return fontFamily.split(",")[0]?.replace(/['"]/g, "").trim() ?? "";
}
