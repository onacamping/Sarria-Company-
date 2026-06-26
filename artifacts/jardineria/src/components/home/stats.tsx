import { motion } from "framer-motion";
import { useGetProjectStats } from "@workspace/api-client-react";
import { Building2, Users, AreaChart, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stats() {
  const { data: stats, isLoading } = useGetProjectStats();

  const statItems = [
    {
      label: "Años de Experiencia",
      value: stats?.yearsExperience ? `+${stats.yearsExperience}` : "+13",
      icon: <CalendarDays className="w-8 h-8 mb-4 text-secondary" />,
    },
    {
      label: "Clientes Activos",
      value: stats?.totalClients ? `+${stats.totalClients}` : "+60",
      icon: <Users className="w-8 h-8 mb-4 text-secondary" />,
    },
    {
      label: "Proyectos Realizados",
      value: stats?.totalProjects ? `+${stats.totalProjects}` : "+500",
      icon: <Building2 className="w-8 h-8 mb-4 text-secondary" />,
    },
    {
      label: "Metros Cuadrados Atendidos",
      value: stats?.totalAreaSqm
        ? `${(stats.totalAreaSqm / 1000).toFixed(0)}K m²`
        : "+50K m²",
      icon: <AreaChart className="w-8 h-8 mb-4 text-secondary" />,
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-border">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-4">
                <Skeleton className="w-12 h-12 rounded-full mb-4" />
                <Skeleton className="h-10 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : (
            statItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-4"
              >
                {item.icon}
                <h3 className="text-4xl font-serif font-bold text-foreground mb-2">
                  {item.value}
                </h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  {item.label}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
