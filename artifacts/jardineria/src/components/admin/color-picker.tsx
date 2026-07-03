import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function hslStringToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/).map((p) => parseFloat(p));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return "#16a34a";
  const [h, s, l] = parts;
  const sf = s / 100;
  const lf = l / 100;
  const c = (1 - Math.abs(2 * lf - 1)) * sf;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lf - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHslString(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (hslValue: string) => void;
}

export default function ColorPicker({ id, label, value, onChange }: Props) {
  const hexValue = useMemo(() => hslStringToHex(value || "153 60% 20%"), [value]);

  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="color"
        value={hexValue}
        onChange={(e) => onChange(hexToHslString(e.target.value))}
        className="h-10 w-14 rounded-md border border-input cursor-pointer bg-transparent"
      />
      <div className="flex-1 space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="153 60% 20%"
          className="text-xs font-mono"
        />
      </div>
    </div>
  );
}
