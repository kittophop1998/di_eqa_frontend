// Frontend talks to the backend through Next.js's same-origin so we don't need
// to expose a public hostname. We use the rewrites in next.config when needed,
// but here we reference the public URL via env. In Docker we route browser
// requests directly to the backend on its host port.

export const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080")
    : (process.env.API_BASE || "http://backend:8080");

export type ApiOptions = RequestInit & { auth?: boolean };

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", "application/json");
  if (opts.auth !== false && typeof window !== "undefined") {
    const tok = localStorage.getItem("di_eqa_token");
    if (tok) headers.set("Authorization", `Bearer ${tok}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep raw */ }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export function getWsURL(): string {
  if (typeof window === "undefined") return "";
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
  const tok = localStorage.getItem("di_eqa_token") || "";
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/api/ws?token=${encodeURIComponent(tok)}`;
}
