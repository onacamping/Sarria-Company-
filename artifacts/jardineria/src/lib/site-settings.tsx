import { createContext, useContext, useEffect, useState } from "react";

export interface SiteSettings {
  [key: string]: string;
}

const SettingsContext = createContext<SiteSettings>({});

export function useSettings() {
  return useContext(SettingsContext);
}

const base = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const CSS_VAR_MAP: Record<string, string> = {
  color_primary: "--primary",
  color_secondary: "--secondary",
  color_heading_text: "--color-heading-text",
  color_body_text: "--color-body-text",
  btn_primary_bg: "--btn-primary-bg",
  btn_primary_text: "--btn-primary-text",
  btn_secondary_bg: "--btn-secondary-bg",
  btn_secondary_text: "--btn-secondary-text",
  logo_size: "--logo-size",
  logo_size_footer: "--logo-size-footer",
};

const FONT_VAR_MAP: Record<string, string> = {
  font_heading: "--font-heading",
  font_subheading: "--font-subheading",
  font_body: "--font-body",
};

function applySettingsToRoot(data: SiteSettings) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = data[key];
    if (value) {
      root.style.setProperty(cssVar, key === "logo_size" || key === "logo_size_footer" ? `${value}px` : value);
    }
  }
  for (const [key, cssVar] of Object.entries(FONT_VAR_MAP)) {
    const value = data[key];
    if (value) root.style.setProperty(cssVar, `'${value}', sans-serif`);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    fetch(`${base()}/api/settings`)
      .then((r) => r.json())
      .then((data: SiteSettings) => {
        setSettings(data);
        applySettingsToRoot(data);
      })
      .catch(() => {});
  }, []);

  // Allows the admin "Editor Visual" (running in an iframe preview) to push
  // draft style changes for a live WYSIWYG preview without persisting them.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      if (!msg || msg.type !== "sarria-style-preview") return;
      applySettingsToRoot({ ...settings, ...msg.draft });
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [settings]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}
