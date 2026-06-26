import { useState, useEffect, useCallback } from "react";
import { getAdminQuotes } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Quote {
  id: number;
  name: string;
  company: string;
  client_type: string;
  phone: string;
  email: string | null;
  service: string;
  location: string | null;
  area: string | null;
  message: string;
  created_at: string;
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  "conjunto-residencial": "Conjunto Residencial",
  "empresa-comercial": "Empresa / Comercial",
  "institucion-educativa": "Institución Educativa",
  "sector-salud": "Sector Salud",
  "gobierno-institucional": "Gobierno / Institucional",
  "otro": "Otro",
};

export default function QuotesPanel() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Quote | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cotizaciones recibidas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {quotes.length} solicitud(es) — haz clic en una fila para ver el detalle
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Cargando...</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium">Contacto</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Empresa</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Servicio</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Tipo</th>
                <th className="text-left p-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((q) => (
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
                      {CLIENT_TYPE_LABELS[q.client_type] ?? q.client_type}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDate(q.created_at)}</td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Aún no hay solicitudes de cotización.
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
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground block">Nombre</span><strong>{selected.name}</strong></div>
                <div><span className="text-muted-foreground block">Empresa</span><strong>{selected.company}</strong></div>
                <div><span className="text-muted-foreground block">Teléfono</span><strong>{selected.phone}</strong></div>
                <div><span className="text-muted-foreground block">Email</span><strong>{selected.email ?? "—"}</strong></div>
                <div><span className="text-muted-foreground block">Tipo de cliente</span><strong>{CLIENT_TYPE_LABELS[selected.client_type] ?? selected.client_type}</strong></div>
                <div><span className="text-muted-foreground block">Servicio</span><strong>{selected.service}</strong></div>
                <div><span className="text-muted-foreground block">Ubicación</span><strong>{selected.location ?? "—"}</strong></div>
                <div><span className="text-muted-foreground block">Área aprox.</span><strong>{selected.area ?? "—"}</strong></div>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Mensaje</span>
                <p className="bg-muted/40 rounded-lg p-3 leading-relaxed">{selected.message}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Recibido el {new Date(selected.created_at).toLocaleString("es-CO")}
              </div>
              <div className="pt-2">
                <a
                  href={`https://wa.me/${selected.phone.replace(/\D/g, "")}?text=Hola ${encodeURIComponent(selected.name)}, recibimos su solicitud de cotización para ${encodeURIComponent(selected.service)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Responder por WhatsApp
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
