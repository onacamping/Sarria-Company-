import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Leaf, Trees, Sprout, Scissors, Bug, Lightbulb,
  Droplets, Wind, Sun, Flower, Mountain, Layers
} from "lucide-react";
import SectionHeading from "./section-heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

interface Service {
  id: number;
  title: string;
  description: string;
  icon_name: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Leaf: <Leaf className="w-10 h-10 text-primary" />,
  Trees: <Trees className="w-10 h-10 text-primary" />,
  Sprout: <Sprout className="w-10 h-10 text-primary" />,
  Scissors: <Scissors className="w-10 h-10 text-primary" />,
  Bug: <Bug className="w-10 h-10 text-primary" />,
  Lightbulb: <Lightbulb className="w-10 h-10 text-primary" />,
  Droplets: <Droplets className="w-10 h-10 text-primary" />,
  Wind: <Wind className="w-10 h-10 text-primary" />,
  Sun: <Sun className="w-10 h-10 text-primary" />,
  Flower: <Flower className="w-10 h-10 text-primary" />,
  Mountain: <Mountain className="w-10 h-10 text-primary" />,
  Layers: <Layers className="w-10 h-10 text-primary" />,
};

const FALLBACK: Service[] = [
  { id: 1, title: "Mantenimiento de Zonas Verdes", description: "Rutinas preventivas y correctivas diseñadas para mantener el vigor y la estética de sus jardines en cualquier temporada del año.", icon_name: "Leaf" },
  { id: 2, title: "Diseño Paisajístico", description: "Planeación integral de espacios verdes que valorizan su propiedad, seleccionando especies adaptadas a la altitud de la Sabana de Bogotá.", icon_name: "Trees" },
  { id: 3, title: "Instalación de Jardines", description: "Suministro y siembra profesional de césped, plantas ornamentales y árboles con los más altos estándares agronómicos.", icon_name: "Sprout" },
  { id: 4, title: "Poda y Tala", description: "Manejo técnico de especies arbóreas, podas de formación, realce y talas autorizadas con estricto cumplimiento normativo.", icon_name: "Scissors" },
  { id: 5, title: "Fumigación y Control", description: "Manejo integrado de plagas y enfermedades usando productos amigables con el medio ambiente y seguros para residentes.", icon_name: "Bug" },
  { id: 6, title: "Consultoría Verde", description: "Asesoría especializada para administradores y juntas de consejo en presupuesto, normatividad ambiental y viabilidad de proyectos.", icon_name: "Lightbulb" },
];

const base = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export default function Services() {
  const [services, setServices] = useState<Service[]>(FALLBACK);

  useEffect(() => {
    fetch(`${base()}/api/services`)
      .then((r) => r.json())
      .then((data: Service[]) => {
        if (Array.isArray(data) && data.length > 0) setServices(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="servicios" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading
          title="Nuestros Servicios"
          subtitle="Soluciones Integrales para Propiedad Horizontal y Corporativa"
          alignment="center"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
                <CardHeader>
                  <div className="mb-4 p-3 bg-primary/5 inline-flex rounded-lg w-fit">
                    {ICON_MAP[service.icon_name] ?? ICON_MAP["Leaf"]}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
