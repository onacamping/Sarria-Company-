import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/site-settings";
import heroBg from "@/assets/hero-bg.jpg";

export default function Hero() {
  const settings = useSettings();
  const phone = settings["whatsapp_number"] ?? "573001234567";
  const whatsappUrl =
    "https://wa.me/" +
    phone.replace(/\D/g, "") +
    "?text=" +
    encodeURIComponent("Hola, me interesa una cotización para mantenimiento de zonas verdes");
  const heroImage = settings["hero_image_url"] ?? heroBg;
  const heroTitle = settings["hero_title"] ?? "Jardinería Profesional en Bogotá y La Sabana";
  const heroSubtitle =
    settings["hero_subtitle"] ??
    "Diseño y mantenimiento de zonas verdes para conjuntos residenciales, colegios, edificios y centros comerciales. Confiables, puntuales y expertos en el clima de la Sabana.";
  const heroBadge = settings["hero_badge"] ?? "Empresa Familiar en Bogotá y La Sabana";
  const ctaPrimaryText = settings["cta_hero_primary_text"] ?? "Solicitar cotización gratuita";
  const ctaWhatsappText = settings["cta_hero_whatsapp_text"] ?? "Escríbanos por WhatsApp";

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-primary/80 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent z-10" />
        <img
          src={heroImage}
          alt="Mantenimiento de zonas verdes en Bogotá"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1558904541-efa843a96f09?auto=format&fit=crop&q=80&w=2000";
          }}
        />
      </div>

      <div className="container relative z-20 px-4 md:px-6 mx-auto">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl leading-relaxed">
              {heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base h-14 px-8" asChild>
                <a href="#cotizacion">{ctaPrimaryText}</a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base h-14 px-8 bg-white/10 text-white hover:bg-white hover:text-primary border-white/30"
                asChild
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {ctaWhatsappText}
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
