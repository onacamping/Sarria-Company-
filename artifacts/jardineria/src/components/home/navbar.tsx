import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/site-settings";
import { getLandingPages, type LandingPage } from "@/lib/landing-api";
import logo from "@/assets/logo-sarria-transparent.png";

export default function Navbar() {
  const settings = useSettings();
  const ctaText = settings["cta_nav_text"] ?? "Solicitar Cotización";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [clientesOpen, setClientesOpen] = useState(false);
  const [mobilClientesOpen, setMobileClientesOpen] = useState(false);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();

  useEffect(() => {
    getLandingPages().then(setLandingPages).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClientesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Servicios", href: "/#servicios" },
    { name: "Portafolio", href: "/#portafolio" },
    { name: "Tienda", href: "/tienda" },
    { name: "Nosotros", href: "/#nosotros" },
  ];

  const textColor = isScrolled ? "text-foreground" : "text-white/90";
  const hoverColor = "hover:text-secondary";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-sm py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src={logo}
              alt="Sarria Company"
              style={{ height: "var(--logo-size, 64px)" }}
              className={`w-auto transition-all duration-300 ${isScrolled ? "" : "brightness-0 invert"}`}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${hoverColor} ${textColor}`}
              >
                {link.name}
              </a>
            ))}

            {/* Clientes dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setClientesOpen((v) => !v)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${hoverColor} ${textColor}`}
              >
                <Users className="w-4 h-4" />
                Clientes
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${clientesOpen ? "rotate-180" : ""}`} />
              </button>

              {clientesOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-xl py-2 z-50">
                  {landingPages.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-4 py-2">No hay landing pages publicadas aún.</p>
                  ) : (
                    landingPages.map((lp) => (
                      <Link
                        key={lp.slug}
                        href={`/clientes/${lp.slug}`}
                        onClick={() => setClientesOpen(false)}
                        className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
                      >
                        {lp.title}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            <Button
              asChild
              variant={isScrolled ? "default" : "secondary"}
              className="font-medium"
            >
              <a href="/#cotizacion">{ctaText}</a>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className={isScrolled ? "text-primary" : "text-white"} />
            ) : (
              <Menu className={isScrolled ? "text-primary" : "text-white"} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border shadow-lg p-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-base font-medium text-foreground py-2 border-b border-border/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}

          {/* Mobile Clientes */}
          <div>
            <button
              type="button"
              className="w-full flex items-center justify-between text-base font-medium text-foreground py-2 border-b border-border/50"
              onClick={() => setMobileClientesOpen((v) => !v)}
            >
              <span className="flex items-center gap-2"><Users className="w-4 h-4" />Clientes</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobilClientesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobilClientesOpen && (
              <div className="pl-4 mt-2 flex flex-col gap-1">
                {landingPages.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">No hay páginas publicadas.</p>
                ) : (
                  landingPages.map((lp) => (
                    <Link
                      key={lp.slug}
                      href={`/clientes/${lp.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm text-muted-foreground hover:text-primary py-1.5"
                    >
                      {lp.title}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <Button asChild className="w-full mt-2">
            <a href="/#cotizacion" onClick={() => setIsMobileMenuOpen(false)}>
              {ctaText}
            </a>
          </Button>
        </div>
      )}
    </header>
  );
}
