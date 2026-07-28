import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ShoppingBag, ArrowLeft, Star, Package, ChevronRight, Tag, X, CheckCircle2, AlertCircle, Loader2, Ticket } from "lucide-react";
import { useListProducts, useGetProduct } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/home/navbar";
import { useSettings } from "@/lib/site-settings";
import { validatePromoCode } from "@/lib/admin-api";

const WHATSAPP_NUMBER = "573001234567";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "plantas", label: "Plantas" },
  { value: "macetas", label: "Macetas" },
  { value: "tierra", label: "Tierra y Sustratos" },
  { value: "herramientas", label: "Herramientas" },
  { value: "fertilizantes", label: "Fertilizantes" },
];

type PromoResult = {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description: string;
  minOrderAmount: number;
  appliesTo: string;
};

type ProductItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  unit: string;
  inStock: boolean;
  featured: boolean;
  salePrice?: number | null;
  discountLabel?: string | null;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPromoDiscount(promo: PromoResult) {
  if (promo.type === "percentage") return `${promo.value}% de descuento`;
  return `${formatPrice(promo.value)} de descuento`;
}

function appliesToCategory(promo: PromoResult | null, category: string): boolean {
  if (!promo) return false;
  if (promo.appliesTo === "all") return true;
  return promo.appliesTo === `category:${category.toLowerCase()}`;
}

function Watermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <span
        className="text-white/25 font-serif font-bold text-xl tracking-widest uppercase rotate-[-35deg] whitespace-nowrap"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
      >
        Sarria Company
      </span>
    </div>
  );
}

function PriceBadge({ label }: { label: string }) {
  return (
    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
      {label}
    </span>
  );
}

function ProductCard({
  product,
  onClick,
  activePromo,
}: {
  product: ProductItem;
  onClick: () => void;
  activePromo: PromoResult | null;
}) {
  const hasSalePrice = product.salePrice != null && product.salePrice < product.price;
  const displayPrice = hasSalePrice ? product.salePrice! : product.price;
  const promoApplies = appliesToCategory(activePromo, product.category);

  let promoPrice: number | null = null;
  if (activePromo && promoApplies) {
    if (activePromo.type === "percentage") {
      promoPrice = Math.round(displayPrice * (1 - activePromo.value / 100));
    } else {
      promoPrice = Math.max(0, displayPrice - activePromo.value);
    }
  }

  const finalPrice = promoPrice ?? displayPrice;

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa el producto: ${product.name} (${formatPrice(finalPrice)}/${product.unit}).${activePromo && promoApplies ? ` Código promo: ${activePromo.code}` : ""} ¿Tienen disponibilidad?`
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
      <div className="relative h-52 bg-muted cursor-pointer overflow-hidden" onClick={onClick}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <Watermark />
        {product.featured && (
          <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
            <Star className="w-3 h-3" /> Destacado
          </span>
        )}
        {product.discountLabel && !hasSalePrice && (
          <PriceBadge label={product.discountLabel} />
        )}
        {hasSalePrice && <PriceBadge label={product.discountLabel || "OFERTA"} />}
        {promoApplies && activePromo && !hasSalePrice && !product.discountLabel && (
          <PriceBadge label={`-${activePromo.type === "percentage" ? activePromo.value + "%" : formatPrice(activePromo.value)}`} />
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="text-white font-bold text-sm uppercase tracking-wide bg-black/60 px-3 py-1 rounded">
              Agotado
            </span>
          </div>
        )}
      </div>

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
            {/* Show strikethrough original if sale price or promo applies */}
            {(hasSalePrice || promoPrice !== null) && (
              <span className="block text-sm text-muted-foreground line-through leading-tight">
                {formatPrice(product.price)}
              </span>
            )}
            {hasSalePrice && promoPrice === null && (
              <span className="text-xl sm:text-2xl font-bold text-red-600 font-serif">
                {formatPrice(product.salePrice!)}
              </span>
            )}
            {promoPrice !== null && (
              <>
                {hasSalePrice && (
                  <span className="block text-xs text-muted-foreground line-through">
                    {formatPrice(product.salePrice!)}
                  </span>
                )}
                <span className="text-xl sm:text-2xl font-bold text-red-600 font-serif">
                  {formatPrice(promoPrice)}
                </span>
              </>
            )}
            {!hasSalePrice && promoPrice === null && (
              <span className="text-xl sm:text-2xl font-bold text-primary font-serif">
                {formatPrice(product.price)}
              </span>
            )}
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

function ProductDetail({ id, onClose, activePromo }: { id: number; onClose: () => void; activePromo: PromoResult | null }) {
  const { data: product, isLoading } = useGetProduct(id);

  if (isLoading || !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const p = product as ProductItem;
  const hasSalePrice = p.salePrice != null && p.salePrice < p.price;
  const displayPrice = hasSalePrice ? p.salePrice! : p.price;
  const promoApplies = appliesToCategory(activePromo, p.category);

  let promoPrice: number | null = null;
  if (activePromo && promoApplies) {
    if (activePromo.type === "percentage") {
      promoPrice = Math.round(displayPrice * (1 - activePromo.value / 100));
    } else {
      promoPrice = Math.max(0, displayPrice - activePromo.value);
    }
  }

  const finalPrice = promoPrice ?? displayPrice;

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa el producto: ${p.name} (${formatPrice(finalPrice)}/${p.unit}).${activePromo && promoApplies ? ` Código promo: ${activePromo.code}` : ""} ¿Tienen disponibilidad?`
  );

  return (
    <div className="flex flex-col md:flex-row gap-0">
      <div className="relative md:w-1/2 h-48 md:h-auto bg-muted overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none flex-shrink-0">
        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
        <Watermark />
        {p.featured && (
          <span className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" /> Destacado
          </span>
        )}
        {(hasSalePrice || p.discountLabel) && (
          <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {p.discountLabel || "OFERTA"}
          </span>
        )}
      </div>

      <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
        <div>
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">
            {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}
          </span>
          <DialogTitle className="font-serif font-bold text-2xl text-foreground mb-3 leading-tight">
            {p.name}
          </DialogTitle>
          <p className="text-muted-foreground leading-relaxed mb-6">{p.description}</p>

          <div className="flex items-center gap-3 mb-6 p-4 bg-muted/40 rounded-xl">
            <Package className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Unidad de venta</p>
              <p className="font-semibold text-foreground">{p.unit}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Precio</p>
              {/* Stacked prices */}
              <div className="flex flex-col items-end">
                {(hasSalePrice || promoPrice !== null) && (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(p.price)}</span>
                )}
                {hasSalePrice && promoPrice === null && (
                  <span className="text-2xl font-bold text-red-600 font-serif">{formatPrice(p.salePrice!)}</span>
                )}
                {promoPrice !== null && (
                  <>
                    {hasSalePrice && (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(p.salePrice!)}</span>
                    )}
                    <span className="text-2xl font-bold text-red-600 font-serif">{formatPrice(promoPrice)}</span>
                  </>
                )}
                {!hasSalePrice && promoPrice === null && (
                  <span className="text-2xl font-bold text-primary font-serif">{formatPrice(p.price)}</span>
                )}
              </div>
            </div>
          </div>

          {activePromo && promoApplies && (
            <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 text-green-800">
              <Ticket className="w-4 h-4 shrink-0" />
              Código <strong>{activePromo.code}</strong> aplicado — {formatPromoDiscount(activePromo)}
            </div>
          )}

          <div className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${p.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            <span className={`w-2 h-2 rounded-full ${p.inStock ? "bg-green-500" : "bg-red-500"}`} />
            {p.inStock ? "Disponible" : "Agotado temporalmente"}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 inline-flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-colors ${
              p.inStock
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

// Promo code banner
function PromoBanner({ promo, onRemove }: { promo: PromoResult; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-900 text-sm font-medium">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      <div className="flex-1">
        <span className="font-bold">{promo.code}</span> — {formatPromoDiscount(promo)}
        {promo.appliesTo !== "all" && (
          <span className="ml-1 text-green-700 font-normal">
            (aplica a {promo.appliesTo.replace("category:", "")})
          </span>
        )}
        {promo.description && <p className="text-xs text-green-700 font-normal mt-0.5">{promo.description}</p>}
      </div>
      <button type="button" onClick={onRemove} className="text-green-600 hover:text-green-800 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Tienda() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [activePromo, setActivePromo] = useState<PromoResult | null>(null);
  const settings = useSettings();

  const { data: products = [], isLoading } = useListProducts(
    selectedCategory ? { category: selectedCategory } : {}
  );

  const storeStyle: React.CSSProperties = {
    ...(settings["color_store_primary"] ? { ["--primary" as string]: settings["color_store_primary"] } : {}),
    ...(settings["color_store_secondary"] ? { ["--secondary" as string]: settings["color_store_secondary"] } : {}),
  };

  async function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const result = await validatePromoCode(promoCode.trim().toUpperCase());
      setActivePromo(result as PromoResult);
      setPromoCode("");
    } catch (err: any) {
      setPromoError(err.message ?? "Código no válido");
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setActivePromo(null);
    setPromoError(null);
  }

  return (
    <div className="min-h-screen bg-background" style={storeStyle}>
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
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent md:hidden" />
        </div>
      </div>

      {/* Promo Code Section */}
      <div className="container mx-auto px-4 md:px-6 pt-6">
        {activePromo ? (
          <PromoBanner promo={activePromo} onRemove={removePromo} />
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-muted/40 border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Tag className="w-4 h-4" />
              ¿Tienes un código promocional?
            </div>
            <form onSubmit={handleApplyPromo} className="flex gap-2 flex-1 min-w-0">
              <Input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError(null);
                }}
                placeholder="Ej: SARRIA10"
                className="font-mono tracking-wider text-sm h-9 max-w-48"
                maxLength={30}
              />
              <Button type="submit" size="sm" variant="outline" disabled={promoLoading || !promoCode.trim()} className="shrink-0">
                {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
              </Button>
            </form>
            {promoError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 sm:ml-auto shrink-0">
                <AlertCircle className="w-3.5 h-3.5" /> {promoError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 md:px-6 py-8">
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
              {(products as ProductItem[]).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProductId(product.id)}
                  activePromo={activePromo}
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
        <Link href="/" className="hover:text-primary transition-colors font-medium">Sarria Company</Link> — Bogotá y La Sabana
      </div>

      {/* Product Detail Modal */}
      <Dialog open={selectedProductId !== null} onOpenChange={(open) => { if (!open) setSelectedProductId(null); }}>
        <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] p-0 overflow-hidden rounded-2xl max-h-[90dvh] overflow-y-auto">
          {selectedProductId !== null && (
            <ProductDetail id={selectedProductId} onClose={() => setSelectedProductId(null)} activePromo={activePromo} />
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
