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
import { useSettings } from "@/lib/site-settings";
import ContentBlocksRenderer from "@/components/content-blocks-renderer";
import type { Block } from "@/components/admin/block-editor";

function parseHomeBlocks(raw: string | undefined): Block[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const settings = useSettings();
  const showPortfolio = (settings["show_portfolio_section"] ?? "true") !== "false";
  const showQuoteForm = (settings["show_quote_form"] ?? "true") !== "false";
  const homeBlocks = parseHomeBlocks(settings["home_blocks"]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Sarria Company",
    "legalName": "Sarria Company Paisajismo SAS",
    "image": "https://sarriacompany.com/logo.png",
    "description": "Sarria Company es una empresa especializada en jardinería, paisajismo y mantenimiento integral de zonas verdes con más de 13 años de experiencia. Atendemos conjuntos residenciales, colegios, edificios, clínicas y centros comerciales en Bogotá y la Sabana.",
    "url": "https://sarriacompany.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bogotá",
      "addressRegion": "Cundinamarca",
      "addressCountry": "CO"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 4.7110,
      "longitude": -74.0721
    },
    "areaServed": ["Bogotá", "Chía", "Cajicá", "Sopó", "La Calera", "Cota", "Tenjo", "Funza", "Mosquera"],
    "serviceType": ["Jardinería", "Paisajismo", "Mantenimiento de zonas verdes", "Sistemas de riego", "Servicios forestales"],
    "foundingDate": "2008",
    "numberOfEmployees": "10-50",
    "priceRange": "$$"
  };

  return (
    <>
      <Helmet>
        <title>Sarria Company | Jardinería y Paisajismo en Bogotá y La Sabana</title>
        <meta
          name="description"
          content="Sarria Company — más de 13 años de experiencia en jardinería, paisajismo y mantenimiento de zonas verdes en Bogotá y La Sabana. Atendemos conjuntos residenciales, colegios, edificios y centros comerciales. +60 clientes activos. Cotización gratis."
        />
        <meta
          name="keywords"
          content="jardinería Bogotá, paisajismo Bogotá, mantenimiento zonas verdes, jardinería conjuntos residenciales, jardinería colegios, sistemas de riego Bogotá, Sarria Company"
        />
        <meta property="og:title" content="Sarria Company | Jardinería y Paisajismo en Bogotá" />
        <meta
          property="og:description"
          content="Más de 13 años de experiencia. Atendemos conjuntos, colegios, edificios y centros comerciales en Bogotá y La Sabana."
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <ContentBlocksRenderer blocks={homeBlocks} />
          <Stats />
          <Services />
          <ClientTypes />
          {showPortfolio && <Portfolio />}
          <About />
          <Testimonials />
          {showQuoteForm && <QuoteForm />}
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
}
