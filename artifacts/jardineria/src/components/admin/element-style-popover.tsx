import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ColorPicker from "@/components/admin/color-picker";
import { ALL_FONTS, FONT_CATEGORIES } from "@/lib/font-catalog";
import { X } from "lucide-react";
import type { ElementOverride, ElementOverrideMap } from "@/lib/element-inspector";

export interface SelectedElement {
  id: string;
  tag: string;
  text: string;
  color: string;
  font: string;
}

export function ElementStylePopover({
  selected,
  overrides,
  onChange,
  onRemove,
  onClose,
}: {
  selected: SelectedElement;
  overrides: ElementOverrideMap;
  onChange: (id: string, patch: ElementOverride) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const override = overrides[selected.id];
  return (
    <div className="absolute top-3 right-3 w-72 bg-white border border-border rounded-lg shadow-xl p-4 space-y-3 z-10">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Editando &lt;{selected.tag}&gt;
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={selected.text}>
            {selected.text || "Sin texto"}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Contenido</Label>
        <Textarea
          rows={2}
          className="text-xs resize-none"
          value={override?.text ?? selected.text}
          onChange={(e) => onChange(selected.id, { text: e.target.value })}
          placeholder="Escribe el contenido..."
        />
      </div>

      <ColorPicker
        id={`el-${selected.id}-color`}
        label="Color del texto"
        value={override?.color ?? selected.color}
        onChange={(value) => onChange(selected.id, { color: value })}
      />

      <div className="space-y-1.5">
        <Label className="text-xs">Tipografía</Label>
        <select
          value={override?.font ?? ""}
          onChange={(e) => onChange(selected.id, { font: e.target.value || undefined })}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
        >
          <option value="">— Tipografía global del sitio —</option>
          {FONT_CATEGORIES.map((category) => (
            <optgroup key={category.id} label={category.label}>
              {category.fonts.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {override?.font && (
          <p className="text-xs text-muted-foreground" style={{ fontFamily: ALL_FONTS.find((font) => font.value === override.font)?.family }}>
            Vista previa de tipografía
          </p>
        )}
      </div>

      {override && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onRemove(selected.id)}>
          Quitar personalización
        </Button>
      )}
    </div>
  );
}