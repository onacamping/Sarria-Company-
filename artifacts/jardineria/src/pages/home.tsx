import { Helmet } from "react-helmet-async";
import Navbar from "@/components/home/navbar";
import Hero from "@/components/home/hero";
import Stats from "@/components/home/stats";
import Services from "@/components/home/services";
import ClientTypes from "@/components/home/client-types";
import Portfolio from "@/components/home/portfolio";
import About from "@/components/home/about";
import Testimonials from "@/components/home/testimonials";
import QuoteForm from "@/components/home/quote-form";
import Footer from "@/components/home/footer";
import WhatsAppButton from "@/components/ui/whatsapp-button";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Jardinería Bogotá",
    "image": "https://example.com/logo.png",
    "description": "Empresa familiar de mantenimiento y diseño de jardines en Bogotá y Sabana. Atendemos conjuntos residenciales, colegios, edificios y centros comerciales.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Calle 100",
      "addressLocality": "Bogotá",
      "addressRegion": "Cundinamarca",
      "addressCountry": "CO"
    },
    "telephone": "+573001234567"
  };

  return (
    <>
      <Helmet>
        <title>Jardinería y Mantenimiento de Zonas Verdes en Bogotá | Conjuntos, Colegios y Edificios</title>
        <meta name="description" content="Empresa familiar de mantenimiento y diseño de jardines en Bogotá y Sabana. Atendemos conjuntos residenciales, colegios, edificios y centros comerciales. Solicita tu cotización gratis." />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <Stats />
          <Services />
          <ClientTypes />
          <Portfolio />
          <About />
          <Testimonials />
          <QuoteForm />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
}
