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
  Users, Inbox, ExternalLink, Eye, EyeOff,
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

const CATEGORIES = [
  { value: "conjuntos_residenciales", label: "Conjuntos Residenciales" },
  { value: "colegios", label: "Colegios e Instituciones" },
  { value: "edificios", label: "Edificios y Oficinas" },
  { value: "centros_comerciales", label: "Centros Comerciales" },
  { value: "empresas", label: "Empresas" },
  { value: "clinicas", label: "Clínicas y Hospitales" },
];

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

export default function LandingPagesPanel() {
  const [activeTab, setActiveTab] = useState<"pages" | "contacts">("pages");
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [contacts, setContacts] = useState<LandingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(emptyForm());
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
    setPages(p);
    setContacts(c);
    setLoading(false);
  }

  function startNew() {
    setForm(emptyForm());
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
    setEditing(page.id);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm());
  }

  const set = (k: keyof typeof form) => (v: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

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
