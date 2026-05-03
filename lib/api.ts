// lib/api.ts
// All HTTP calls go through the shared axiosInstance which handles:
//   - baseURL resolution (browser vs. SSR)
//   - Authorization header injection
//   - Unified error normalisation
//
// Re-export API_BASE and getWsURL so existing imports still work.

import axiosInstance, { API_BASE } from "./axiosInstance";

export { API_BASE };

export type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean; // kept for backward-compat (token is attached by interceptor)
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export async function api<T = any>(
  path: string,
  opts: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, params, headers } = opts;

  const response = await axiosInstance.request<T>({
    url: path,
    method,
    data: body,
    params,
    headers,
  });

  return response.data;
}

export function getWsURL(): string {
  if (typeof window === "undefined") return "";
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
  const tok = localStorage.getItem("di_eqa_token") || "";
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/api/ws?token=${encodeURIComponent(tok)}`;
}
