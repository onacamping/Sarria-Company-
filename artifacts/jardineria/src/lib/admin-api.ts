const TOKEN_KEY = "sarria_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const base = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${base()}/api/admin${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export const adminLogin = (username: string, password: string) =>
  req<{ token: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const adminLogout = () => req("/logout", { method: "POST" });
export const adminMe = () => req<{ ok: boolean; username: string }>("/me");

export const getSettings = () =>
  req<Array<{ key: string; value: string; label: string }>>("/settings");
export const updateSetting = (key: string, value: string) =>
  req(`/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });

export const getAdminProjects = () => req<any[]>("/projects");
export const createProject = (d: any) =>
  req("/projects", { method: "POST", body: JSON.stringify(d) });
export const updateProject = (id: number, d: any) =>
  req(`/projects/${id}`, { method: "PUT", body: JSON.stringify(d) });
export const deleteProject = (id: number) =>
  req(`/projects/${id}`, { method: "DELETE" });

export const getAdminProducts = () => req<any[]>("/products");
export const createProduct = (d: any) =>
  req("/products", { method: "POST", body: JSON.stringify(d) });
export const updateProduct = (id: number, d: any) =>
  req(`/products/${id}`, { method: "PUT", body: JSON.stringify(d) });
export const deleteProduct = (id: number) =>
  req(`/products/${id}`, { method: "DELETE" });

export const getAdminQuotes = () => req<any[]>("/quotes");

export const getAdminTestimonials = () => req<any[]>("/testimonials");
export const createTestimonial = (d: any) =>
  req("/testimonials", { method: "POST", body: JSON.stringify(d) });
export const updateTestimonial = (id: number, d: any) =>
  req(`/testimonials/${id}`, { method: "PUT", body: JSON.stringify(d) });
export const deleteTestimonial = (id: number) =>
  req(`/testimonials/${id}`, { method: "DELETE" });
