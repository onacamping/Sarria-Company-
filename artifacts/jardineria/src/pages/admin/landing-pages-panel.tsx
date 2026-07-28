import { useState, useEffect, lazy, Suspense } from "react";
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
  Users, Inbox, ExternalLink, Eye, EyeOff, Sparkles, Palette, Type,
} from "lucide-react";

const RichTextEditor = lazy(() => import("@/components/admin/rich-text-editor"));

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
  heroText: string;
  accentColor: string;
  buttonBg: string;
  buttonText: string;
  sectionBg: string;
  contentText: string;
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

// Colores del manual de marca Sarria Company
const BRAND_STYLE_DEFAULTS: StyleForm = {
  heroBg: "#145c30",   // verde oscuro (hsl 153 60% 20%)
  heroText: "#ffffff",
  accentColor: "#b56720", // ámbar (hsl 28 60% 45%)
  buttonBg: "#b56720",
  buttonText: "#ffffff",
  sectionBg: "#ffffff",
  contentText: "#1a2f1a",
  fontHeading: "Poppins",
  fontBody: "Metropolis",
};

const DEFAULT_STYLE: StyleForm = {
  heroBg: "#145c30",
  heroText: "#ffffff",
  accentColor: "#b56720",
  buttonBg: "#b56720",
  buttonText: "#ffffff",
  sectionBg: "#ffffff",
  contentText: "#1a2f1a",
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

type EditorTab = "content" | "style";

export default function LandingPagesPanel() {
  const [activeTab, setActiveTab] = useState<"pages" | "contacts">("pages");
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [contacts, setContacts] = useState<LandingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>("content");
  const [form, setForm] = useState(emptyForm());
  const [styles, setStyles] = useState<StyleForm>({ ...DEFAULT_STYLE });
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
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-muted/30 w-fit">
          <button
            type="button"
            onClick={() => setEditorTab("content")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              editorTab === "content"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="w-4 h-4" /> Contenido
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contenido principal (WYSIWYG)</CardTitle>
                <CardDescription>
                  Escribe textos persuasivos, beneficios, propuestas de valor, etc. Aparece entre el hero y el portafolio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-64 bg-muted rounded-lg animate-pulse" />}>
                  <RichTextEditor
                    value={form.content}
                    onChange={(html) => set("content")(html)}
                    placeholder="Describe los servicios especializados para este segmento de clientes..."
                    height={360}
                  />
                </Suspense>
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

        {/* ── STYLE TAB ── */}
        {editorTab === "style" && (
          <>
            {/* Manual de Marca banner */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4 px-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-primary">Manual de marca Sarria Company</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Aplica automáticamente los colores y tipografías oficiales de la marca en esta landing page.</p>
                  </div>
                  <Button variant="default" size="sm" onClick={applyBrandManual} className="shrink-0 gap-2">
                    <Sparkles className="w-4 h-4" />
                    Aplicar Manual de Marca
                  </Button>
                </div>
                {/* Brand color swatches preview */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-5 h-5 rounded-full border border-white shadow" style={{ background: BRAND_STYLE_DEFAULTS.heroBg }} title="Verde primario" />
                  <div className="w-5 h-5 rounded-full border border-white shadow" style={{ background: BRAND_STYLE_DEFAULTS.accentColor }} title="Ámbar secundario" />
                  <div className="w-5 h-5 rounded-full border border-border shadow" style={{ background: BRAND_STYLE_DEFAULTS.sectionBg }} title="Fondo blanco" />
                  <span className="text-xs text-muted-foreground ml-1">Poppins + Metropolis</span>
                </div>
              </CardContent>
            </Card>

            {/* Color pickers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Colores del Hero</CardTitle>
                <CardDescription>El banner superior grande de la página.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorField label="Fondo del hero" value={styles.heroBg} onChange={setStyle("heroBg")} preview={styles.heroBg} />
                <ColorField label="Color del texto" value={styles.heroText} onChange={setStyle("heroText")} preview={styles.heroText} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Colores de Acento y Botones</CardTitle>
                <CardDescription>Badges, botones CTA, y detalles decorativos.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorField label="Color de acento / badge" value={styles.accentColor} onChange={setStyle("accentColor")} preview={styles.accentColor} />
                <ColorField label="Fondo del botón CTA" value={styles.buttonBg} onChange={setStyle("buttonBg")} preview={styles.buttonBg} />
                <ColorField label="Texto del botón CTA" value={styles.buttonText} onChange={setStyle("buttonText")} preview={styles.buttonText} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Colores de Secciones de Contenido</CardTitle>
                <CardDescription>Área de texto, portafolio y formulario.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorField label="Fondo de sección" value={styles.sectionBg} onChange={setStyle("sectionBg")} preview={styles.sectionBg} />
                <ColorField label="Color del texto" value={styles.contentText} onChange={setStyle("contentText")} preview={styles.contentText} />
              </CardContent>
            </Card>

            {/* Fonts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipografía</CardTitle>
                <CardDescription>Fuentes para títulos y cuerpo de texto. Las fuentes deben estar disponibles en el sitio.</CardDescription>
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

            {/* Live preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vista Previa del Diseño</CardTitle>
                <CardDescription>Aproximación de cómo se verá el hero y los botones.</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-xl overflow-hidden border border-border shadow-sm"
                >
                  {/* Hero preview */}
                  <div
                    className="px-6 py-8 text-center"
                    style={{ background: styles.heroBg, color: styles.heroText, fontFamily: `'${styles.fontHeading}', sans-serif` }}
                  >
                    <span
                      className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider"
                      style={{ background: styles.accentColor + "33", color: styles.accentColor, border: `1px solid ${styles.accentColor}55` }}
                    >
                      Categoría
                    </span>
                    <h2 className="text-xl font-bold mb-2">{form.heroTitle || form.title || "Título de la Landing Page"}</h2>
                    {form.heroSubtitle && <p className="text-sm opacity-80 mb-4">{form.heroSubtitle}</p>}
                    <button
                      type="button"
                      className="text-sm font-semibold px-5 py-2 rounded-lg"
                      style={{ background: styles.buttonBg, color: styles.buttonText }}
                    >
                      Solicitar información
                    </button>
                  </div>
                  {/* Content preview */}
                  <div
                    className="px-6 py-5 border-t border-border"
                    style={{ background: styles.sectionBg, color: styles.contentText, fontFamily: `'${styles.fontBody}', sans-serif` }}
                  >
                    <p className="text-sm opacity-70">Aquí aparecerá el contenido de la landing page...</p>
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
