import { useEffect, useRef, useState } from "react";
import {
  getCertToken,
  setCertToken,
  clearCertToken,
  unlockCertificates,
  getCertificates,
  createCertificate,
  deleteCertificate,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ImageUpload from "@/components/admin/image-upload";
import {
  Lock, Trash2, Download, FileText, Eye, X, ShieldCheck,
  ExternalLink, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight,
  Image as ImageIcon,
} from "lucide-react";

interface Certificate {
  id: number;
  title: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

const base = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const fileUrl = (url: string) => (url.startsWith("http") ? url : `${base()}${url}`);

function PasswordGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await unlockCertificates(password);
      setCertToken(token);
      onUnlocked();
    } catch (err: any) {
      setError(err.message ?? "Contraseña incorrecta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-base">Acceso restringido</CardTitle>
          <CardDescription>
            Esta sección contiene certificados sensibles. Ingresa la contraseña para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cert-password">Contraseña</Label>
              <Input
                id="cert-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading ? "Verificando..." : "Desbloquear"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CertificateViewer({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const url = fileUrl(cert.fileUrl);
  const isPdf = cert.fileType === "pdf";

  // PDF state
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfFailed, setPdfFailed] = useState(false);
  const embedRef = useRef<HTMLEmbedElement>(null);

  // Image state
  const [zoom, setZoom] = useState(1);

  // ESC key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Detect if embed actually rendered (PDF may load silently or fail silently)
  useEffect(() => {
    if (!isPdf) return;
    const timer = setTimeout(() => {
      // If embed element has no content-width, assume it failed
      if (embedRef.current && embedRef.current.clientHeight < 10) {
        setPdfFailed(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [isPdf]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-5xl flex flex-col overflow-hidden shadow-2xl"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isPdf
              ? <FileText className="w-4 h-4 text-red-500 shrink-0" />
              : <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
            }
            <span className="font-semibold text-sm truncate">{cert.title}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0 uppercase">
              {cert.fileType}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Image zoom controls */}
            {!isPdf && (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} title="Reducir">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(4, z + 0.25))} title="Ampliar">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(1)} title="Restablecer">
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <div className="w-px h-5 bg-border mx-1" />
              </>
            )}

            {/* Open in new tab */}
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-xs">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva pestaña</span>
              </Button>
            </a>

            {/* Download */}
            <a href={url} download={cert.title}>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Descargar</span>
              </Button>
            </a>

            {/* Close */}
            <Button size="icon" variant="ghost" className="h-8 w-8 ml-1" onClick={onClose} title="Cerrar (ESC)">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto bg-neutral-100 relative">
          {isPdf ? (
            <>
              {/* Loading indicator */}
              {!pdfLoaded && !pdfFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Cargando PDF...</p>
                </div>
              )}

              {/* Embed — primary renderer */}
              {!pdfFailed && (
                <embed
                  ref={embedRef}
                  src={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                  type="application/pdf"
                  className="w-full transition-opacity duration-300"
                  style={{ height: "75vh", opacity: pdfLoaded ? 1 : 0 }}
                  onLoad={() => setPdfLoaded(true)}
                  onError={() => setPdfFailed(true)}
                />
              )}

              {/* Fallback when embed fails */}
              {pdfFailed && (
                <div className="flex flex-col items-center justify-center gap-5 py-24 px-4 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">No se puede mostrar este PDF en el navegador.</p>
                    <p className="text-sm text-muted-foreground mt-1">Puede abrirlo en una nueva pestaña o descargarlo directamente.</p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Button className="gap-2">
                        <ExternalLink className="w-4 h-4" /> Abrir en nueva pestaña
                      </Button>
                    </a>
                    <a href={url} download={cert.title}>
                      <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Descargar PDF
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Image viewer ── */
            <div
              className="flex items-start justify-center min-h-full p-6 overflow-auto"
              style={{ cursor: zoom > 1 ? "grab" : "default" }}
            >
              <img
                src={url}
                alt={cert.title}
                draggable={false}
                className="rounded-lg shadow-lg transition-transform duration-200 select-none"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top center", maxWidth: "100%" }}
                onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
              />
            </div>
          )}
        </div>

        {/* ── Footer hint ── */}
        <div className="px-4 py-2 border-t border-border bg-muted/40 shrink-0 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {isPdf
              ? "Usa los controles del visor para navegar páginas y ajustar el zoom del PDF."
              : "Doble clic para ampliar · Usa los botones + / − para hacer zoom."}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}

function CertificateCard({
  cert,
  onView,
  onDelete,
}: {
  cert: Certificate;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div
          className="h-36 rounded-lg bg-muted flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={onView}
        >
          {cert.fileType === "pdf" ? (
            <FileText className="w-10 h-10 text-muted-foreground" />
          ) : (
            <img src={fileUrl(cert.fileUrl)} alt={cert.title} className="w-full h-full object-cover" />
          )}
        </div>
        <p className="font-medium text-sm truncate" title={cert.title}>
          {cert.title}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={onView}>
            <Eye className="w-3.5 h-3.5" />
            Ver
          </Button>
          <a href={fileUrl(cert.fileUrl)} download className="flex-1">
            <Button size="sm" variant="outline" className="w-full gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Descargar
            </Button>
          </a>
          <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CertificatesManager() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [pendingUrl, setPendingUrl] = useState("");
  const [pendingType, setPendingType] = useState("");
  const [viewing, setViewing] = useState<Certificate | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    getCertificates()
      .then(setCerts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd() {
    if (!title.trim() || !pendingUrl) return;
    try {
      await createCertificate({ title: title.trim(), fileUrl: pendingUrl, fileType: pendingType });
      setTitle("");
      setPendingUrl("");
      setPendingType("");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este certificado?")) return;
    try {
      await deleteCertificate(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleLock() {
    clearCertToken();
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Certificados
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sube, visualiza y descarga los certificados de la empresa.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleLock}>
          <Lock className="w-4 h-4" />
          Bloquear
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subir nuevo certificado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cert-title">Nombre del certificado</Label>
            <Input
              id="cert-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Certificado ISO 9001"
            />
          </div>
          <div className="flex items-center gap-3">
            <ImageUpload
              accept="application/pdf,image/*"
              label={pendingUrl ? "Archivo cargado ✓" : "Subir archivo"}
              onUploaded={(url) => {
                setPendingUrl(url);
                setPendingType(/\.pdf$/i.test(url) ? "pdf" : "image");
              }}
            />
            <Button onClick={handleAdd} disabled={!title.trim() || !pendingUrl}>
              Guardar certificado
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Cargando certificados...</div>
      ) : certs.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Aún no hay certificados cargados.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((cert) => (
            <CertificateCard
              key={cert.id}
              cert={cert}
              onView={() => setViewing(cert)}
              onDelete={() => handleDelete(cert.id)}
            />
          ))}
        </div>
      )}

      {viewing && <CertificateViewer cert={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

export default function CertificatesPanel() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(!!getCertToken());
  }, []);

  if (!unlocked) {
    return <PasswordGate onUnlocked={() => setUnlocked(true)} />;
  }

  return <CertificatesManager />;
}
