import { useState, useEffect, useCallback } from "react";
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ImageUpload from "@/components/admin/image-upload";

interface Product {
  id: number; name: string; description: string; price: number;
  category: string; image_url: string; unit: string; in_stock: boolean; featured: boolean;
  sale_price?: number | null; discount_label?: string | null;
}

const EMPTY: Omit<Product, "id"> = {
  name: "", description: "", price: 0, category: "", image_url: "", unit: "unidad", in_stock: true, featured: false,
  sale_price: null, discount_label: "",
};

const CATEGORIES = [
  "Plantas", "Fertilizantes", "Herramientas", "Sustratos", "Sistemas de Riego",
  "Macetas y Contenedores", "Decoración", "Semillas", "Control de Plagas", "Otro",
];

const UNITS = ["unidad", "kg", "litro", "m²", "bulto", "caja", "rollo", "metro"];

export default function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await getAdminProducts()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(EMPTY); setDialogOpen(true); }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: p.price, category: p.category, image_url: p.image_url, unit: p.unit, in_stock: p.in_stock, featured: p.featured, sale_price: p.sale_price ?? null, discount_label: p.discount_label ?? "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description, price: Number(form.price), category: form.category,
        imageUrl: form.image_url, unit: form.unit, inStock: form.in_stock, featured: form.featured,
        salePrice: form.sale_price !== null && form.sale_price !== undefined && String(form.sale_price) !== "" ? Number(form.sale_price) : null,
        discountLabel: (form.discount_label || "").trim() || null,
      };
      if (editing) { await updateProduct(editing.id, payload); } else { await createProduct(payload); }
      setDialogOpen(false);
      await load();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar este producto de la tienda?")) return;
    try { await deleteProduct(id); await load(); } catch (err: any) { alert(err.message); }
  }

  const f = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tienda — Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} producto(s) registrado(s)</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Agregar producto</Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Cargando...</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium">Producto</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Categoría</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Precio</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Stock</th>
                <th className="text-right p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">${p.price.toLocaleString("es-CO")}</td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.in_stock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.in_stock ? "Disponible" : "Agotado"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} title="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No hay productos. Agrega el primero.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Agregar producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={f("name")} placeholder="Ej: Abono orgánico premium" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.category} onChange={f("category")}>
                <option value="">Seleccionar...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio normal (COP) *</Label>
                <Input type="number" value={form.price} onChange={f("price")} placeholder="0" min={0} />
              </div>
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.unit} onChange={f("unit")}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50/50 p-3 space-y-3">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Promoción / Precio en oferta</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Precio de oferta (COP)</Label>
                  <Input
                    type="number"
                    value={form.sale_price ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value === "" ? null : Number(e.target.value) }))}
                    placeholder="Dejar vacío = sin oferta"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Etiqueta de descuento</Label>
                  <Input
                    value={form.discount_label ?? ""}
                    onChange={f("discount_label")}
                    placeholder="Ej: -20%, Temporada, Black Friday"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Si el precio de oferta es menor al precio normal, se mostrará el precio original tachado en la tienda.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Textarea value={form.description} onChange={f("description")} rows={3} placeholder="Describe el producto..." />
            </div>
            <div className="space-y-1.5">
              <Label>Imagen del producto</Label>
              {form.image_url && (
                <div className="rounded-lg overflow-hidden h-28 bg-muted mb-2">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input value={form.image_url} onChange={f("image_url")} placeholder="https://... o sube un archivo" className="mb-2" />
              <ImageUpload label="Subir imagen" accept="image/*" onUploaded={(url) => setForm((p) => ({ ...p, image_url: url }))} />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm((p) => ({ ...p, in_stock: e.target.checked }))} className="rounded" />
                Disponible en stock
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} className="rounded" />
                Producto destacado
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.category}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
