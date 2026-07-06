import { useEffect, useMemo, useRef, useState } from "react";
import { getSettings, updateSetting } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ColorPicker from "@/components/admin/color-picker";
import { FONT_CATEGORIES, ALL_FONTS, BRAND_DEFAULTS } from "@/lib/font-catalog";
import { parseOverrides, type ElementOverrideMap } from "@/lib/element-inspector";
import {
  AlertTriangle,
  Check,
  Loader2,
  MousePointerClick,
  Monitor,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import manualImg from "@assets/MANUAL_DE_IDENTIDAD_VISUAL_BASICO_LOGO_SARRIA_COMPANY_(1)_1783376093846.jpg";

const STYLE_KEYS = [
  "color_primary",
  "color_secondary",
  "color_heading_text",
  "color_body_text",
  "font_heading",
  "font_subheading",
  "font_body",
  "btn_primary_bg",
  "btn_primary_text",
  "btn_secondary_bg",
  "btn_secondary_text",
  "logo_size",
  "logo_size_footer",
  "cta_nav_text",
  "cta_hero_primary_text",
  "cta_hero_whatsapp_text",
  "color_store_primary",
  "color_store_secondary",
  "element_style_overrides",
] as const;

type StyleKey = (typeof STYLE_KEYS)[number];
type Draft = Partial<Record<StyleKey, string>>;

const DEFAULTS: Draft = {
  color_primary: "153 60% 20%",
  color_secondary: "28 60% 45%",
  color_heading_text: "153 30% 15%",
  color_body_text: "153 15% 30%",
  font_heading: "Poppins",
  font_subheading: "Poppins",
  font_body: "Metropolis",
  btn_primary_bg: "153 60% 20%",
  btn_primary_text: "0 0% 100%",
  btn_secondary_bg: "28 60% 45%",
  btn_secondary_text: "0 0% 100%",
  logo_size: "64",
  logo_size_footer: "48",
  cta_nav_text: "Solicitar Cotización",
  cta_hero_primary_text: "Solicitar cotización gratuita",
  cta_hero_whatsapp_text: "Escríbanos por WhatsApp",
  color_store_primary: "",
  color_store_secondary: "",
  element_style_overrides: "{}",
};

type PreviewPage = "/" | "/tienda";

const PREVIEW_PAGES: { value: PreviewPage; label: string }[] = [
  { value: "/", label: "Inicio" },
  { value: "/tienda", label: "Tienda" },
];

interface SelectedElement {
  id: string;
  tag: string;
  text: string;
  color: string;
  font: string;
}

function FontSelect({
  label,
  value,
  onChange,
  allowNone,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
}) {
  const current = ALL_FONTS.find((f) => f.value === value);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        {allowNone && <option value="">— Tipografía global del sitio —</option>}
        {FONT_CATEGORIES.map((cat) => (
          <optgroup key={cat.id} label={cat.label}>
            {cat.fonts.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {current && (
        <p className="text-xs text-muted-foreground" style={{ fontFamily: current.family }}>
          Vista previa — Sarria Company Paisajismo
        </p>
      )}
    </div>
  );
}

interface Props {
  onDirtyChange?: (dirty: boolean) => void;
}

export default function StyleEditorPanel({ onDirtyChange }: Props) {
  const [original, setOriginal] = useState<Draft>({});
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [inspectMode, setInspectMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [previewPage, setPreviewPage] = useState<PreviewPage>("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    getSettings()
      .then((settings) => {
        const map: Draft = {};
        for (const s of settings) {
          if ((STYLE_KEYS as readonly string[]).includes(s.key)) {
            (map as Record<string, string>)[s.key] = s.value;
          }
        }
        const withDefaults = { ...DEFAULTS, ...map };
        setOriginal(withDefaults);
        setDraft(withDefaults);
      })
      .finally(() => setLoading(false));
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(original) !== JSON.stringify(draft),
    [original, draft]
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Warn on browser tab close / refresh while there are unsaved changes.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Push live draft to the preview iframe on every change (WYSIWYG).
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ type: "sarria-style-preview", draft }, "*");
  }, [draft]);

  // Toggle click-to-select mode inside the preview iframe.
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ type: "sarria-inspector-mode", enabled: inspectMode }, "*");
  }, [inspectMode]);

  // Receive element-selected events from the preview iframe.
  useEffect(() => {
    function handler(event: MessageEvent) {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "sarria-element-selected") {
        setSelectedElement({ id: msg.id, tag: msg.tag, text: msg.text, color: msg.color, font: msg.font });
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const elementOverrides: ElementOverrideMap = useMemo(
    () => parseOverrides(draft.element_style_overrides),
    [draft.element_style_overrides]
  );

  function updateElementOverride(id: string, patch: { color?: string; font?: string }) {
    const next: ElementOverrideMap = { ...elementOverrides, [id]: { ...elementOverrides[id], ...patch } };
    setDraft((prev) => ({ ...prev, element_style_overrides: JSON.stringify(next) }));
  }

  function removeElementOverride(id: string) {
    const next: ElementOverrideMap = { ...elementOverrides };
    delete next[id];
    setDraft((prev) => ({ ...prev, element_style_overrides: JSON.stringify(next) }));
  }

  function closeElementEditor() {
    setSelectedElement(null);
    const win = iframeRef.current?.contentWindow;
    win?.postMessage({ type: "sarria-element-deselect" }, "*");
  }

  function toggleInspectMode() {
    setInspectMode((v) => {
      if (v) closeElementEditor();
      return !v;
    });
  }

  function set<K extends StyleKey>(key: K) {
    return (v: string) => setDraft((prev) => ({ ...prev, [key]: v }));
  }

  function applyBrandPreset() {
    setDraft((prev) => ({ ...prev, ...BRAND_DEFAULTS }));
  }

  function discard() {
    setDraft(original);
  }

  async function confirmSave() {
    setSaving(true);
    try {
      const changedKeys = STYLE_KEYS.filter((k) => draft[k] !== original[k]);
      for (const key of changedKeys) {
        await updateSetting(key, draft[key] ?? "");
      }
      setOriginal(draft);
      setConfirmOpen(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Cargando editor visual...</div>;
  }

  const previewSrc = `${(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")}${previewPage}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Editor Visual del Sitio
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Cambia colores, tipografía, botones y el tamaño del logo. Verás los cambios en vivo en la
            vista previa de la derecha. Nada se aplica al sitio real hasta que le des a{" "}
            <strong>Guardar y confirmar</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Cambios sin guardar
            </span>
          )}
          {savedFlash && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <Check className="w-3.5 h-3.5" /> Guardado
            </span>
          )}
          <Button variant="outline" size="sm" disabled={!isDirty || saving} onClick={discard}>
            Descartar cambios
          </Button>
          <Button size="sm" disabled={!isDirty || saving} onClick={() => setConfirmOpen(true)}>
            Guardar y confirmar
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Controls */}
        <div className="space-y-5">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <button
                type="button"
                onClick={() => setManualOpen((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <CardTitle className="text-base">📘 Manual de Identidad Visual</CardTitle>
                <span className="text-xs text-primary underline">{manualOpen ? "Ocultar" : "Ver manual"}</span>
              </button>
              <CardDescription>
                Parámetro principal de la marca: tipografía Poppins (títulos) + Metropolis (texto).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {manualOpen && (
                <img
                  src={manualImg}
                  alt="Manual de Identidad Visual - Sarria Company"
                  className="w-full rounded-lg border border-border"
                />
              )}
              <Button type="button" variant="secondary" size="sm" className="w-full" onClick={applyBrandPreset}>
                Aplicar valores del manual de marca
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🔠 Tipografía</CardTitle>
              <CardDescription>Elige la fuente para títulos, subtítulos y texto de párrafo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FontSelect label="Títulos (H1 / H2 / H3)" value={draft.font_heading ?? "Poppins"} onChange={set("font_heading")} />
              <FontSelect label="Subtítulos (H4 / H5 / H6)" value={draft.font_subheading ?? "Poppins"} onChange={set("font_subheading")} />
              <FontSelect label="Texto / párrafos" value={draft.font_body ?? "Metropolis"} onChange={set("font_body")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🎨 Colores de las letras</CardTitle>
              <CardDescription>Color del texto de títulos y párrafos en todo el sitio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker id="color_heading_text" label="Color de títulos" value={draft.color_heading_text ?? ""} onChange={set("color_heading_text")} />
              <ColorPicker id="color_body_text" label="Color de texto / párrafos" value={draft.color_body_text ?? ""} onChange={set("color_body_text")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🌿 Colores generales del sitio</CardTitle>
              <CardDescription>Fondo de secciones, iconos y acentos (footer, badges, etc).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker id="color_primary" label="Color primario" value={draft.color_primary ?? ""} onChange={set("color_primary")} />
              <ColorPicker id="color_secondary" label="Color secundario" value={draft.color_secondary ?? ""} onChange={set("color_secondary")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🛍️ Colores de la tienda</CardTitle>
              <CardDescription>
                Opcional: colores propios para la página de Tienda. Si se dejan vacíos, usa los
                colores generales del sitio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker id="color_store_primary" label="Color primario de la tienda" value={draft.color_store_primary ?? ""} onChange={set("color_store_primary")} />
              <ColorPicker id="color_store_secondary" label="Color secundario de la tienda" value={draft.color_store_secondary ?? ""} onChange={set("color_store_secondary")} />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    color_store_primary: BRAND_DEFAULTS.color_primary,
                    color_store_secondary: BRAND_DEFAULTS.color_secondary,
                  }))
                }
              >
                Aplicar valores del manual de marca
              </Button>
              {(draft.color_store_primary || draft.color_store_secondary) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setDraft((prev) => ({ ...prev, color_store_primary: "", color_store_secondary: "" }))}
                >
                  Usar colores generales del sitio
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🔘 Botones</CardTitle>
              <CardDescription>Color de fondo y texto de cada tipo de botón, y el texto que muestran.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 border border-border rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Botón primario</p>
                <ColorPicker id="btn_primary_bg" label="Color de fondo" value={draft.btn_primary_bg ?? ""} onChange={set("btn_primary_bg")} />
                <ColorPicker id="btn_primary_text" label="Color del texto" value={draft.btn_primary_text ?? ""} onChange={set("btn_primary_text")} />
              </div>
              <div className="space-y-3 border border-border rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Botón secundario</p>
                <ColorPicker id="btn_secondary_bg" label="Color de fondo" value={draft.btn_secondary_bg ?? ""} onChange={set("btn_secondary_bg")} />
                <ColorPicker id="btn_secondary_text" label="Color del texto" value={draft.btn_secondary_text ?? ""} onChange={set("btn_secondary_text")} />
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Texto botón del menú / navegación</Label>
                  <Input value={draft.cta_nav_text ?? ""} onChange={(e) => set("cta_nav_text")(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Texto botón principal del hero</Label>
                  <Input value={draft.cta_hero_primary_text ?? ""} onChange={(e) => set("cta_hero_primary_text")(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Texto botón de WhatsApp del hero</Label>
                  <Input value={draft.cta_hero_whatsapp_text ?? ""} onChange={(e) => set("cta_hero_whatsapp_text")(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🖼️ Tamaño del logo</CardTitle>
              <CardDescription>Ajusta el tamaño del logo en el menú y en el pie de página.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <Label>Menú de navegación</Label>
                  <span>{draft.logo_size ?? "64"}px</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={140}
                  value={Number(draft.logo_size ?? 64)}
                  onChange={(e) => set("logo_size")(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <Label>Pie de página</Label>
                  <span>{draft.logo_size_footer ?? "48"}px</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={120}
                  value={Number(draft.logo_size_footer ?? 48)}
                  onChange={(e) => set("logo_size_footer")(e.target.value)}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Vista previa en vivo</p>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {PREVIEW_PAGES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      closeElementEditor();
                      setPreviewPage(p.value);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                      previewPage === p.value ? "bg-white shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={inspectMode ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={toggleInspectMode}
              >
                <MousePointerClick className="w-4 h-4" />
                {inspectMode ? "Seleccionando…" : "Editar un texto o botón"}
              </Button>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setDevice("desktop")}
                  className={`p-1.5 rounded ${device === "desktop" ? "bg-white shadow-sm" : ""}`}
                  aria-label="Vista de escritorio"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice("mobile")}
                  className={`p-1.5 rounded ${device === "mobile" ? "bg-white shadow-sm" : ""}`}
                  aria-label="Vista móvil"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {inspectMode && (
            <p className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-2">
              Haz clic sobre cualquier texto o botón de la vista previa para editar su color o tipografía.
            </p>
          )}
          <div className="relative border border-border rounded-xl overflow-hidden bg-white shadow-sm flex justify-center">
            <iframe
              ref={iframeRef}
              src={previewSrc}
              title="Vista previa del sitio"
              className="bg-white"
              style={{
                width: device === "mobile" ? 390 : "100%",
                height: 720,
                border: "none",
              }}
              onLoad={() => {
                iframeRef.current?.contentWindow?.postMessage(
                  { type: "sarria-style-preview", draft },
                  "*"
                );
                iframeRef.current?.contentWindow?.postMessage(
                  { type: "sarria-inspector-mode", enabled: inspectMode },
                  "*"
                );
              }}
            />
            {selectedElement && (
              <div className="absolute top-3 right-3 w-72 bg-white border border-border rounded-lg shadow-xl p-4 space-y-3 z-10">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Editando &lt;{selectedElement.tag}&gt;
                    </p>
                    <p className="text-sm font-medium truncate max-w-[200px]" title={selectedElement.text}>
                      “{selectedElement.text}”
                    </p>
                  </div>
                  <button onClick={closeElementEditor} aria-label="Cerrar">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <ColorPicker
                  id={`el-${selectedElement.id}-color`}
                  label="Color del texto"
                  value={elementOverrides[selectedElement.id]?.color ?? selectedElement.color}
                  onChange={(v) => updateElementOverride(selectedElement.id, { color: v })}
                />
                <FontSelect
                  label="Tipografía"
                  allowNone
                  value={elementOverrides[selectedElement.id]?.font ?? ""}
                  onChange={(v) => updateElementOverride(selectedElement.id, { font: v || undefined })}
                />
                {elementOverrides[selectedElement.id] && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => removeElementOverride(selectedElement.id)}
                  >
                    Quitar personalización
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold">Confirmar cambios de estilo</h2>
              <button onClick={() => setConfirmOpen(false)} aria-label="Cerrar">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Estás a punto de aplicar estos cambios de color, tipografía, botones y logo a todo el
              sitio web público. Esta acción se puede revertir editando de nuevo.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={confirmSave} disabled={saving} className="gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar y guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
