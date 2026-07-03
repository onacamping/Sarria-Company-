import { useEffect, useState } from "react";
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
import { Lock, Trash2, Download, FileText, Eye, X, ShieldCheck } from "lucide-react";

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
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold truncate">{cert.title}</h3>
          <div className="flex items-center gap-2">
            <a href={url} download className="inline-flex">
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Descargar
              </Button>
            </a>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-muted/30">
          {cert.fileType === "pdf" ? (
            <iframe src={url} title={cert.title} className="w-full h-[75vh]" />
          ) : (
            <img src={url} alt={cert.title} className="w-full h-auto" />
          )}
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
