/**
 * Block-based page builder — used inside the landing pages admin.
 * Supports: heading, text (rich), image, carousel, video (YouTube), divider.
 * Blocks are reorderable via HTML5 drag-and-drop and up/down buttons.
 */
import { useState, useRef, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/admin/image-upload";
import {
  Plus, Trash2, ChevronUp, ChevronDown, GripVertical,
  Type, ImageIcon, Film, Minus, LayoutTemplate,
  AlignLeft, AlignCenter, AlignRight, SlidersHorizontal,
  ChevronDown as Caret, X,
} from "lucide-react";

const RichTextEditor = lazy(() => import("@/components/admin/rich-text-editor"));

// ─── Types ──────────────────────────────────────────────────────────────────

export type BlockType = "heading" | "text" | "image" | "carousel" | "video" | "divider";

export interface CarouselImage {
  url: string;
  caption?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  // heading
  headingTitle?: string;
  headingSubtitle?: string;
  headingAlign?: "left" | "center" | "right";
  // text
  textHtml?: string;
  // image
  imageUrl?: string;
  imageCaption?: string;
  imageSize?: "sm" | "md" | "lg" | "full";
  imageAlign?: "left" | "center" | "right";
  // carousel
  carouselImages?: CarouselImage[];
  carouselAspect?: "16/9" | "4/3" | "1/1";
  // video
  videoUrl?: string;
  videoTitle?: string;
  // divider
  dividerSize?: "sm" | "md" | "lg";
}

export interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 11);
}

function makeBlock(type: BlockType): Block {
  return { id: makeId(), type };
}

function youtubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/) ||
    url.match(/^([^"&?/\s]{11})$/);
  return m?.[1] ?? null;
}

// ─── Block type palette ──────────────────────────────────────────────────────

const PALETTE: { type: BlockType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    type: "heading",
    label: "Encabezado",
    desc: "Título y subtítulo de sección",
    icon: <LayoutTemplate className="w-5 h-5" />,
    color: "bg-violet-100 text-violet-700",
  },
  {
    type: "text",
    label: "Texto",
    desc: "Párrafos, listas, negritas",
    icon: <Type className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-700",
  },
  {
    type: "image",
    label: "Imagen",
    desc: "Una imagen con caption",
    icon: <ImageIcon className="w-5 h-5" />,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    type: "carousel",
    label: "Carrusel",
    desc: "Galería de imágenes deslizable",
    icon: <SlidersHorizontal className="w-5 h-5" />,
    color: "bg-orange-100 text-orange-700",
  },
  {
    type: "video",
    label: "Video YouTube",
    desc: "Embed de video de YouTube",
    icon: <Film className="w-5 h-5" />,
    color: "bg-red-100 text-red-700",
  },
  {
    type: "divider",
    label: "Separador",
    desc: "Línea o espacio entre secciones",
    icon: <Minus className="w-5 h-5" />,
    color: "bg-muted text-muted-foreground",
  },
];

const typeLabel: Record<BlockType, string> = {
  heading: "Encabezado",
  text: "Texto",
  image: "Imagen",
  carousel: "Carrusel",
  video: "Video",
  divider: "Separador",
};

const typeBadge: Record<BlockType, string> = {
  heading: "bg-violet-100 text-violet-700",
  text: "bg-blue-100 text-blue-700",
  image: "bg-emerald-100 text-emerald-700",
  carousel: "bg-orange-100 text-orange-700",
  video: "bg-red-100 text-red-700",
  divider: "bg-muted text-muted-foreground",
};

// ─── Per-block editors ───────────────────────────────────────────────────────

function HeadingEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const aligns: { v: "left" | "center" | "right"; icon: React.ReactNode }[] = [
    { v: "left", icon: <AlignLeft className="w-4 h-4" /> },
    { v: "center", icon: <AlignCenter className="w-4 h-4" /> },
    { v: "right", icon: <AlignRight className="w-4 h-4" /> },
  ];
  return (
    <div className="space-y-3 pt-1">
      <div className="space-y-1.5">
        <Label className="text-xs">Título</Label>
        <Input
          value={block.headingTitle ?? ""}
          onChange={(e) => onChange({ ...block, headingTitle: e.target.value })}
          placeholder="Título de la sección"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Subtítulo / bajada</Label>
        <Input
          value={block.headingSubtitle ?? ""}
          onChange={(e) => onChange({ ...block, headingSubtitle: e.target.value })}
          placeholder="Descripción breve..."
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Alineación</Label>
        <div className="flex gap-1">
          {aligns.map(({ v, icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...block, headingAlign: v })}
              className={`p-2 rounded border transition-colors ${(block.headingAlign ?? "center") === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TextEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  return (
    <div className="pt-1">
      <Suspense fallback={<div className="h-48 bg-muted rounded animate-pulse" />}>
        <RichTextEditor
          value={block.textHtml ?? ""}
          onChange={(html) => onChange({ ...block, textHtml: html })}
          placeholder="Escribe el contenido aquí..."
          height={260}
        />
      </Suspense>
    </div>
  );
}

function ImageEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const sizes: { v: Block["imageSize"]; label: string }[] = [
    { v: "sm", label: "Pequeña" },
    { v: "md", label: "Mediana" },
    { v: "lg", label: "Grande" },
    { v: "full", label: "Completa" },
  ];
  const aligns: { v: "left" | "center" | "right"; icon: React.ReactNode }[] = [
    { v: "left", icon: <AlignLeft className="w-4 h-4" /> },
    { v: "center", icon: <AlignCenter className="w-4 h-4" /> },
    { v: "right", icon: <AlignRight className="w-4 h-4" /> },
  ];
  return (
    <div className="space-y-4 pt-1">
      {block.imageUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-border">
          <img src={block.imageUrl} alt="preview" className="w-full max-h-52 object-cover" />
          <button
            type="button"
            onClick={() => onChange({ ...block, imageUrl: undefined })}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <ImageUpload
            accept="image/*"
            label="Subir imagen"
            onUploaded={(url) => onChange({ ...block, imageUrl: url })}
          />
          <p className="text-xs text-muted-foreground mt-2">o pega una URL:</p>
          <Input
            className="mt-2 text-xs"
            placeholder="https://..."
            onBlur={(e) => { if (e.target.value) onChange({ ...block, imageUrl: e.target.value }); }}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">Descripción / caption</Label>
        <Input
          value={block.imageCaption ?? ""}
          onChange={(e) => onChange({ ...block, imageCaption: e.target.value })}
          placeholder="Texto debajo de la imagen (opcional)"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Tamaño</Label>
          <div className="flex flex-wrap gap-1">
            {sizes.map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ ...block, imageSize: v })}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${(block.imageSize ?? "full") === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {(block.imageSize ?? "full") !== "full" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Alineación</Label>
            <div className="flex gap-1">
              {aligns.map(({ v, icon }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange({ ...block, imageAlign: v })}
                  className={`p-2 rounded border transition-colors ${(block.imageAlign ?? "center") === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CarouselEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const images = block.carouselImages ?? [];

  function addImage(url: string) {
    onChange({ ...block, carouselImages: [...images, { url }] });
  }

  function removeImage(i: number) {
    onChange({ ...block, carouselImages: images.filter((_, idx) => idx !== i) });
  }

  function updateCaption(i: number, caption: string) {
    const next = images.map((img, idx) => (idx === i ? { ...img, caption } : img));
    onChange({ ...block, carouselImages: next });
  }

  function moveImage(i: number, dir: -1 | 1) {
    const next = [...images];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    onChange({ ...block, carouselImages: next });
  }

  const aspects: { v: Block["carouselAspect"]; label: string }[] = [
    { v: "16/9", label: "16:9" },
    { v: "4/3", label: "4:3" },
    { v: "1/1", label: "1:1" },
  ];

  return (
    <div className="space-y-4 pt-1">
      {/* Aspect ratio */}
      <div className="space-y-1.5">
        <Label className="text-xs">Proporción de imágenes</Label>
        <div className="flex gap-2">
          {aspects.map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...block, carouselAspect: v })}
              className={`px-3 py-1 text-xs rounded border transition-colors ${(block.carouselAspect ?? "16/9") === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((img, i) => (
            <div key={i} className="flex gap-2 items-start bg-muted/30 rounded-lg p-2 border border-border">
              <img src={img.url} alt="" className="w-20 h-14 object-cover rounded flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <Input
                  className="h-7 text-xs"
                  value={img.caption ?? ""}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Caption (opcional)"
                />
              </div>
              <div className="flex flex-col gap-0.5 shrink-0">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => removeImage(i)} className="p-1 rounded hover:bg-red-50 text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add image */}
      <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2">
        <ImageUpload
          accept="image/*"
          label={images.length === 0 ? "Agregar primera imagen" : "+ Agregar imagen al carrusel"}
          onUploaded={addImage}
        />
        <p className="text-xs text-muted-foreground">o pega una URL:</p>
        <form
          className="flex gap-2 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const url = (fd.get("url") as string)?.trim();
            if (url) { addImage(url); (e.currentTarget as HTMLFormElement).reset(); }
          }}
        >
          <Input name="url" className="text-xs" placeholder="https://..." />
          <Button type="submit" size="sm" variant="outline">Añadir</Button>
        </form>
        <p className="text-xs text-muted-foreground">{images.length} imagen{images.length !== 1 ? "es" : ""} en el carrusel</p>
      </div>
    </div>
  );
}

function VideoEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const vid = block.videoUrl ? youtubeId(block.videoUrl) : null;
  return (
    <div className="space-y-4 pt-1">
      <div className="space-y-1.5">
        <Label className="text-xs">URL de YouTube</Label>
        <Input
          value={block.videoUrl ?? ""}
          onChange={(e) => onChange({ ...block, videoUrl: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        {block.videoUrl && !vid && (
          <p className="text-xs text-destructive">No se pudo detectar el ID del video. Verifica la URL.</p>
        )}
      </div>
      {vid && (
        <div className="rounded-lg overflow-hidden border border-border">
          <iframe
            src={`https://www.youtube.com/embed/${vid}`}
            title={block.videoTitle ?? "Video"}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">Título / descripción (opcional)</Label>
        <Input
          value={block.videoTitle ?? ""}
          onChange={(e) => onChange({ ...block, videoTitle: e.target.value })}
          placeholder="Descripción del video..."
        />
      </div>
    </div>
  );
}

function DividerEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const sizes: { v: Block["dividerSize"]; label: string }[] = [
    { v: "sm", label: "Pequeño (8px)" },
    { v: "md", label: "Mediano (24px)" },
    { v: "lg", label: "Grande (64px)" },
  ];
  return (
    <div className="space-y-3 pt-1">
      <div className="space-y-1.5">
        <Label className="text-xs">Tamaño del espacio</Label>
        <div className="flex gap-2">
          {sizes.map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...block, dividerSize: v })}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${(block.dividerSize ?? "md") === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="border-t border-dashed border-muted-foreground/30 my-2"
        style={{ marginTop: { sm: 8, md: 24, lg: 64 }[block.dividerSize ?? "md"] }}
      />
    </div>
  );
}

// ─── Block card ──────────────────────────────────────────────────────────────

function BlockCard({
  block,
  index,
  total,
  expanded,
  onToggle,
  onChange,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  block: Block;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const palette = PALETTE.find((p) => p.type === block.type);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setIsDragOver(true); onDragOver(e); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(); }}
      onDragEnd={() => setIsDragOver(false)}
      className={`rounded-xl border transition-all select-none ${isDragOver ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border bg-card"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab shrink-0" />

        {/* Type badge */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${typeBadge[block.type]}`}>
          {typeLabel[block.type]}
        </span>

        {/* Preview text */}
        <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
          {block.type === "heading" && (block.headingTitle || "Sin título")}
          {block.type === "text" && (block.textHtml ? "Contenido de texto" : "Vacío")}
          {block.type === "image" && (block.imageUrl ? block.imageCaption || "Imagen" : "Sin imagen")}
          {block.type === "carousel" && `${block.carouselImages?.length ?? 0} imagen${(block.carouselImages?.length ?? 0) !== 1 ? "es" : ""}`}
          {block.type === "video" && (block.videoUrl ? (block.videoTitle || "Video de YouTube") : "Sin URL")}
          {block.type === "divider" && "Espacio separador"}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Subir">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Bajar">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onToggle} className="p-1 rounded hover:bg-muted transition-colors" title={expanded ? "Colapsar" : "Expandir"}>
            <Caret className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          <button type="button" onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-destructive transition-colors" title="Eliminar bloque">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/60 bg-muted/10">
          {block.type === "heading" && <HeadingEditor block={block} onChange={onChange} />}
          {block.type === "text" && <TextEditor block={block} onChange={onChange} />}
          {block.type === "image" && <ImageEditor block={block} onChange={onChange} />}
          {block.type === "carousel" && <CarouselEditor block={block} onChange={onChange} />}
          {block.type === "video" && <VideoEditor block={block} onChange={onChange} />}
          {block.type === "divider" && <DividerEditor block={block} onChange={onChange} />}
        </div>
      )}
    </div>
  );
}

// ─── Add-block palette popup ─────────────────────────────────────────────────

function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside mousedown (more reliable than onBlur for click detection)
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 border-dashed"
        onClick={() => setOpen((o) => !o)}
      >
        <Plus className="w-4 h-4" />
        Agregar bloque
      </Button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 bg-popover border border-border rounded-xl shadow-xl p-2 w-72">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wide">Tipo de bloque</p>
          <div className="grid grid-cols-2 gap-1">
            {PALETTE.map(({ type, label, desc, icon, color }) => (
              <button
                key={type}
                type="button"
                onClick={() => { onAdd(type); setOpen(false); }}
                className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <span className={`p-1.5 rounded-lg shrink-0 ${color}`}>{icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main BlockEditor ────────────────────────────────────────────────────────

export default function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const dragIndexRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addBlock(type: BlockType) {
    const block = makeBlock(type);
    onChange([...blocks, block]);
    // Auto-expand the new block
    setExpanded((prev) => new Set([...prev, block.id]));
  }

  function updateBlock(id: string, updated: Block) {
    onChange(blocks.map((b) => (b.id === id ? updated : b)));
  }

  function deleteBlock(id: string) {
    if (!confirm("¿Eliminar este bloque?")) return;
    onChange(blocks.filter((b) => b.id !== id));
    setExpanded((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const next = [...blocks];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  }

  // HTML5 DnD reorder
  function handleDrop(targetIndex: number) {
    const from = dragIndexRef.current;
    if (from === null || from === targetIndex) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    next.splice(targetIndex, 0, item);
    onChange(next);
    dragIndexRef.current = null;
    setDragOver(null);
  }

  if (blocks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-xl py-14 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm text-foreground mb-1">Sin bloques de contenido</p>
          <p className="text-xs text-muted-foreground mb-5">Agrega encabezados, texto, imágenes, carruseles o videos para construir la página.</p>
          <AddBlockMenu onAdd={addBlock} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <BlockCard
          key={block.id}
          block={block}
          index={index}
          total={blocks.length}
          expanded={expanded.has(block.id)}
          onToggle={() => toggle(block.id)}
          onChange={(updated) => updateBlock(block.id, updated)}
          onDelete={() => deleteBlock(block.id)}
          onMove={(dir) => moveBlock(index, dir)}
          onDragStart={() => { dragIndexRef.current = index; }}
          onDragOver={() => setDragOver(index)}
          onDrop={() => handleDrop(index)}
        />
      ))}

      {/* Drop zone indicator */}
      {dragOver !== null && (
        <div className="h-1 bg-primary/40 rounded-full mx-4 transition-all" />
      )}

      {/* Add block */}
      <div className="pt-2">
        <AddBlockMenu onAdd={addBlock} />
      </div>
    </div>
  );
}
