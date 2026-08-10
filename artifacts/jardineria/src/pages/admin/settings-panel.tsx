import { useState, useEffect } from "react";
import { getSettings, updateSetting, getAdminLandingPages } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import ColorPicker from "@/components/admin/color-picker";
import ImageUpload from "@/components/admin/image-upload";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";

interface CustomSegment {
  label: string;
  slug: string;
}

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

const STORE_COLOR_DEFS: { key: string; label: string }[] = [
  { key: "color_store_primary", label: "Color primario de la tienda" },
  { key: "color_store_secondary", label: "Color secundario de la tienda" },
];

const VISIBILITY_TOGGLES = [
  {
    key: "show_portfolio_section",
    label: "Sección de Portafolio",
    description: "Muestra u oculta la galería de proyectos en la página principal.",
  },
  {
    key: "show_quote_form",
    label: "Formulario de Cotización",
    description: "Muestra u oculta el formulario de solicitud de cotización al fondo del home.",
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

function parseCustomSegments(raw: string | undefined): CustomSegment[] {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

export default function SettingsPanel() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [landingPages, setLandingPages] = useState<{ id: number; title: string; slug: string }[]>([]);
  const [customSegments, setCustomSegments] = useState<CustomSegment[]>([]);
  const [savingCustom, setSavingCustom] = useState(false);
  const [savedCustom, setSavedCustom] = useState(false);

  useEffect(() => {
    Promise.all([
      getSettings().then((settings) => {
        const map: Record<string, string> = {};
        for (const s of settings) map[s.key] = s.value;
        setValues(map);
        setCustomSegments(parseCustomSegments(map["segment_custom_links"]));
      }),
      getAdminLandingPages()
        .then((pages: any[]) => setLandingPages(pages.filter((p) => p.active)))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function saveCustomSegments(segments: CustomSegment[]) {
    setSavingCustom(true);
    try {
      await updateSetting("segment_custom_links", JSON.stringify(segments));
      setSavedCustom(true);
      setTimeout(() => setSavedCustom(false), 2500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCustom(false);
    }
  }

  function addCustomSegment() {
    setCustomSegments((prev) => [...prev, { label: "", slug: "" }]);
  }

  function updateCustomSegment(i: number, patch: Partial<CustomSegment>) {
    setCustomSegments((prev) => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }

  function removeCustomSegment(i: number) {
    const next = customSegments.filter((_, idx) => idx !== i);
    setCustomSegments(next);
    saveCustomSegments(next);
  }

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

  async function saveToggle(key: string, checked: boolean) {
    const val = checked ? "true" : "false";
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaving(key);
    try {
      await updateSetting(key, val);
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
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

      {/* Visibility Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Visibilidad de secciones (Home)
          </CardTitle>
          <CardDescription>
            Activa o desactiva secciones de la página principal con un solo clic. El cambio aplica de inmediato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {VISIBILITY_TOGGLES.map((toggle) => {
            const isOn = (values[toggle.key] ?? "true") !== "false";
            return (
              <div key={toggle.key} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isOn ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    <p className="text-sm font-medium">{toggle.label}</p>
                    {saved === toggle.key && (
                      <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-6">{toggle.description}</p>
                </div>
                <Switch
                  checked={isOn}
                  disabled={saving === toggle.key}
                  onCheckedChange={(v) => saveToggle(toggle.key, v)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">🖼️ Imagen de fondo del hero</CardTitle>
          <CardDescription>
            Imagen que aparece detrás del título "{values["hero_title"] || "Jardinería Profesional..."}" en la portada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {values["hero_image_url"] && (
            <img
              src={values["hero_image_url"]}
              alt="Vista previa hero"
              className="w-full h-40 object-cover rounded-lg border border-border"
            />
          )}
          <div className="flex gap-3 items-center">
            <ImageUpload
              accept="image/*"
              label="Subir imagen del hero"
              onUploaded={(url) => {
                set("hero_image_url")(url);
                updateSetting("hero_image_url", url).catch((err) => alert(err.message));
              }}
            />
            {saving === "hero_image_url" && <span className="text-xs text-muted-foreground">Guardando...</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">🎨 Colores, tipografía, botones y logo</CardTitle>
          <CardDescription>
            Los colores generales, la tipografía, los botones y el tamaño del logo ahora se editan en la
            pestaña <strong>Editor Visual</strong>, donde puedes ver una vista previa en vivo antes de
            guardar.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">🛍️ Colores de la tienda</CardTitle>
          <CardDescription>
            Colores exclusivos de la página de Tienda. Si se dejan vacíos, se usan los colores generales del sitio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {STORE_COLOR_DEFS.map((def) => (
            <div key={def.key} className="flex gap-3 items-end">
              <div className="flex-1">
                <ColorPicker
                  id={def.key}
                  label={def.label}
                  value={values[def.key] ?? ""}
                  onChange={set(def.key)}
                />
              </div>
              <Button
                size="sm"
                onClick={() => save(def.key)}
                disabled={saving === def.key}
                variant={saved === def.key ? "secondary" : "default"}
                className="shrink-0"
              >
                {saved === def.key ? "✓ Guardado" : saving === def.key ? "..." : "Guardar"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Segment → Landing Page links ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔗 Vinculación de sectores con Landing Pages</CardTitle>
          <CardDescription>
            Asocia cada tarjeta de "Entendemos Su Negocio" con una landing page. Al hacer clic en la tarjeta, el visitante será redirigido a esa página.
            {landingPages.length === 0 && (
              <span className="block mt-1 text-amber-600 font-medium">
                No hay landing pages activas aún. Crea una en el panel de Landing Pages.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "segment_conjuntos_landing", label: "Conjuntos Residenciales" },
            { key: "segment_colegios_landing",  label: "Colegios e Instituciones" },
            { key: "segment_edificios_landing", label: "Edificios de Oficinas" },
            { key: "segment_centros_landing",   label: "Centros Comerciales" },
          ].map(({ key, label }) => (
            <div key={key} className="flex gap-3 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium" htmlFor={key}>{label}</label>
                <select
                  id={key}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={values[key] ?? ""}
                  onChange={(e) => set(key)(e.target.value)}
                >
                  <option value="">(sin landing page vinculada)</option>
                  {landingPages.map((lp) => (
                    <option key={lp.slug} value={lp.slug}>
                      {lp.title} — /clientes/{lp.slug}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                onClick={() => save(key)}
                disabled={saving === key}
                variant={saved === key ? "secondary" : "default"}
                className="shrink-0"
              >
                {saved === key ? "✓ Guardado" : saving === key ? "..." : "Guardar"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
