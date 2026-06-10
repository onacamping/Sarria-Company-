import { motion } from "framer-motion";
import SectionHeading from "./section-heading";
import { CheckCircle2 } from "lucide-react";
import aboutImg from "@/assets/about-team.jpg";

export default function About() {
  const trustSignals = [
    "Más de 15 años de experiencia comprobada",
    "Conocimiento experto del clima y suelo sabanero",
    "Personal contratado directamente, sin intermediarios",
    "Cumplimiento estricto de normas SST y ambientales",
    "Seguros de responsabilidad civil vigentes",
    "Equipos y maquinaria propia de última tecnología"
  ];

  return (
    <section id="nosotros" className="py-24 bg-muted/10 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <SectionHeading 
                title="Raíces Profundas, Compromiso Firme"
                subtitle="Nuestra Historia"
              />
              
              <div className="mt-8 space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  No somos una franquicia. VerdeCorporativo nació como un negocio familiar con una convicción simple: los espacios verdes de Bogotá y la Sabana merecen un cuidado que entienda la tierra, no solo que la corte.
                </p>
                <p>
                  A lo largo de los años, hemos crecido de mantener pequeños jardines residenciales a gestionar las zonas verdes de los conjuntos, colegios y edificios más prestigiosos de la capital. Nuestra reputación se ha construido sobre la puntualidad, la honestidad y resultados visibles.
                </p>
                <p className="font-medium text-foreground">
                  Cuando usted nos contrata, no solo contrata jardineros. Contrata la tranquilidad de saber que profesionales certificados se encargarán del activo natural de su propiedad.
                </p>
              </div>

              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                {trustSignals.map((signal, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0" />
                    <span className="text-sm font-semibold text-foreground">{signal}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="aspect-[4/3] w-full">
                <img 
                  src={aboutImg} 
                  alt="Equipo de jardinería profesional trabajando"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&q=80&w=1200";
                  }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white p-6 backdrop-blur-sm">
                <div className="font-serif text-2xl font-bold mb-1">Empresa Familiar</div>
                <div className="text-white/80 font-medium">Atendiendo Bogotá y la Sabana desde 2008</div>
              </div>
            </motion.div>
            
            {/* Decorative element */}
            <div className="absolute -z-10 -bottom-8 -right-8 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
          </div>
          
        </div>
      </div>
    </section>
  );
}
