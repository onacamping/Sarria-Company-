import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const message = encodeURIComponent("Hola, me interesa una cotización para mantenimiento de zonas verdes");
  const url = `https://wa.me/573001234567?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={28} />
    </a>
  );
}
