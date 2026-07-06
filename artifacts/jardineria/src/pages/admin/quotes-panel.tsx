import { useState, useEffect, useCallback, useMemo } from "react";
import { getAdminQuotes, updateQuoteStatus, deleteQuote } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Trash2 } from "lucide-react";

interface Quote {
  id: number;
  name: string;
  company: string;
  clientType: string;
  phone: string;
  email: string | null;
  service: string;
  location: string | null;
  area: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  "conjunto-residencial": "Conjunto Residencial",
  "empresa-comercial": "Empresa / Comercial",
  "institucion-educativa": "Institución Educativa",
  "sector-salud": "Sector Salud",
  "gobierno-institucional": "Gobierno / Institucional",
  "otro": "Otro",
};

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "revisada", label: "Revisada" },
  { value: "cancelada", label: "Cancelada" },
];

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  revisada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelada: "bg-red-50 text-red-700 border-red-200",
};

type SortKey = "createdAt" | "name" | "company" | "service" | "status";
type SortDir = "asc" | "desc";

export default function QuotesPanel() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminQuotes();
      setQuotes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  }

  const visibleQuotes = useMemo(() => {
    let list = quotes;
    if (statusFilter) list = list.filter((q) => (q.status || "pendiente") === statusFilter);
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [quotes, statusFilter, sortKey, sortDir]);

  async function handleStatusChange(id: number, status: string) {
    setUpdatingId(id);
    try {
      await updateQuoteStatus(id, status);
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteQuote(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      setSelected((prev) => (prev && prev.id === id ? null : prev));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function StatusSelect({ quote }: { quote: Quote }) {
    return (
      <select
        value={quote.status || "pendiente"}
        disabled={updatingId === quote.id}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => handleStatusChange(quote.id, e.target.value)}
        className={`text-xs font-medium rounded-full border px-2 py-1 ${STATUS_STYLES[quote.status || "pendiente"] ?? ""}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones recibidas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {visibleQuotes.length} de {quotes.length} solicitud(es) — haz clic en una fila para ver el detalle
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {[{ value: "", label: "Todas" }, ...STATUS_OPTIONS].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === opt.value ? "bg-white shadow-sm" : "text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Cargando...</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Contacto <SortIcon column="name" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium hidden md:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("company")}>
                    Empresa <SortIcon column="company" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("service")}>
                    Servicio <SortIcon column="service" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Tipo</th>
                <th className="text-left p-3 font-medium">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("status")}>
                    Estado <SortIcon column="status" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                    Fecha <SortIcon column="createdAt" />
                  </button>
                </th>
                <th className="text-left p-3 font-medium">Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleQuotes.map((q) => (
                <tr
                  key={q.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setSelected(q)}
                >
                  <td className="p-3">
                    <div className="font-medium">{q.name}</div>
                    <div className="text-xs text-muted-foreground">{q.phone}</div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{q.company}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{q.service}</td>
                  <td className="p-3 hidden lg:table-cell">
                    <Badge variant="secondary" className="text-xs">
                      {CLIENT_TYPE_LABELS[q.clientType] ?? q.clientType}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <StatusSelect quote={q} />
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDate(q.createdAt)}</td>
                  <td className="p-3">
                    <button
                      aria-label="Eliminar cotización"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(q.id);
                      }}
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {visibleQuotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {quotes.length === 0
                      ? "Aún no hay solicitudes de cotización."
                      : "No hay cotizaciones con este estado."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de cotización</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Estado</span>
                <StatusSelect quote={selected} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground block">Nombre</span><strong>{selected.name}</strong></div>
                <div><span className="text-muted-foreground block">Empresa</span><strong>{selected.company}</strong></div>
                <div><span className="text-muted-foreground block">Teléfono</span><strong>{selected.phone}</strong></div>
                <div><span className="text-muted-foreground block">Email</span><strong>{selected.email ?? "—"}</strong></div>
                <div><span className="text-muted-foreground block">Tipo de cliente</span><strong>{CLIENT_TYPE_LABELS[selected.clientType] ?? selected.clientType}</strong></div>
                <div><span className="text-muted-foreground block">Servicio</span><strong>{selected.service}</strong></div>
                <div><span className="text-muted-foreground block">Ubicación</span><strong>{selected.location ?? "—"}</strong></div>
                <div><span className="text-muted-foreground block">Área aprox.</span><strong>{selected.area ?? "—"}</strong></div>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Mensaje</span>
                <p className="bg-muted/40 rounded-lg p-3 leading-relaxed">{selected.message}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Recibido el {new Date(selected.createdAt).toLocaleString("es-CO")}
              </div>
              <div className="pt-2 flex items-center justify-between gap-2">
                <a
                  href={`https://wa.me/${selected.phone.replace(/\D/g, "")}?text=Hola ${encodeURIComponent(selected.name)}, recibimos su solicitud de cotización para ${encodeURIComponent(selected.service)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Responder por WhatsApp
                </a>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                  onClick={() => setConfirmDeleteId(selected.id)}
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta cotización?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. La solicitud se eliminará de forma permanente.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} disabled={deletingId !== null}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 gap-2"
              onClick={() => confirmDeleteId !== null && handleDelete(confirmDeleteId)}
              disabled={deletingId !== null}
            >
              {deletingId !== null && <Loader2 className="w-4 h-4 animate-spin" />}
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
