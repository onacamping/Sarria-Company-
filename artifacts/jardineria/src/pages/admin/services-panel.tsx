import { useState, useEffect } from "react";
import { getToken } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, X, Check, GripVertical } from "lucide-react";

const base = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

interface Service {
  id: number;
  title: string;
  description: string;
  icon_name: string;
  active: boolean;
  sort_order: number;
}

const ICONS = [
  "Leaf","Trees","Sprout","Scissors","Bug","Lightbulb",
  "Droplets","Wind","Sun","Flower","Mountain","Layers",
  "Wrench","Shield","Star","Zap",
];

const EMPTY = { title: "", description: "", icon_name: "Leaf", active: true, sort_order: 0 };

async function apiSvc(method: string, path: string, body?: unknown) {
  const res = await fetch(`${base()}/api/admin${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error");
  return data;
}

export default function ServicesPanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setServices(await apiSvc("GET", "/services")); } finally { setLoading(false); }
  }

  function startEdit(s: Service) {
    setEditId(s.id);
    setForm({ title: s.title, description: s.description, icon_name: s.icon_name, active: s.active, sort_order: s.sort_order });
    setAdding(false);
  }

  function cancelEdit() { setEditId(null); setAdding(false); setForm(EMPTY); }

  async function handleSave() {
    if (!form.title.trim()) { alert("El título es requerido"); return; }
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, iconName: form.icon_name, active: form.active, sortOrder: form.sort_order };
      if (editId != null) { await apiSvc("PUT", `/services/${editId}`, payload); }
      else { await apiSvc("POST", "/services", payload); }
      cancelEdit();
      await load();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este servicio?")) return;
    setDeleting(id);
    try { await apiSvc("DELETE", `/services/${id}`); await load(); }
    catch (e: any) { alert(e.message); } finally { setDeleting(null); }
  }

  const setF = (k: keyof typeof form) => (v: string | boolean | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  function FormCard() {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Título del servicio *</Label>
              <Input value={form.title} onChange={(e) => setF("title")(e.target.value)} placeholder="Ej: Mantenimiento de Zonas Verdes" />
            </div>
            <div className="space-y-1.5">
              <Label>Ícono</Label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={form.icon_name}
                onChange={(e) => setF("icon_name")(e.target.value)}
              >
                {ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setF("description")(e.target.value)} placeholder="Descripción del servicio..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Orden de visualización</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setF("sort_order")(Number(e.target.value))} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.active} onChange={(e) => setF("active")(e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium">Visible en el sitio</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
              <Check className="w-4 h-4" />
              {saving ? "Guardando..." : editId != null ? "Actualizar" : "Crear servicio"}
            </Button>
            <Button onClick={cancelEdit} variant="ghost" size="sm" className="gap-1.5">
              <X className="w-4 h-4" /> Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">Cargando servicios...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nuestros Servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">Edita los servicios que aparecen en la sección principal del sitio.</p>
        </div>
        {!adding && editId == null && (
          <Button size="sm" onClick={() => { setAdding(true); setEditId(null); setForm(EMPTY); }} className="gap-1.5">
            <Plus className="w-4 h-4" /> Nuevo servicio
          </Button>
        )}
      </div>

      {adding && editId == null && <FormCard />}

      <div className="space-y-3">
        {services.length === 0 && (
          <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No hay servicios. Crea el primero.
          </div>
        )}
        {services.map((s) => (
          <div key={s.id}>
            {editId === s.id ? <FormCard /> : (
              <Card className={!s.active ? "opacity-60" : ""}>
                <CardContent className="pt-4 flex items-start gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{s.title}</span>
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{s.icon_name}</span>
                      {!s.active && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Oculto</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(s)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={deleting === s.id} onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
