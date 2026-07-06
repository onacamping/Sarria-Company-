import { useCallback, useState } from "react";
import { adminLogout, clearToken } from "@/lib/admin-api";
import { Settings, FolderOpen, ShoppingBag, MessageSquare, Star, LogOut, Menu, Leaf, ShieldCheck, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-sarria-transparent.png";
import SettingsPanel from "./settings-panel";
import ProjectsPanel from "./projects-panel";
import ProductsPanel from "./products-panel";
import QuotesPanel from "./quotes-panel";
import TestimonialsPanel from "./testimonials-panel";
import ServicesPanel from "./services-panel";
import CertificatesPanel from "./certificates-panel";
import StyleEditorPanel from "./style-editor-panel";

type Section =
  | "settings"
  | "style"
  | "services"
  | "projects"
  | "products"
  | "quotes"
  | "testimonials"
  | "certificates";

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "settings", label: "Configuración", icon: Settings },
  { id: "style", label: "Editor Visual", icon: Palette },
  { id: "services", label: "Servicios", icon: Leaf },
  { id: "projects", label: "Portafolio", icon: FolderOpen },
  { id: "products", label: "Tienda", icon: ShoppingBag },
  { id: "quotes", label: "Cotizaciones", icon: MessageSquare },
  { id: "testimonials", label: "Testimonios", icon: Star },
  { id: "certificates", label: "Certificados", icon: ShieldCheck },
];

interface Props {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: Props) {
  const [active, setActive] = useState<Section>("settings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [styleDirty, setStyleDirty] = useState(false);

  const goToSection = useCallback(
    (id: Section) => {
      if (active === "style" && styleDirty && id !== "style") {
        const ok = window.confirm(
          "Tienes cambios de estilo sin guardar. Si sales de esta pestaña se perderán. ¿Deseas continuar sin guardar?"
        );
        if (!ok) return;
      }
      setActive(id);
      setSidebarOpen(false);
    },
    [active, styleDirty]
  );

  async function handleLogout() {
    if (active === "style" && styleDirty) {
      const ok = window.confirm(
        "Tienes cambios de estilo sin guardar. Si cierras sesión se perderán. ¿Deseas continuar sin guardar?"
      );
      if (!ok) return;
    }
    try { await adminLogout(); } catch {}
    clearToken();
    onLogout();
  }

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img src={logo} alt="Sarria Company" className="h-8 w-auto" />
          <div>
            <div className="text-xs font-bold text-primary leading-tight">Sarria Company</div>
            <div className="text-xs text-muted-foreground">Panel Admin</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => goToSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  active === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  const panelMap: Record<Section, React.ReactNode> = {
    settings: <SettingsPanel />,
    style: <StyleEditorPanel onDirtyChange={setStyleDirty} />,
    services: <ServicesPanel />,
    projects: <ProjectsPanel />,
    products: <ProductsPanel />,
    quotes: <QuotesPanel />,
    testimonials: <TestimonialsPanel />,
    certificates: <CertificatesPanel />,
  };

  const activeLabel = navItems.find((n) => n.id === active)?.label ?? "";

  return (
    <div className="min-h-screen bg-muted/10 flex">
      <aside className="hidden md:flex w-56 bg-white border-r border-border flex-col fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-56 bg-white border-r border-border flex flex-col shadow-xl">
            <SidebarContent />
          </div>
          <button className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú" />
        </div>
      )}

      <main className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <div className="md:hidden flex items-center gap-3 p-4 bg-white border-b border-border sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-sm">{activeLabel}</span>
        </div>
        <div className="p-4 md:p-8 flex-1">{panelMap[active]}</div>
      </main>
    </div>
  );
}
