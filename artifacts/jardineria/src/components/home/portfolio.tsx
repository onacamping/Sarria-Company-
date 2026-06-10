import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListProjects, useGetProject } from "@workspace/api-client-react";
import SectionHeading from "./section-heading";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Calendar, Maximize, Tag } from "lucide-react";

type Category = "todos" | "conjuntos_residenciales" | "colegios" | "edificios" | "centros_comerciales";

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState<Category>("todos");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: projects, isLoading } = useListProjects(
    activeCategory !== "todos" ? { category: activeCategory as any } : {}
  );

  const { data: selectedProject, isLoading: isLoadingProject } = useGetProject(
    selectedProjectId || 0,
    { query: { enabled: selectedProjectId !== null, queryKey: ['getProject', selectedProjectId] } }
  );

  const categories = [
    { id: "todos", label: "Todos" },
    { id: "conjuntos_residenciales", label: "Conjuntos" },
    { id: "colegios", label: "Colegios" },
    { id: "edificios", label: "Edificios" },
    { id: "centros_comerciales", label: "Centros Comerciales" },
  ];

  return (
    <section id="portafolio" className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <SectionHeading 
            title="Nuestro Trabajo Habla por Sí Solo"
            subtitle="Portafolio Destacado"
            light
          />
          <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white hover:text-primary">
            <a href="#cotizacion">Solicitar evaluación para su proyecto</a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as Category)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id 
                  ? "bg-secondary text-secondary-foreground shadow-md" 
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl bg-white/10" />
              ))}
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {projects?.map((project) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    key={project.id}
                    className="group relative overflow-hidden rounded-xl bg-white/5 cursor-pointer h-72"
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <img 
                      src={project.imageUrl || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"} 
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                      <p className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-secondary" />
                        {project.location}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={selectedProjectId !== null} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white text-foreground">
          {isLoadingProject ? (
            <div className="p-8">
              <Skeleton className="h-64 w-full rounded-lg mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : selectedProject ? (
            <>
              <div className="relative h-72 w-full">
                <img 
                  src={selectedProject.imageUrl || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200"} 
                  alt={selectedProject.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif font-bold text-primary mb-2">
                    {selectedProject.title}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-secondary" />
                    {selectedProject.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-secondary" />
                    {selectedProject.year}
                  </span>
                  {selectedProject.areaSqm && (
                    <span className="flex items-center gap-1.5">
                      <Maximize className="w-4 h-4 text-secondary" />
                      {selectedProject.areaSqm.toLocaleString()} m²
                    </span>
                  )}
                </div>

                <DialogDescription className="text-base text-foreground/80 leading-relaxed mb-8">
                  {selectedProject.description}
                </DialogDescription>

                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {selectedProject.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button onClick={() => {
                    setSelectedProjectId(null);
                    document.getElementById('cotizacion')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Quiero un proyecto similar
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
