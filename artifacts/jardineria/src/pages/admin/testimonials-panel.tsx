import { useState, useEffect, useCallback } from "react";
import {
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/lib/admin-api";
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

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  location: string;
  active: boolean;
  sort_order: number;
}

const EMPTY: Omit<Testimonial, "id"> = {
  quote: "",
  author: "",
  role: "",
  location: "",
  active: true,
  sort_order: 0,
};

export default function TestimonialsPanel() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminTestimonials();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: items.length });
    setDialogOpen(true);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm({
      quote: t.quote,
      author: t.author,
      role: t.role,
      location: t.location,
      active: t.active,
      sort_order: t.sort_order,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        quote: form.quote,
        author: form.author,
        role: form.role,
        location: form.location,
        active: form.active,
        sortOrder: form.sort_order,
      };
      if (editing) {
        await updateTestimonial(editing.id, payload);
      } else {
        await createTestimonial(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar este testimonio?")) return;
    try {
      await deleteTestimonial(id);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function toggleActive(t: Testimonial) {
    try {
      await updateTestimonial(t.id, {
        quote: t.quote,
        author: t.author,
        role: t.role,
        location: t.location,
        active: !t.active,
        sortOrder: t.sort_order,
      });
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const f = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Testimonios</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} testimonio(s) registrado(s)</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar testimonio
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Cargando...</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium">Autor</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Rol / Empresa</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Visible</th>
                <th className="text-right p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div className="font-medium">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.location}</div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{t.role}</td>
                  <td className="p-3 hidden sm:table-cell">
                    <button
                      onClick={() => toggleActive(t)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                        t.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {t.active ? "Visible" : "Oculto"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(t.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    No hay testimonios. Agrega el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar testimonio" : "Agregar testimonio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del cliente *</Label>
              <Input value={form.author} onChange={f("author")} placeholder="Ej: Carlos Mendoza" />
            </div>
            <div className="space-y-1.5">
              <Label>Cargo / Rol *</Label>
              <Input value={form.role} onChange={f("role")} placeholder="Ej: Administrador de Conjunto" />
            </div>
            <div className="space-y-1.5">
              <Label>Ubicación</Label>
              <Input value={form.location} onChange={f("location")} placeholder="Ej: Chía, Cundinamarca" />
            </div>
            <div className="space-y-1.5">
              <Label>Testimonio *</Label>
              <Textarea
                value={form.quote}
                onChange={f("quote")}
                rows={4}
                placeholder="Escribe el testimonio del cliente..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Orden de aparición</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                    className="rounded"
                  />
                  Mostrar en el sitio
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.author || !form.role || !form.quote}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear testimonio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
