import { useState, useEffect, useCallback } from "react";
import {
  getAdminPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Zap, Copy, Check } from "lucide-react";

interface PromoCode {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description: string;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  appliesTo: string;
  createdAt: string;
}

const EMPTY_FORM = {
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: 10,
  description: "",
  minOrderAmount: 0,
  maxUses: "" as string | number,
  active: true,
  expiresAt: "",
  appliesTo: "all",
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 p-0.5 rounded hover:bg-muted transition-colors"
      title="Copiar código"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

export default function PromoCodesPanel() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCodes(await getAdminPromoCodes()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(c: PromoCode) {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      description: c.description,
      minOrderAmount: c.minOrderAmount,
      maxUses: c.maxUses ?? "",
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      appliesTo: c.appliesTo,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.code.trim()) return alert("El código es obligatorio.");
    if (Number(form.value) <= 0) return alert("El valor debe ser mayor a 0.");
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        description: form.description,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxUses: form.maxUses !== "" ? Number(form.maxUses) : null,
        active: form.active,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        appliesTo: form.appliesTo || "all",
      };
      if (editing) {
        await updatePromoCode(editing.id, payload);
      } else {
        await createPromoCode(payload);
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
    if (!confirm("¿Eliminar este código promocional?")) return;
    try { await deletePromoCode(id); await load(); } catch (err: any) { alert(err.message); }
  }

  async function handleToggle(c: PromoCode) {
    try { await updatePromoCode(c.id, { active: !c.active }); await load(); } catch {}
  }

  const set = (k: keyof typeof form) => (v: string | boolean | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const isExpired = (c: PromoCode) => !!c.expiresAt && new Date(c.expiresAt) < new Date();
  const isExhausted = (c: PromoCode) => c.maxUses !== null && c.usedCount >= c.maxUses;

  function statusBadge(c: PromoCode) {
    if (!c.active) return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Inactivo</span>;
    if (isExpired(c)) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Expirado</span>;
    if (isExhausted(c)) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Agotado</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Activo</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" /> Códigos Promocionales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crea descuentos y promociones para tu tienda. Los clientes los ingresan al pedir por WhatsApp.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo código
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Cargando...</div>
      ) : codes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <Tag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No hay códigos creados aún</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Crea el primero para ofrecer descuentos en tu tienda.</p>
            <Button variant="outline" onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Crear primer código</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {codes.map((c) => (
            <Card key={c.id} className={`transition-opacity ${!c.active || isExpired(c) || isExhausted(c) ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <code className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded tracking-wider">{c.code}</code>
                      <CopyButton text={c.code} />
                      {statusBadge(c)}
                      {c.type === "percentage" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <Percent className="w-3 h-3" />{c.value}% descuento
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <DollarSign className="w-3 h-3" />{formatCOP(c.value)} descuento
                        </span>
                      )}
                    </div>
                    {c.description && <p className="text-sm text-muted-foreground mb-1">{c.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {c.minOrderAmount > 0 && <span>Mínimo: {formatCOP(c.minOrderAmount)}</span>}
                      {c.maxUses !== null && <span>Usos: {c.usedCount}/{c.maxUses}</span>}
                      {c.maxUses === null && c.usedCount > 0 && <span>Usado {c.usedCount} {c.usedCount === 1 ? "vez" : "veces"}</span>}
                      {c.expiresAt && <span>Expira: {new Date(c.expiresAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                      {c.appliesTo !== "all" && <span>Aplica a: {c.appliesTo}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch
                      checked={c.active}
                      onCheckedChange={() => handleToggle(c)}
                      title={c.active ? "Desactivar" : "Activar"}
                    />
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="h-8 px-2">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="h-8 px-2 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick stats */}
      {codes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-primary">{codes.filter(c => c.active && !isExpired(c) && !isExhausted(c)).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Activos</p>
          </CardContent></Card>
          <Card><CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{codes.reduce((a, c) => a + c.usedCount, 0)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Usos totales</p>
          </CardContent></Card>
          <Card><CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{codes.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total creados</p>
          </CardContent></Card>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {editing ? "Editar código promocional" : "Nuevo código promocional"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Code */}
            <div className="space-y-1.5">
              <Label>Código *</Label>
              <Input
                value={form.code}
                onChange={(e) => set("code")(e.target.value.toUpperCase())}
                placeholder="SARRIA10"
                className="font-mono tracking-wider"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">Se guarda en mayúsculas. El cliente lo ingresa tal cual.</p>
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de descuento *</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.type}
                  onChange={(e) => set("type")(e.target.value as "percentage" | "fixed")}
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (COP)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{form.type === "percentage" ? "Porcentaje (0-100) *" : "Monto a descontar (COP) *"}</Label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => set("value")(e.target.value)}
                  min={0}
                  max={form.type === "percentage" ? 100 : undefined}
                  placeholder={form.type === "percentage" ? "10" : "50000"}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Descripción (visible para el cliente)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                rows={2}
                placeholder="10% de descuento en toda la tienda por temporada de jardines..."
              />
            </div>

            {/* Min order + max uses */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Compra mínima (COP)</Label>
                <Input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => set("minOrderAmount")(e.target.value)}
                  min={0}
                  placeholder="0 = sin mínimo"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Máximo de usos</Label>
                <Input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => set("maxUses")(e.target.value)}
                  min={1}
                  placeholder="Dejar vacío = ilimitado"
                />
              </div>
            </div>

            {/* Expires + applies to */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha de expiración</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => set("expiresAt")(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Aplica a</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.appliesTo}
                  onChange={(e) => set("appliesTo")(e.target.value)}
                >
                  <option value="all">Toda la tienda</option>
                  <option value="category:plantas">Solo Plantas</option>
                  <option value="category:macetas">Solo Macetas</option>
                  <option value="category:tierra">Solo Tierra/Sustratos</option>
                  <option value="category:herramientas">Solo Herramientas</option>
                  <option value="category:fertilizantes">Solo Fertilizantes</option>
                </select>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="promo-active"
                checked={form.active}
                onCheckedChange={(v) => set("active")(v)}
              />
              <Label htmlFor="promo-active">
                {form.active ? "Código activo (visible en la tienda)" : "Código inactivo (no se puede usar)"}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.code.trim()}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear código"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
