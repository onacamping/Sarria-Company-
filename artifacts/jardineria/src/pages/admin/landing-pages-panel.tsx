import { useState, useEffect } from "react";
import {
  getAdminLandingPages,
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  getAdminLandingContacts,
  deleteLandingContact,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Globe, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp,
  Users, Inbox, ExternalLink, Eye, EyeOff, Sparkles, Palette, Type, Layout,
} from "lucide-react";
import BlockEditor, { type Block } from "@/components/admin/block-editor";

interface LandingPage {
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
  customStyles: string;
  blocks: string;
  createdAt: string;
}

interface LandingContact {
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

interface StyleForm {
  heroBg: string;
  heroGradient: boolean;
  heroGradientEnd: string;
  heroText: string;
  accentColor: string;
  buttonBg: string;
  buttonText: string;
  buttonRadius: string; // "sm" | "md" | "lg" | "full"
  sectionBg: string;
  contentText: string;
  portfolioBg: string;
  portfolioText: string;
  fontHeading: string;
  fontBody: string;
}

const CATEGORIES = [
  { value: "conjuntos_residenciales", label: "Conjuntos Residenciales" },
  { value: "colegios", label: "Colegios e Instituciones" },
  { value: "edificios", label: "Edificios y Oficinas" },
  { value: "centros_comerciales", label: "Centros Comerciales" },
  { value: "empresas", label: "Empresas" },
  { value: "clinicas", label: "Clínicas y Hospitales" },
];

const FONT_OPTIONS = [
  "Poppins", "Metropolis", "Roboto", "Open Sans", "Lato", "Montserrat",
  "Playfair Display", "Merriweather", "Inter", "Nunito", "Raleway", "Oswald",
];

// ── Colores extraídos del Manual de Identidad Visual Sarria Company ──
// Azul Principal #4164AE · Verde Medio #47A86E · Lima Claro #8DC665
// Gris Tipográfico #535353 · Degradado: #4164AE → #3DA39A
const BRAND_STYLE_DEFAULTS: StyleForm = {
  heroBg: "#4164AE",          // Azul Principal
  heroGradient: true,
  heroGradientEnd: "#3DA39A", // Azul → Teal (degradado del logo)
  heroText: "#ffffff",
  accentColor: "#8DC665",     // Lima Claro
  buttonBg: "#4164AE",        // Azul Principal
  buttonText: "#ffffff",
  buttonRadius: "lg",
  sectionBg: "#ffffff",
  contentText: "#535353",     // Gris Tipográfico
  portfolioBg: "#4164AE",     // Azul Principal
  portfolioText: "#ffffff",
  fontHeading: "Poppins",
  fontBody: "Metropolis",
};

const DEFAULT_STYLE: StyleForm = {
  heroBg: "#4164AE",
  heroGradient: true,
  heroGradientEnd: "#3DA39A",
  heroText: "#ffffff",
  accentColor: "#8DC665",
  buttonBg: "#4164AE",
  buttonText: "#ffffff",
  buttonRadius: "lg",
  sectionBg: "#ffffff",
  contentText: "#535353",
  portfolioBg: "#4164AE",
  portfolioText: "#ffffff",
  fontHeading: "Poppins",
  fontBody: "Metropolis",
};

function parseStyles(raw: string): StyleForm {
  try {
    const parsed = JSON.parse(raw || "{}");
    return { ...DEFAULT_STYLE, ...parsed };
  } catch {
    return { ...DEFAULT_STYLE };
  }
}

const emptyForm = () => ({
  title: "",
  slug: "",
  category: "conjuntos_residenciales",
  heroTitle: "",
  heroSubtitle: "",
  content: "",
  metaDescription: "",
  formTitle: "Solicite una evaluación gratuita",
  formDescription: "",
  active: true,
  sortOrder: 0,
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function parseBlocks(raw: string): Block[] {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

type EditorTab = "content" | "blocks" | "style";

export default function LandingPagesPanel() {
  const [activeTab, setActiveTab] = useState<"pages" | "contacts">("pages");
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [contacts, setContacts] = useState<LandingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>("content");
  const [form, setForm] = useState(emptyForm());
  const [styles, setStyles] = useState<StyleForm>({ ...DEFAULT_STYLE });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedContact, setExpandedContact] = useState<number | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [p, c] = await Promise.all([
      getAdminLandingPages().catch(() => []),
      getAdminLandingContacts().catch(() => []),
    ]);
    setPages(p as LandingPage[]);
    setContacts(c as LandingContact[]);
    setLoading(false);
  }

  function startNew() {
    setForm(emptyForm());
    setStyles({ ...DEFAULT_STYLE });
    setBlocks([]);
    setEditorTab("content");
    setEditing("new");
  }

  function startEdit(page: LandingPage) {
    setForm({
      title: page.title,
      slug: page.slug,
      category: page.category,
      heroTitle: page.heroTitle ?? "",
      heroSubtitle: page.heroSubtitle ?? "",
      content: page.content,
      metaDescription: page.metaDescription ?? "",
      formTitle: page.formTitle,
      formDescription: page.formDescription ?? "",
      active: page.active,
      sortOrder: page.sortOrder,
    });
    setStyles(parseStyles(page.customStyles));
    setBlocks(parseBlocks((page as any).blocks ?? "[]"));
    setEditorTab("content");
    setEditing(page.id);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm());
  }

  const set = (k: keyof typeof form) => (v: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const setStyle = (k: keyof StyleForm) => (v: string) =>
    setStyles((prev) => ({ ...prev, [k]: v }));

  function applyBrandManual() {
    setStyles({ ...BRAND_STYLE_DEFAULTS });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      alert("Título y slug son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        heroTitle: form.heroTitle || null,
        heroSubtitle: form.heroSubtitle || null,
        metaDescription: form.metaDescription || null,
        formDescription: form.formDescription || null,
        customStyles: JSON.stringify(styles),
        blocks: JSON.stringify(blocks),
      };
      if (editing === "new") {
        await createLandingPage(payload);
      } else if (typeof editing === "number") {
        await updateLandingPage(editing, payload);
      }
      await loadAll();
      setEditing(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta landing page? Esta acción no se puede deshacer.")) return;
    await deleteLandingPage(id).catch(() => {});
    await loadAll();
  }

  async function handleDeleteContact(id: number) {
    if (!confirm("¿Eliminar este contacto?")) return;
    await deleteLandingContact(id).catch(() => {});
    await loadAll();
  }

  async function toggleActive(page: LandingPage) {
    await updateLandingPage(page.id, { active: !page.active }).catch(() => {});
    await loadAll();
  }

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Cargando landing pages...</div>;
  }

  if (editing !== null) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {editing === "new" ? "Nueva Landing Page" : "Editar Landing Page"}
          </h1>
          <Button variant="ghost" size="sm" onClick={cancelEdit}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
        </div>

        {/* Editor Tabs */}
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-muted/30 w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setEditorTab("content")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              editorTab === "content"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="w-4 h-4" /> Configuración
          </button>
          <button
            type="button"
            onClick={() => setEditorTab("blocks")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              editorTab === "blocks"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layout className="w-4 h-4" /> Constructor de Página
          </button>
          <button
            type="button"
            onClick={() => setEditorTab("style")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              editorTab === "style"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="w-4 h-4" /> Diseño Visual
          </button>
        </div>

        {/* ── CONTENT TAB ── */}
        {editorTab === "content" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Título *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => {
                        set("title")(e.target.value);
                        if (editing === "new") set("slug")(slugify(e.target.value));
                      }}
                      placeholder="Jardinería para Conjuntos Residenciales"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slug (URL) * — <span className="text-muted-foreground font-normal">/clientes/<strong>{form.slug || "mi-slug"}</strong></span></Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => set("slug")(slugify(e.target.value))}
                      placeholder="conjuntos-residenciales"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Categoría (filtra proyectos)</Label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={form.category}
                      onChange={(e) => set("category")(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Orden de aparición en menú</Label>
                    <Input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => set("sortOrder")(parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Meta descripción (SEO)</Label>
                  <Input value={form.metaDescription} onChange={(e) => set("metaDescription")(e.target.value)} placeholder="Descripción breve para Google..." />
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={form.active} onCheckedChange={(v) => set("active")(v)} id="active" />
                  <Label htmlFor="active">{form.active ? "Publicada (visible en el menú)" : "Borrador (oculta)"}</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hero de la landing page</CardTitle>
                <CardDescription>Título y subtítulo del banner superior.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Título del hero (dejar vacío para usar el título principal)</Label>
                  <Input value={form.heroTitle} onChange={(e) => set("heroTitle")(e.target.value)} placeholder={form.title || "Título de la landing"} />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtítulo / bajada del hero</Label>
                  <Textarea rows={2} value={form.heroSubtitle} onChange={(e) => set("heroSubtitle")(e.target.value)} placeholder="Más de 13 años cuidando conjuntos residenciales en Bogotá..." />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4 px-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Constructor de Página
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Agrega encabezados, texto, imágenes, carruseles y videos en la pestaña <strong>Constructor de Página</strong>.
                    {blocks.length > 0 && <> · <span className="text-primary font-medium">{blocks.length} bloque{blocks.length !== 1 ? "s" : ""} configurado{blocks.length !== 1 ? "s" : ""}</span></>}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditorTab("blocks")} className="shrink-0">
                  <Layout className="w-4 h-4 mr-1" /> Editar bloques
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formulario de contacto</CardTitle>
                <CardDescription>Título y descripción del formulario específico de esta landing page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Título del formulario</Label>
                  <Input value={form.formTitle} onChange={(e) => set("formTitle")(e.target.value)} placeholder="Solicite una evaluación gratuita" />
                </div>
                <div className="space-y-1.5">
                  <Label>Descripción / instrucción</Label>
                  <Textarea rows={2} value={form.formDescription} onChange={(e) => set("formDescription")(e.target.value)} placeholder="Complete el formulario y nos comunicaremos en menos de 24 horas..." />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── BLOCKS TAB ── */}
        {editorTab === "blocks" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layout className="w-4 h-4 text-primary" /> Constructor de Página
              </CardTitle>
              <CardDescription>
                Agrega encabezados, texto enriquecido, imágenes, carruseles de fotos y videos de YouTube.
                Arrastra los bloques con el ícono <strong>⣿</strong> o usa los botones <strong>↑↓</strong> para reordenar.
                Los cambios se guardan al hacer clic en "Guardar cambios".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </CardContent>
          </Card>
        )}

        {/* ── STYLE TAB ── */}
        {editorTab === "style" && (
          <>
            {/* Manual de Marca banner */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4 px-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-primary">Manual de Identidad Visual — Sarria Company</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Aplica los colores oficiales: Azul Principal + Teal (degradado del logo), Lima Claro, Gris Tipográfico y tipografías Poppins + Metropolis.</p>
                  </div>
                  <Button variant="default" size="sm" onClick={applyBrandManual} className="shrink-0 gap-2">
                    <Sparkles className="w-4 h-4" />
                    Aplicar Manual de Marca
                  </Button>
                </div>
                {/* Brand color swatches */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <div className="w-6 h-6 rounded border border-white shadow" style={{ background: "linear-gradient(135deg, #4164AE, #3DA39A)" }} title="Degradado principal" />
                  <div className="w-6 h-6 rounded border border-white shadow" style={{ background: "#4164AE" }} title="Azul Principal" />
                  <div className="w-6 h-6 rounded border border-white shadow" style={{ background: "#3DA39A" }} title="Verde Teal" />
                  <div className="w-6 h-6 rounded border border-white shadow" style={{ background: "#8DC665" }} title="Lima Claro" />
                  <div className="w-6 h-6 rounded border border-white shadow" style={{ background: "#47A86E" }} title="Verde Medio" />
                  <div className="w-6 h-6 rounded border border-border shadow" style={{ background: "#535353" }} title="Gris Tipográfico" />
                  <div className="w-6 h-6 rounded border border-border shadow" style={{ background: "#ffffff" }} title="Blanco" />
                  <span className="text-xs text-muted-foreground ml-1">Poppins (títulos) + Metropolis (cuerpo)</span>
                </div>
              </CardContent>
            </Card>

            {/* ── HERO ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hero — Fondo y Texto</CardTitle>
                <CardDescription>Banner superior. Puede usar un color sólido o un degradado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Gradient toggle */}
                <div className="flex items-center gap-3">
                  <Switch
                    id="hero-gradient"
                    checked={styles.heroGradient}
                    onCheckedChange={(v) => setStyles((p) => ({ ...p, heroGradient: v }))}
                  />
                  <Label htmlFor="hero-gradient">Usar degradado (dos colores)</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ColorField
                    label={styles.heroGradient ? "Color inicial del degradado" : "Color de fondo del hero"}
                    value={styles.heroBg}
                    onChange={setStyle("heroBg")}
                    preview={styles.heroBg}
                  />
                  {styles.heroGradient && (
                    <ColorField
                      label="Color final del degradado"
                      value={styles.heroGradientEnd}
                      onChange={setStyle("heroGradientEnd")}
                      preview={styles.heroGradientEnd}
                    />
                  )}
                  <ColorField label="Color del texto del hero" value={styles.heroText} onChange={setStyle("heroText")} preview={styles.heroText} />
                </div>
              </CardContent>
            </Card>

            {/* ── ACCENT + BUTTONS ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acento y Botones CTA</CardTitle>
                <CardDescription>Badges, botones de llamado a la acción y detalles decorativos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ColorField label="Color de acento / badge" value={styles.accentColor} onChange={setStyle("accentColor")} preview={styles.accentColor} />
                  <ColorField label="Fondo del botón CTA" value={styles.buttonBg} onChange={setStyle("buttonBg")} preview={styles.buttonBg} />
                  <ColorField label="Texto del botón CTA" value={styles.buttonText} onChange={setStyle("buttonText")} preview={styles.buttonText} />
                </div>
                <div className="space-y-1.5">
                  <Label>Esquinas de los botones</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["sm", "md", "lg", "full"] as const).map((r) => {
                      const labels: Record<string, string> = { sm: "Cuadrado", md: "Suave", lg: "Redondeado", full: "Píldora" };
                      const radiusMap: Record<string, string> = { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", full: "9999px" };
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setStyle("buttonRadius")(r)}
                          className={`px-4 py-1.5 text-xs font-medium border transition-colors ${styles.buttonRadius === r ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                          style={{ borderRadius: radiusMap[r] }}
                        >
                          {labels[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── CONTENT SECTIONS ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sección de Contenido y Formulario</CardTitle>
                <CardDescription>Área de texto principal y formulario de contacto.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorField label="Fondo de sección" value={styles.sectionBg} onChange={setStyle("sectionBg")} preview={styles.sectionBg} />
                <ColorField label="Color del texto" value={styles.contentText} onChange={setStyle("contentText")} preview={styles.contentText} />
              </CardContent>
            </Card>

            {/* ── PORTFOLIO SECTION ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sección de Portafolio</CardTitle>
                <CardDescription>Fondo y texto de la grilla de proyectos relacionados.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorField label="Fondo de portafolio" value={styles.portfolioBg} onChange={setStyle("portfolioBg")} preview={styles.portfolioBg} />
                <ColorField label="Texto del portafolio" value={styles.portfolioText} onChange={setStyle("portfolioText")} preview={styles.portfolioText} />
              </CardContent>
            </Card>

            {/* ── FONTS ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipografía</CardTitle>
                <CardDescription>Fuentes para títulos y cuerpo de texto.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Fuente de títulos</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={styles.fontHeading}
                    onChange={(e) => setStyle("fontHeading")(e.target.value)}
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: `'${styles.fontHeading}', sans-serif` }}>
                    Vista previa: {styles.fontHeading}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Fuente del cuerpo</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={styles.fontBody}
                    onChange={(e) => setStyle("fontBody")(e.target.value)}
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: `'${styles.fontBody}', sans-serif` }}>
                    Vista previa: {styles.fontBody}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ── LIVE PREVIEW ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vista Previa del Diseño</CardTitle>
                <CardDescription>Simulación del hero, contenido y portafolio.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                  {/* Hero preview */}
                  <div
                    className="px-6 py-8 text-center relative"
                    style={{
                      background: styles.heroGradient
                        ? `linear-gradient(135deg, ${styles.heroBg} 0%, ${styles.heroGradientEnd} 100%)`
                        : styles.heroBg,
                      color: styles.heroText,
                      fontFamily: `'${styles.fontHeading}', sans-serif`,
                    }}
                  >
                    <span
                      className="inline-block text-xs font-semibold px-3 py-1 mb-3 uppercase tracking-wider"
                      style={{
                        background: styles.accentColor + "33",
                        color: styles.heroText,
                        border: `1px solid ${styles.heroText}44`,
                        borderRadius: styles.buttonRadius === "full" ? "9999px" : styles.buttonRadius === "sm" ? "0.25rem" : "0.5rem",
                      }}
                    >
                      {CATEGORIES.find((c) => c.value === form.category)?.label ?? "Categoría"}
                    </span>
                    <h2 className="text-xl font-bold mb-2">{form.heroTitle || form.title || "Título de la Landing Page"}</h2>
                    {form.heroSubtitle && <p className="text-sm opacity-80 mb-4">{form.heroSubtitle}</p>}
                    <button
                      type="button"
                      className="text-sm font-semibold px-5 py-2"
                      style={{
                        background: styles.buttonBg,
                        color: styles.buttonText,
                        borderRadius: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", full: "9999px" }[styles.buttonRadius] ?? "0.75rem",
                      }}
                    >
                      Solicitar información
                    </button>
                  </div>
                  {/* Content preview */}
                  <div
                    className="px-6 py-4 border-t border-border"
                    style={{ background: styles.sectionBg, color: styles.contentText, fontFamily: `'${styles.fontBody}', sans-serif` }}
                  >
                    <p className="text-sm opacity-70">Sección de contenido — texto persuasivo y beneficios...</p>
                  </div>
                  {/* Portfolio preview */}
                  <div
                    className="px-6 py-4 border-t border-border flex items-center gap-3"
                    style={{ background: styles.portfolioBg, color: styles.portfolioText }}
                  >
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-16 h-10 rounded-md opacity-50" style={{ background: styles.portfolioText }} />
                      ))}
                    </div>
                    <p className="text-xs opacity-70">Portafolio de proyectos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-32">
            {saving ? "Guardando..." : <><Check className="w-4 h-4 mr-1" />{editing === "new" ? "Publicar" : "Guardar cambios"}</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Landing Pages por Categoría
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Páginas específicas por tipo de cliente, accesibles desde el menú "Clientes" del sitio.
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="w-4 h-4 mr-1" /> Nueva landing page
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("pages")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "pages" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Globe className="w-4 h-4" /> Páginas ({pages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "contacts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Inbox className="w-4 h-4" /> Contactos recibidos ({contacts.length})
        </button>
      </div>

      {activeTab === "pages" && (
        <div className="space-y-3">
          {pages.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No hay landing pages creadas aún</p>
                <p className="text-muted-foreground text-sm mt-1 mb-4">Crea la primera para empezar a segmentar tu comunicación por tipo de cliente.</p>
                <Button onClick={startNew} variant="outline"><Plus className="w-4 h-4 mr-1" />Crear primera landing page</Button>
              </CardContent>
            </Card>
          ) : (
            pages.map((page) => (
              <Card key={page.id} className={`transition-opacity ${!page.active ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Brand color swatch for this page */}
                        {(() => {
                          const cs = parseStyles(page.customStyles);
                          return (
                            <span
                              className="inline-block w-3.5 h-3.5 rounded-full border border-white shadow-sm flex-shrink-0"
                              style={{ background: cs.heroBg }}
                              title="Color del hero"
                            />
                          );
                        })()}
                        <h3 className="font-semibold text-sm">{page.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${page.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                          {page.active ? "Publicada" : "Borrador"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        <code className="bg-muted px-1 rounded">/clientes/{page.slug}</code>
                        {" · "}
                        {CATEGORIES.find((c) => c.value === page.category)?.label ?? page.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleActive(page)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title={page.active ? "Ocultar" : "Publicar"}
                      >
                        {page.active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <a
                        href={`/clientes/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Ver en el sitio"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(page)} className="h-8 px-2">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id)} className="h-8 px-2 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No hay contactos recibidos aún</p>
                <p className="text-muted-foreground text-sm mt-1">Los formularios de las landing pages aparecerán aquí.</p>
              </CardContent>
            </Card>
          ) : (
            contacts.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{c.name}</span>
                        {c.company && <span className="text-xs text-muted-foreground">— {c.company}</span>}
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.landingTitle ?? c.landingSlug}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        📞 {c.phone}{c.email ? ` · ✉️ ${c.email}` : ""}
                        {" · "}{new Date(c.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      {c.message && (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setExpandedContact(expandedContact === c.id ? null : c.id)}
                        >
                          {expandedContact === c.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {expandedContact === c.id ? "Ocultar mensaje" : "Ver mensaje"}
                        </button>
                      )}
                      {expandedContact === c.id && c.message && (
                        <p className="mt-2 text-sm bg-muted rounded-lg p-3">{c.message}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteContact(c.id)} className="shrink-0 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper component ─────────────────────────────────────────────────────────
function ColorField({
  label,
  value,
  onChange,
  preview,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  preview: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md border border-border shadow-sm flex-shrink-0 cursor-pointer overflow-hidden relative"
          style={{ background: preview }}
        >
          <input
            type="color"
            value={value.startsWith("#") ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label={label}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#145c30"
          className="font-mono text-sm flex-1"
          maxLength={25}
        />
      </div>
    </div>
  );
}
