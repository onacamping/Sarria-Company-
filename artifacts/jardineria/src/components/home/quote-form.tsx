import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitQuote } from "@workspace/api-client-react";
import { QuoteInputClientType, QuoteInputService } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import SectionHeading from "./section-heading";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, MessageCircle, AlertCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  company: z.string().min(2, "La empresa o entidad es requerida"),
  clientType: z.enum([
    QuoteInputClientType.conjunto_residencial,
    QuoteInputClientType.colegio,
    QuoteInputClientType.edificio,
    QuoteInputClientType.centro_comercial,
    QuoteInputClientType.otro
  ]),
  phone: z.string().min(7, "Teléfono válido requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  service: z.enum([
    QuoteInputService.mantenimiento,
    QuoteInputService.diseno,
    QuoteInputService.instalacion,
    QuoteInputService.poda,
    QuoteInputService.fumigacion,
    QuoteInputService.otro
  ]),
  location: z.string().optional(),
  area: z.string().optional(),
  message: z.string().min(10, "Por favor proporcione más detalles de su requerimiento"),
});

export default function QuoteForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const submitQuote = useSubmitQuote();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      clientType: QuoteInputClientType.conjunto_residencial,
      phone: "",
      email: "",
      service: QuoteInputService.mantenimiento,
      location: "",
      area: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitQuote.mutate(
      { data: values },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: (error) => {
          console.error("Error submitting quote:", error);
          // Assuming there's a toast hook available globally, but handling locally for safety
        }
      }
    );
  }

  const whatsappMessage = encodeURIComponent(
    `Hola, acabo de enviar una solicitud de cotización por la página web a nombre de ${form.getValues('name')} de ${form.getValues('company')}.`
  );
  const whatsappUrl = `https://wa.me/573001234567?text=${whatsappMessage}`;

  return (
    <section id="cotizacion" className="py-24 bg-primary text-primary-foreground relative">
      <div className="absolute inset-0 bg-black/20" /> {/* Subtle darkening */}
      
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-foreground">
          
          <div className="md:w-5/12 bg-muted/30 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border">
            <SectionHeading 
              title="Solicite una Cotización"
              subtitle="Atención B2B Inmediata"
            />
            <div className="mt-8 space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Entendemos que su tiempo es valioso. Complete el formulario y un especialista comercial se pondrá en contacto en menos de 24 horas para programar una visita técnica sin costo.
              </p>
              
              <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm mt-8">
                <h4 className="font-bold text-lg mb-4 text-primary">¿Qué incluye nuestra visita técnica?</h4>
                <ul className="space-y-3">
                  {[
                    "Levantamiento topográfico básico del área",
                    "Diagnóstico fitosanitario de especies existentes",
                    "Propuesta de cronograma de mantenimiento",
                    "Cotización formal desglosada"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="md:w-7/12 p-8 md:p-12">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12"
              >
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold mb-2 text-primary">¡Solicitud Enviada!</h3>
                  <p className="text-muted-foreground">
                    Hemos recibido su información. Nuestro equipo comercial lo contactará a la mayor brevedad.
                  </p>
                </div>
                
                <div className="pt-6 w-full">
                  <p className="text-sm text-muted-foreground mb-4">¿Desea acelerar el proceso?</p>
                  <Button size="lg" className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white" asChild>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 w-5 h-5" />
                      Notificar por WhatsApp
                    </a>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {submitQuote.isError && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">Hubo un error al enviar la solicitud. Por favor intente nuevamente o contáctenos por WhatsApp.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Nombre de contacto *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Juan Pérez" {...field} className="bg-muted/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Empresa / Conjunto *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Edificio Torre 100" {...field} className="bg-muted/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Tipo de Cliente *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/20">
                                <SelectValue placeholder="Seleccione un tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={QuoteInputClientType.conjunto_residencial}>Conjunto Residencial</SelectItem>
                              <SelectItem value={QuoteInputClientType.colegio}>Colegio / Institución</SelectItem>
                              <SelectItem value={QuoteInputClientType.edificio}>Edificio Corporativo</SelectItem>
                              <SelectItem value={QuoteInputClientType.centro_comercial}>Centro Comercial</SelectItem>
                              <SelectItem value={QuoteInputClientType.otro}>Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Servicio Principal *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/20">
                                <SelectValue placeholder="Seleccione servicio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={QuoteInputService.mantenimiento}>Mantenimiento Integral</SelectItem>
                              <SelectItem value={QuoteInputService.diseno}>Diseño Paisajístico</SelectItem>
                              <SelectItem value={QuoteInputService.instalacion}>Instalación de Jardines</SelectItem>
                              <SelectItem value={QuoteInputService.poda}>Poda y Tala Autorizada</SelectItem>
                              <SelectItem value={QuoteInputService.fumigacion}>Fumigación / Control Plagas</SelectItem>
                              <SelectItem value={QuoteInputService.otro}>Consultoría u Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Teléfono / Celular *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. 300 123 4567" {...field} className="bg-muted/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Correo Electrónico</FormLabel>
                          <FormControl>
                            <Input placeholder="opcional@empresa.com" {...field} className="bg-muted/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Ubicación / Barrio</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. Cedritos, Chía" {...field} value={field.value || ""} className="bg-muted/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Área Aprox (m²)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej. 500" {...field} value={field.value || ""} className="bg-muted/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">Detalles del Requerimiento *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describa brevemente el estado actual de las zonas verdes y sus necesidades..." 
                            className="resize-none h-24 bg-muted/20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold" 
                    disabled={submitQuote.isPending}
                  >
                    {submitQuote.isPending ? "Enviando solicitud..." : "Solicitar Cotización Gratuita"}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
