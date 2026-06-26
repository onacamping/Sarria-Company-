import { useState, useEffect, useCallback } from "react";
import { getAdminProjects, createProject, updateProject, deleteProject } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageUpload from "@/components/admin/image-upload";

interface Project {
  id: number;
  title: string;
  category: string;
  location: string;
  description: string;
  image_url: string;
  year: number;
  area_sqm: number | null;
  tags: string[] | null;
}

const EMPTY: Omit<Project, "id"> = {
  title: "", category: "", location: "", description: "", image_url: "",
  year: new Date().getFullYear(), area_sqm: null, tags: [],
};

const CATEGORIES = [
  "Conjunto Residencial", "Centro Comercial", "Institución Educativa",
  "Edificio Corporativo", "Clínica / Hospital", "Parque / Área Pública", "Empresa / Industria", "Otro",
];

export default function ProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setProjects(await getAdminProjects()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setDialogOpen(true); }
  function openEdit(p: Project) {
    setEditing(p);
    setForm({ title: p.title, category: p.category, location: p.location, description: p.description, image_url: p.image_url, year: p.year, area_sqm: p.area_sqm, tags: p.tags ?? [] });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        title: form.title, category: form.category, location: form.location,
        description: form.description, imageUrl: form.image_url, year: form.year,
        areaSqm: form.area_sqm,
        tags: typeof form.tags === "string"
          ? (form.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
          : form.tags ?? [],
      };
      if (editing) { await updateProject(editing.id, payload); } else { await createProject(payload); }
      setDialogOpen(false);
      await load();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar este proyecto?")) return;
    try { await deleteProject(id); await load(); } catch (err: any) { alert(err.message); }
  }

  const f = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portafolio de Proyectos</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} proyecto(s) registrado(s)</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar proyecto
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Cargando...</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Categoría</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Ubicación</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Año</th>
                <th className="text-right p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{p.location}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{p.year}</td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No hay proyectos. Agrega el primero.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar proyecto" : "Agregar proyecto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del proyecto *</Label>
              <Input value={form.title} onChange={f("title")} placeholder="Ej: Conjunto Los Pinos" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.category} onChange={f("category")}>
                <option value="">Seleccionar...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Ubicación *</Label>
              <Input value={form.location} onChange={f("location")} placeholder="Ej: Chía, Cundinamarca" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Año</Label>
                <Input type="number" value={form.year} onChange={f("year")} min={2000} max={2030} />
              </div>
              <div className="space-y-1.5">
                <Label>Área (m²)</Label>
                <Input type="number" value={form.area_sqm ?? ""} onChange={f("area_sqm")} placeholder="Opcional" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Textarea value={form.description} onChange={f("description")} rows={3} placeholder="Describe el trabajo realizado..." />
            </div>
            <div className="space-y-1.5">
              <Label>Imagen del proyecto</Label>
              {form.image_url && (
                <div className="rounded-lg overflow-hidden h-28 bg-muted mb-2">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input value={form.image_url} onChange={f("image_url")} placeholder="https://... o sube un archivo" className="mb-2" />
              <ImageUpload label="Subir imagen" accept="image/*" onUploaded={(url) => setForm((p) => ({ ...p, image_url: url }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Etiquetas (separadas por coma)</Label>
              <Input
                value={Array.isArray(form.tags) ? form.tags.join(", ") : (form.tags ?? "")}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))}
                placeholder="Ej: diseño, césped, riego"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.category || !form.location}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
