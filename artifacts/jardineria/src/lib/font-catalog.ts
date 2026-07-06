export interface FontOption {
  value: string;
  label: string;
  family: string;
  brand?: boolean;
}

export interface FontCategory {
  id: string;
  label: string;
  description: string;
  fonts: FontOption[];
}

export const FONT_CATEGORIES: FontCategory[] = [
  {
    id: "brand",
    label: "Marca (Manual de Identidad)",
    description: "Tipografías oficiales de Sarria Company.",
    fonts: [
      { value: "Poppins", label: "Poppins (Primaria — Títulos)", family: "'Poppins', sans-serif", brand: true },
      { value: "Metropolis", label: "Metropolis (Secundaria — Cuerpo)", family: "'Metropolis', sans-serif", brand: true },
    ],
  },
  {
    id: "serif",
    label: "Serif (Con remates)",
    description: "Tradicionales, transmiten autoridad y facilitan la lectura en textos largos.",
    fonts: [
      { value: "Playfair Display", label: "Playfair Display", family: "'Playfair Display', serif" },
      { value: "Merriweather", label: "Merriweather", family: "'Merriweather', serif" },
      { value: "Lora", label: "Lora", family: "'Lora', serif" },
      { value: "EB Garamond", label: "EB Garamond (estilo Garamond)", family: "'EB Garamond', serif" },
    ],
  },
  {
    id: "sans",
    label: "Sans Serif (Palo seco)",
    description: "Limpias, minimalistas y modernas. Ideales para pantallas.",
    fonts: [
      { value: "Inter", label: "Inter", family: "'Inter', sans-serif" },
      { value: "Work Sans", label: "Work Sans", family: "'Work Sans', sans-serif" },
      { value: "Montserrat", label: "Montserrat", family: "'Montserrat', sans-serif" },
    ],
  },
  {
    id: "slab",
    label: "Slab Serif (Egipcias)",
    description: "Remates grandes y rectangulares. Fuerza y solidez para títulos.",
    fonts: [
      { value: "Roboto Slab", label: "Roboto Slab", family: "'Roboto Slab', serif" },
      { value: "Bitter", label: "Bitter", family: "'Bitter', serif" },
      { value: "Arvo", label: "Arvo (estilo Rockwell/Clarendon)", family: "'Arvo', serif" },
    ],
  },
  {
    id: "script",
    label: "Script (Manuscritas)",
    description: "Imitan la caligrafía. Elegantes o casuales, para acentos decorativos.",
    fonts: [
      { value: "Dancing Script", label: "Dancing Script", family: "'Dancing Script', cursive" },
      { value: "Pacifico", label: "Pacifico", family: "'Pacifico', cursive" },
      { value: "Sacramento", label: "Sacramento (estilo Brush Script)", family: "'Sacramento', cursive" },
    ],
  },
  {
    id: "display",
    label: "Decorativas (Display)",
    description: "Diseños extravagantes para captar la atención (no usar en párrafos).",
    fonts: [
      { value: "Bungee", label: "Bungee (estilo Impact/Chiller)", family: "'Bungee', sans-serif" },
      { value: "Lobster", label: "Lobster (estilo Cooper Black)", family: "'Lobster', cursive" },
      { value: "Fredoka", label: "Fredoka", family: "'Fredoka', sans-serif" },
    ],
  },
];

export const ALL_FONTS: FontOption[] = FONT_CATEGORIES.flatMap((c) => c.fonts);

export function fontFamilyFor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const found = ALL_FONTS.find((f) => f.value === value);
  return found ? found.family : fallback;
}

export const BRAND_DEFAULTS = {
  font_heading: "Poppins",
  font_subheading: "Poppins",
  font_body: "Metropolis",
  color_primary: "198 63% 28%",
  color_secondary: "84 55% 45%",
  color_heading_text: "153 30% 15%",
  color_body_text: "153 15% 30%",
  btn_primary_bg: "198 63% 28%",
  btn_primary_text: "0 0% 100%",
  btn_secondary_bg: "84 55% 45%",
  btn_secondary_text: "0 0% 100%",
};
