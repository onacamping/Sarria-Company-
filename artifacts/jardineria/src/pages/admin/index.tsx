import { useState, useEffect } from "react";
import { adminMe, clearToken, getToken } from "@/lib/admin-api";
import Login from "./login";
import Dashboard from "./dashboard";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthenticated(false);
      return;
    }
    adminMe()
      .then(() => setAuthenticated(true))
      .catch(() => {
        clearToken();
        setAuthenticated(false);
      });
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setAuthenticated(false)} />;
}
