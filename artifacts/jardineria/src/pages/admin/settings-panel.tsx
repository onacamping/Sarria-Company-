import { useState, useEffect } from "react";
import { getSettings, updateSetting } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SettingDef {
  key: string;
  label: string;
  type: string;
  placeholder: string;
}

const STATS_DEFS: SettingDef[] = [
  { key: "years_experience", label: "Años de experiencia", type: "number", placeholder: "13" },
  { key: "active_clients", label: "Clientes activos", type: "number", placeholder: "60" },
];

const CONTACT_DEFS: SettingDef[] = [
  { key: "whatsapp_number", label: "Número de WhatsApp", type: "text", placeholder: "573001234567 (sin +)" },
  { key: "business_email", label: "Email de contacto", type: "email", placeholder: "contacto@sarriacompany.com" },
  { key: "business_phone", label: "Teléfono visible", type: "text", placeholder: "+57 300 123 4567" },
  { key: "business_address", label: "Dirección / Zona", type: "text", placeholder: "Bogotá, Colombia" },
];

const CONTENT_DEFS: SettingDef[] = [
  {
    key: "hero_title",
    label: "Título principal (hero)",
    type: "text",
    placeholder: "Jardinería Profesional en Bogotá y La Sabana",
  },
  {
    key: "hero_subtitle",
    label: "Subtítulo del hero",
    type: "text",
    placeholder: "Diseño y mantenimiento de zonas verdes...",
  },
  {
    key: "footer_tagline",
    label: "Frase del footer",
    type: "text",
    placeholder: "Cuidamos los espacios que importan",
  },
];

function FieldRow({
  def,
  value,
  onChange,
  onSave,
  saving,
  saved,
}: {
  def: SettingDef;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={def.key}>{def.label}</Label>
        <Input
          id={def.key}
          type={def.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
        />
      </div>
      <Button
        size="sm"
        onClick={onSave}
        disabled={saving}
        variant={saved ? "secondary" : "default"}
        className="shrink-0"
      >
        {saved ? "✓ Guardado" : saving ? "..." : "Guardar"}
      </Button>
    </div>
  );
}

export default function SettingsPanel() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then((settings) => {
        const map: Record<string, string> = {};
        for (const s of settings) map[s.key] = s.value;
        setValues(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  async function save(key: string) {
    setSaving(key);
    try {
      await updateSetting(key, values[key] ?? "");
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Cargando configuración...</div>;
  }

  const renderGroup = (defs: SettingDef[]) =>
    defs.map((def) => (
      <FieldRow
        key={def.key}
        def={def}
        value={values[def.key] ?? ""}
        onChange={set(def.key)}
        onSave={() => save(def.key)}
        saving={saving === def.key}
        saved={saved === def.key}
      />
    ));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración General</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edita la información clave del sitio web. Los cambios se aplican en tiempo real.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Estadísticas del homepage</CardTitle>
          <CardDescription>
            Estos números aparecen en la barra de estadísticas del sitio principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{renderGroup(STATS_DEFS)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📞 Contacto y comunicación</CardTitle>
          <CardDescription>Datos de contacto mostrados en el sitio y usados en botones de WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{renderGroup(CONTACT_DEFS)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">✏️ Contenido del sitio</CardTitle>
          <CardDescription>Textos editables de las secciones principales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{renderGroup(CONTENT_DEFS)}</CardContent>
      </Card>
    </div>
  );
}
