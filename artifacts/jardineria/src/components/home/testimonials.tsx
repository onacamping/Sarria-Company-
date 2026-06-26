import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import SectionHeading from "./section-heading";

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  location: string;
}

const FALLBACK: Testimonial[] = [
  {
    id: 1,
    quote: "Desde que asumieron el mantenimiento del conjunto, las zonas comunes se han transformado. Son puntuales, el personal es muy respetuoso y el césped nunca había estado tan verde. Totalmente recomendados para copropiedades.",
    author: "Carlos Mendoza",
    role: "Administrador de Conjunto Residencial",
    location: "Chía",
  },
  {
    id: 2,
    quote: "Necesitábamos recuperar las canchas y los jardines antes de iniciar el año escolar. Cumplieron con el cronograma de manera impecable y nos asesoraron en especies seguras para los niños. Excelente servicio.",
    author: "Dra. Patricia Ramírez",
    role: "Rectora de Colegio",
    location: "Bogotá, Norte",
  },
  {
    id: 3,
    quote: "El diseño y mantenimiento de las terrazas verdes de nuestro edificio corporativo ha mejorado la imagen ante nuestros clientes. Es un equipo profesional que no requiere supervisión constante, saben lo que hacen.",
    author: "Andrés Silva",
    role: "Gerente de Operaciones",
    location: "Centro Empresarial Calle 100",
  },
];

const base = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK);

  useEffect(() => {
    fetch(`${base()}/api/testimonials`)
      .then((r) => r.json())
      .then((data: Testimonial[]) => {
        if (Array.isArray(data) && data.length > 0) setTestimonials(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading
          title="Lo Que Dicen Nuestros Clientes"
          subtitle="Garantía de Satisfacción"
          alignment="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-muted/30 p-8 rounded-2xl relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-secondary fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-foreground/80 italic mb-8 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div>
                <h4 className="font-bold text-foreground">{testimonial.author}</h4>
                <p className="text-sm text-primary font-medium">{testimonial.role}</p>
                <p className="text-xs text-muted-foreground mt-1">{testimonial.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
