const base = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export interface LandingPage {
  id: number;
  title: string;
  slug: string;
  category: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  content: string;
  metaDescription: string | null;
  formTitle: string;
  formDescription: string | null;
  active: boolean;
  sortOrder: number;
  customStyles: string; // JSON string: LandingCustomStyles
  createdAt: string;
  updatedAt: string;
}

// Re-exported so the public renderer can import without touching admin components
export type { Block, BlockType, CarouselImage } from "@/components/admin/block-editor";

export interface LandingCustomStyles {
  heroBg?: string;
  heroGradient?: boolean;
  heroGradientEnd?: string;
  heroText?: string;
  accentColor?: string;
  buttonBg?: string;
  buttonText?: string;
  buttonRadius?: string; // "sm" | "md" | "lg" | "full"
  sectionBg?: string;
  contentText?: string;
  portfolioBg?: string;
  portfolioText?: string;
  fontHeading?: string;
  fontBody?: string;
}

export interface LandingContact {
  id: number;
  landingSlug: string;
  landingTitle: string | null;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  message: string | null;
  createdAt: string;
}

export async function getLandingPages(): Promise<LandingPage[]> {
  const res = await fetch(`${base()}/api/landing-pages`);
  if (!res.ok) return [];
  return res.json();
}

export async function getLandingPage(slug: string): Promise<LandingPage | null> {
  const res = await fetch(`${base()}/api/landing-pages/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function submitLandingContact(data: {
  landingSlug: string;
  landingTitle?: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  message?: string;
}): Promise<void> {
  const res = await fetch(`${base()}/api/landing-contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}
