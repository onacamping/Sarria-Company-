import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/home/navbar";
import Footer from "@/components/home/footer";
import SectionHeading from "@/components/home/section-heading";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getLandingPage, submitLandingContact, type LandingPage as LandingPageType, type LandingCustomStyles } from "@/lib/landing-api";
import { useListProjects, useGetProject } from "@workspace/api-client-react";
import { MapPin, Calendar, Maximize, Tag, CheckCircle, AlertCircle } from "lucide-react";

function parseStyles(raw: string): LandingCustomStyles {
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

function buildCssVars(cs: LandingCustomStyles): React.CSSProperties {
  return {
    ["--lp-hero-bg" as string]: cs.heroBg || "hsl(var(--primary))",
    ["--lp-hero-text" as string]: cs.heroText || "#ffffff",
    ["--lp-accent" as string]: cs.accentColor || "hsl(var(--secondary))",
    ["--lp-btn-bg" as string]: cs.buttonBg || "hsl(var(--secondary))",
    ["--lp-btn-text" as string]: cs.buttonText || "#ffffff",
    ["--lp-section-bg" as string]: cs.sectionBg || "#ffffff",
    ["--lp-content-text" as string]: cs.contentText || "hsl(var(--foreground))",
    ["--lp-font-heading" as string]: cs.fontHeading ? `'${cs.fontHeading}', sans-serif` : "var(--font-heading, inherit)",
    ["--lp-font-body" as string]: cs.fontBody ? `'${cs.fontBody}', sans-serif` : "var(--font-body, inherit)",
  } as React.CSSProperties;
}

export default function LandingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const [page, setPage] = useState<LandingPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getLandingPage(slug)
      .then((p) => { if (p) { setPage(p); } else { setNotFound(true); } })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LandingPageSkeleton />;
  if (notFound || !page) return <LandingNotFound />;

  const cs = parseStyles(page.customStyles ?? "{}");
  const cssVars = buildCssVars(cs);

  return (
    <>
      <Helmet>
        <title>{page.title} | Sarria Company</title>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
      </Helmet>
      <div className="flex flex-col min-h-screen" style={cssVars}>
        <Navbar />
        <main>
          <LandingHero page={page} />
          {page.content && <LandingContent content={page.content} />}
          <LandingPortfolio category={page.category} title={page.title} />
          <LandingContactForm page={page} />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
}

function LandingHero({ page }: { page: LandingPageType }) {
  return (
    <section
      className="relative text-primary-foreground pt-32 pb-20 px-4"
      style={{
        background: "var(--lp-hero-bg)",
        color: "var(--lp-hero-text)",
        fontFamily: "var(--lp-font-heading)",
      }}
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.15) 100%)" }} />
      <div className="container mx-auto relative z-10 text-center max-w-3xl">
        <span
          className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider"
          style={{
            background: "var(--lp-accent, hsl(var(--secondary)))" + "33",
            color: "var(--lp-hero-text)",
            border: "1px solid var(--lp-hero-text)" + "44",
          }}
        >
          {categoryLabel(page.category)}
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          {page.heroTitle ?? page.title}
        </h1>
        {page.heroSubtitle && (
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ opacity: 0.85 }}>
            {page.heroSubtitle}
          </p>
        )}
        <a
          href="#contacto-landing"
          className="inline-block font-semibold px-8 py-3 rounded-xl text-base transition-opacity hover:opacity-90"
          style={{
            background: "var(--lp-btn-bg)",
            color: "var(--lp-btn-text)",
          }}
        >
          Solicitar información
        </a>
      </div>
    </section>
  );
}

function LandingContent({ content }: { content: string }) {
  return (
    <section
      className="py-16"
      style={{
        background: "var(--lp-section-bg)",
        color: "var(--lp-content-text)",
        fontFamily: "var(--lp-font-body)",
      }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div
          className="prose prose-lg prose-headings:text-primary prose-a:text-secondary max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}

function LandingPortfolio({ category, title }: { category: string; title: string }) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { data: projects, isLoading } = useListProjects({ category: category as any });
  const { data: selectedProject } = useGetProject(selectedProjectId || 0, {
    query: { enabled: selectedProjectId !== null, queryKey: ["getProject", selectedProjectId] },
  });

  if (!isLoading && (!projects || projects.length === 0)) return null;

  return (
    <section id="portafolio-landing" className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10 text-center">
          <SectionHeading
            title={`Nuestros Proyectos para ${title}`}
            subtitle="Portafolio Específico"
            light
            alignment="center"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl bg-white/10" />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {projects?.map((p: any) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative overflow-hidden rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-base mb-1">{p.title}</h3>
                    <p className="text-sm text-primary-foreground/70 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {p.location}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {selectedProject && (
        <Dialog open={true} onOpenChange={() => setSelectedProjectId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProject.title}</DialogTitle>
              <DialogDescription>{selectedProject.category}</DialogDescription>
            </DialogHeader>
            <img src={selectedProject.imageUrl} alt={selectedProject.title} className="w-full rounded-lg aspect-video object-cover" />
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{selectedProject.location}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{selectedProject.year}</span>
              {selectedProject.areaSqm && <span className="flex items-center gap-1.5"><Maximize className="w-4 h-4" />{selectedProject.areaSqm.toLocaleString()} m²</span>}
            </div>
            <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
            {selectedProject.tags && selectedProject.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProject.tags.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            )}
            <Button asChild className="w-full mt-2">
              <a href="#contacto-landing">Solicitar una evaluación para su proyecto</a>
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

function LandingContactForm({ page }: { page: LandingPageType }) {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await submitLandingContact({
        landingSlug: page.slug,
        landingTitle: page.title,
        name: form.name,
        company: form.company || undefined,
        phone: form.phone,
        email: form.email || undefined,
        message: form.message || undefined,
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Error al enviar el formulario");
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id="contacto-landing"
      className="py-20"
      style={{ background: "var(--lp-section-bg, #f7f7f5)" }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <div className="text-center mb-10">
          <SectionHeading title={page.formTitle} subtitle="Contáctenos" alignment="center" />
          {page.formDescription && (
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{page.formDescription}</p>
          )}
        </div>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-semibold text-emerald-900 text-lg mb-2">¡Mensaje recibido!</h3>
            <p className="text-emerald-700 text-sm">Nos pondremos en contacto con usted muy pronto.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 md:p-8 space-y-5 shadow-sm">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="lc-name">Nombre completo *</Label>
                <Input id="lc-name" required value={form.name} onChange={set("name")} placeholder="Juan García" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lc-company">Empresa / Conjunto</Label>
                <Input id="lc-company" value={form.company} onChange={set("company")} placeholder="Torres del Norte" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="lc-phone">Teléfono / WhatsApp *</Label>
                <Input id="lc-phone" required type="tel" value={form.phone} onChange={set("phone")} placeholder="+57 300 123 4567" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lc-email">Correo electrónico</Label>
                <Input id="lc-email" type="email" value={form.email} onChange={set("email")} placeholder="juan@empresa.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lc-message">Mensaje / Necesidades</Label>
              <Textarea id="lc-message" rows={4} value={form.message} onChange={set("message")} placeholder="Cuéntenos sobre su proyecto o necesidad de mantenimiento..." />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full font-semibold py-3 px-6 rounded-xl text-base transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--lp-btn-bg, hsl(var(--primary)))", color: "var(--lp-btn-text, #fff)" }}
            >
              {sending ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function LandingPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-16 bg-white border-b" />
      <div className="bg-primary h-80 animate-pulse" />
      <div className="container mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-3/4 max-w-xl" />
      </div>
    </div>
  );
}

function LandingNotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
        <h1 className="text-3xl font-bold text-primary mb-4">Página no encontrada</h1>
        <p className="text-muted-foreground mb-8">Esta landing page no existe o aún no está publicada.</p>
        <Button asChild><Link href="/">Volver al inicio</Link></Button>
      </main>
      <Footer />
    </div>
  );
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    conjuntos_residenciales: "Conjuntos Residenciales",
    colegios: "Colegios e Instituciones",
    edificios: "Edificios y Oficinas",
    centros_comerciales: "Centros Comerciales",
    empresas: "Empresas",
    clinicas: "Clínicas y Hospitales",
  };
  return map[cat] ?? cat;
}
