import { motion } from "framer-motion";
import { Building, GraduationCap, Briefcase, ShoppingBag } from "lucide-react";
import SectionHeading from "./section-heading";

export default function ClientTypes() {
  const segments = [
    {
      id: "conjuntos",
      title: "Conjuntos Residenciales",
      icon: <Building className="w-8 h-8" />,
      description: "Valorizamos su copropiedad garantizando áreas comunes impecables que mejoran la calidad de vida de los residentes.",
      benefits: [
        "Cronogramas adaptados a asambleas",
        "Manejo seguro de productos químicos",
        "Personal uniformado y carnetizado",
        "Atención de emergencias 24/7"
      ]
    },
    {
      id: "colegios",
      title: "Colegios e Instituciones",
      icon: <GraduationCap className="w-8 h-8" />,
      description: "Creamos y mantenemos entornos seguros que fomentan el aprendizaje al aire libre y el contacto con la naturaleza.",
      benefits: [
        "Zonas de juego seguras",
        "Mantenimiento en horarios no escolares",
        "Especies no tóxicas",
        "Campos deportivos de alto tráfico"
      ]
    },
    {
      id: "edificios",
      title: "Edificios de Oficinas",
      icon: <Briefcase className="w-8 h-8" />,
      description: "Proyectamos una imagen corporativa sólida desde la entrada con jardines exteriores y terrazas empresariales impecables.",
      benefits: [
        "Jardinería de interiores",
        "Mantenimiento de cubiertas verdes",
        "Riego automatizado",
        "Sistemas de bajo mantenimiento"
      ]
    },
    {
      id: "centros",
      title: "Centros Comerciales",
      icon: <ShoppingBag className="w-8 h-8" />,
      description: "Espacios atractivos que invitan a la permanencia de los visitantes y complementan la experiencia de compra.",
      benefits: [
        "Impacto visual de alto nivel",
        "Jardines verticales",
        "Renovación floral por temporadas",
        "Operación sin interrumpir el flujo"
      ]
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <SectionHeading 
            title="Entendemos Su Negocio"
            subtitle="Especialistas por Sector"
            alignment="center"
          />
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            No somos una empresa de jardinería genérica. Adaptamos nuestros protocolos a las exigencias operativas y de seguridad específicas de su sector.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  {segment.icon}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-3">{segment.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {segment.description}
                </p>
                <ul className="space-y-2">
                  {segment.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
