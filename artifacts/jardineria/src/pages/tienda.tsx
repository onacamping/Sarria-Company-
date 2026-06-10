import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ShoppingBag, ArrowLeft, Star, Package, ChevronRight } from "lucide-react";
import { useListProducts, useGetProduct } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/home/navbar";

const WHATSAPP_NUMBER = "573001234567";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "plantas", label: "Plantas" },
  { value: "macetas", label: "Macetas" },
  { value: "tierra", label: "Tierra y Sustratos" },
  { value: "herramientas", label: "Herramientas" },
  { value: "fertilizantes", label: "Fertilizantes" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function Watermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <span
        className="text-white/25 font-serif font-bold text-xl tracking-widest uppercase rotate-[-35deg] whitespace-nowrap"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
      >
        VerdeCorporativo
      </span>
    </div>
  );
}

function ProductCard({
  product,
  onClick,
}: {
  product: { id: number; name: string; description: string; price: number; category: string; imageUrl: string; unit: string; inStock: boolean; featured: boolean };
  onClick: () => void;
}) {
  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa el producto: ${product.name} (${formatPrice(product.price)}/${product.unit}). ¿Tienen disponibilidad?`
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border/40 flex flex-col group"
    >
      {/* Image with watermark */}
      <div
        className="relative h-52 bg-muted cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <Watermark />
        {product.featured && (
          <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" /> Destacado
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm uppercase tracking-wide bg-black/60 px-3 py-1 rounded">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
          {CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category}
        </span>
        <h3
          className="font-serif font-bold text-lg text-foreground mb-2 cursor-pointer hover:text-primary transition-colors leading-snug"
          onClick={onClick}
        >
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-end justify-between mt-auto gap-2">
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-bold text-primary font-serif">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-muted-foreground ml-1 whitespace-nowrap">/ {product.unit}</span>
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              product.inStock
                ? "bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Pedir
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function ProductDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: product, isLoading } = useGetProduct(id);

  if (isLoading || !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa el producto: ${product.name} (${formatPrice(product.price)}/${product.unit}). ¿Tienen disponibilidad?`
  );

  return (
    <div className="flex flex-col md:flex-row gap-0">
      <div className="relative md:w-1/2 h-48 md:h-auto bg-muted overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none flex-shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <Watermark />
        {product.featured && (
          <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" /> Destacado
          </span>
        )}
      </div>

      <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
        <div>
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">
            {CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category}
          </span>
          <DialogTitle className="font-serif font-bold text-2xl text-foreground mb-3 leading-tight">
            {product.name}
          </DialogTitle>
          <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center gap-3 mb-6 p-4 bg-muted/40 rounded-xl">
            <Package className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Unidad de venta</p>
              <p className="font-semibold text-foreground">{product.unit}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Precio</p>
              <p className="text-2xl font-bold text-primary font-serif">{formatPrice(product.price)}</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            <span className={`w-2 h-2 rounded-full ${product.inStock ? "bg-green-500" : "bg-red-500"}`} />
            {product.inStock ? "Disponible" : "Agotado temporalmente"}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 inline-flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-colors ${
              product.inStock
                ? "bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Solicitar por WhatsApp
          </a>
          <button
            onClick={onClose}
            className="sm:w-auto px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tienda() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data: products = [], isLoading } = useListProducts(
    selectedCategory ? { category: selectedCategory } : {}
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-primary pt-32 md:pt-36 pb-10 md:pb-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #fff 0%, transparent 60%)" }}
        />
        <div className="container mx-auto px-4 md:px-6 relative">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 md:mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-secondary flex-shrink-0" />
            <h1 className="font-serif font-bold text-2xl md:text-3xl lg:text-4xl text-white leading-tight">
              Tienda de Materiales
            </h1>
          </div>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            Plantas, macetas, tierra y herramientas para proyectos de jardinería profesional. Pedidos por WhatsApp con entrega en Bogotá y la Sabana.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="relative">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide px-4 md:px-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* Fade hint for scroll on mobile */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent md:hidden" />
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 md:px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No hay productos en esta categoría.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProductId(product.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Banner CTA */}
      <div className="bg-muted/60 border-t border-border">
        <div className="container mx-auto px-4 md:px-6 py-12 text-center">
          <h2 className="font-serif font-bold text-2xl text-foreground mb-3">
            ¿Necesita materiales para un proyecto grande?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Ofrecemos precios especiales por volumen para conjuntos, colegios y edificios. Contáctenos para una cotización personalizada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, necesito una cotización de materiales por volumen para un proyecto.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Cotizar por volumen
            </a>
            <Link
              href="/#cotizacion"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Solicitar cotización de servicio
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <Link href="/" className="hover:text-primary transition-colors font-medium">VerdeCorporativo</Link> — Bogotá y La Sabana
      </div>

      {/* Product Detail Modal */}
      <Dialog open={selectedProductId !== null} onOpenChange={(open) => { if (!open) setSelectedProductId(null); }}>
        <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] p-0 overflow-hidden rounded-2xl max-h-[90dvh] overflow-y-auto">
          {selectedProductId !== null && (
            <ProductDetail id={selectedProductId} onClose={() => setSelectedProductId(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Floating WhatsApp */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, me interesa información sobre sus productos.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#1ebe5d] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
