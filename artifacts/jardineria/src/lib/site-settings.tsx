import { createContext, useContext, useEffect, useState } from "react";

export interface SiteSettings {
  [key: string]: string;
}

const SettingsContext = createContext<SiteSettings>({});

export function useSettings() {
  return useContext(SettingsContext);
}

const base = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    fetch(`${base()}/api/settings`)
      .then((r) => r.json())
      .then((data: SiteSettings) => {
        setSettings(data);
        const root = document.documentElement;
        if (data["color_primary"]) root.style.setProperty("--primary", data["color_primary"]);
        if (data["color_secondary"]) root.style.setProperty("--secondary", data["color_secondary"]);
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}
