import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Block } from "@/components/admin/block-editor";

interface ContentBlocksRendererProps {
  blocks: Block[];
  placement?: string;
}

export default function ContentBlocksRenderer({ blocks, placement }: ContentBlocksRendererProps) {
  const visibleBlocks = placement
    ? blocks.filter((block) => (block.placement ?? "after-hero") === placement)
    : blocks;
  if (visibleBlocks.length === 0) return null;

  return (
    <section className="py-12" style={{ background: "var(--section-bg, transparent)", color: "var(--color-body-text)" }}>
      <div className="container mx-auto px-4 md:px-6 max-w-4xl space-y-12">
        {visibleBlocks.map((block) => <BlockItem key={block.id} block={block} />)}
      </div>
    </section>
  );
}

function BlockItem({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": return <HeadingBlock block={block} />;
    case "text": return <TextBlock block={block} />;
    case "image": return <ImageBlock block={block} />;
    case "carousel": return <CarouselBlock block={block} />;
    case "video": return <VideoBlock block={block} />;
    case "divider": return <DividerBlock block={block} />;
    default: return null;
  }
}

function HeadingBlock({ block }: { block: Block }) {
  const align = block.headingAlign ?? "center";
  const textAlign = { left: "text-left", center: "text-center", right: "text-right" }[align];

  return (
    <div className={textAlign}>
      {block.headingSubtitle && (
        <p className="text-sm font-semibold uppercase tracking-widest mb-2 opacity-60">
          {block.headingSubtitle}
        </p>
      )}
      {block.headingTitle && (
        <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
          {block.headingTitle}
        </h2>
      )}
    </div>
  );
}

function TextBlock({ block }: { block: Block }) {
  if (!block.textHtml) return null;

  return (
    <div
      className="prose prose-lg max-w-none prose-headings:font-bold"
      style={{ color: "var(--color-body-text)" }}
      dangerouslySetInnerHTML={{ __html: block.textHtml }}
    />
  );
}

function ImageBlock({ block }: { block: Block }) {
  if (!block.imageUrl) return null;
  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    full: "max-w-full",
  }[block.imageSize ?? "full"];
  const alignClass = block.imageSize !== "full"
    ? { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[block.imageAlign ?? "center"]
    : "";

  return (
    <figure className={`${sizeClass} ${alignClass}`}>
      <img src={block.imageUrl} alt={block.imageCaption ?? ""} className="w-full rounded-xl shadow-sm object-cover" />
      {block.imageCaption && <figcaption className="text-sm text-center mt-2 opacity-60">{block.imageCaption}</figcaption>}
    </figure>
  );
}

function CarouselBlock({ block }: { block: Block }) {
  const images = block.carouselImages ?? [];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });
  const [selectedIdx, setSelectedIdx] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIdx(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  if (images.length === 0) return null;
  const aspectClass = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
  }[block.carouselAspect ?? "16/9"];

  return (
    <div className="relative group rounded-2xl overflow-hidden shadow-sm border border-border/30">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((img, i) => (
            <div key={`${img.url}-${i}`} className={`relative min-w-0 flex-[0_0_100%] ${aspectClass}`}>
              <img src={img.url} alt={img.caption ?? ""} className="w-full h-full object-cover" />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-5 py-4">
                  <p className="text-white text-sm text-center">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white rounded-full p-2.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white rounded-full p-2.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === selectedIdx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`}
                aria-label={`Imagen ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function VideoBlock({ block }: { block: Block }) {
  if (!block.videoUrl) return null;
  const videoId = extractYoutubeId(block.videoUrl);
  if (!videoId) {
    return <div className="rounded-xl bg-muted p-8 text-center text-muted-foreground text-sm">URL de YouTube no válida</div>;
  }

  return (
    <figure className="rounded-2xl overflow-hidden shadow-sm border border-border/30">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={block.videoTitle || "Video de YouTube"}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {block.videoTitle && <figcaption className="px-5 py-3 text-sm opacity-70 text-center border-t border-border/30">{block.videoTitle}</figcaption>}
    </figure>
  );
}

function DividerBlock({ block }: { block: Block }) {
  const height = { sm: 8, md: 24, lg: 64 }[block.dividerSize ?? "md"];
  return <div style={{ height }} />;
}

function extractYoutubeId(url: string): string | null {
  const match =
    url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/) ||
    url.match(/^([^"&?/\s]{11})$/);
  return match?.[1] ?? null;
}