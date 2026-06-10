import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = "https://wa.me/573001234567?text=" + encodeURIComponent("Hola, me interesa una cotización para mantenimiento de zonas verdes");

  return (
    <footer className="bg-primary text-primary-foreground border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-bold text-white">
                Verde<span className="text-secondary">Corporativo</span>
              </span>
            </Link>
            <p className="text-white/80 text-sm leading-relaxed mt-4 pr-4">
              Especialistas en paisajismo y mantenimiento de zonas verdes para el sector B2B en Bogotá y la Sabana. Confianza, puntualidad y resultados.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white border-b border-white/10 pb-2 inline-block">Áreas de Cobertura</h4>
            <ul className="grid grid-cols-2 gap-2 text-white/80 text-sm">
              <li>Bogotá D.C.</li>
              <li>Chía</li>
              <li>Cajicá</li>
              <li>Sopó</li>
              <li>La Calera</li>
              <li>Cota</li>
              <li>Funza</li>
              <li>Mosquera</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white border-b border-white/10 pb-2 inline-block">Navegación</h4>
            <ul className="space-y-3 text-white/80 text-sm">
              <li><a href="#servicios" className="hover:text-secondary transition-colors">Nuestros Servicios</a></li>
              <li><a href="#portafolio" className="hover:text-secondary transition-colors">Portafolio Destacado</a></li>
              <li><a href="#nosotros" className="hover:text-secondary transition-colors">Sobre Nosotros</a></li>
              <li><a href="#cotizacion" className="hover:text-secondary transition-colors">Solicitar Cotización</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white border-b border-white/10 pb-2 inline-block">Contacto</h4>
            <ul className="space-y-4 text-white/80 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary flex-shrink-0" />
                <span>Av. Suba #100-20, Bogotá, Colombia</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary flex-shrink-0" />
                <span>+57 300 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary flex-shrink-0" />
                <span>comercial@verdecorporativo.com.co</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-secondary flex-shrink-0" />
                <span>Lunes a Sábado, 7am - 5pm</span>
              </li>
            </ul>
            <a 
              href={whatsappUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              Atención vía WhatsApp
            </a>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {currentYear} Sarria Company Paisajismo SAS. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
