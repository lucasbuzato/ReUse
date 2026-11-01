import { cookies } from "next/headers";
import { cache } from "react";
import type { InterestPanelData } from "./interest-types";
import type { Category, CurrentUser, Item, MyInterest, Stats } from "./types";

/**
 * Cliente da API usado pelos Server Components. No navegador as chamadas usam
 * /api/* (reescrito para o backend no next.config.js); aqui no servidor falamos
 * direto com o backend e repassamos só o cookie de sessão do ReUse!.
 */
const DEFAULT_BACKEND_URL = "https://reuse-api-lucasbuzatos-projects.vercel.app";
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? DEFAULT_BACKEND_URL : "http://localhost:4000")
).replace(/\/$/, "");

const SESSION_COOKIE = "reuse_session";
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function sessionHeader(): Promise<Record<string, string>> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  return session ? { cookie: `${SESSION_COOKIE}=${session}` } : {};
}

async function apiGet<T>(path: string, { auth = false }: { auth?: boolean } = {}): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: { accept: "application/json", ...(auth ? await sessionHeader() : {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, body?.error ?? `Falha ao consultar a API (${response.status}).`);
  }

  return (await response.json()) as T;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    const data = await apiGet<{ user: CurrentUser | null }>("/api/users/me", { auth: true });
    return data.user;
  } catch {
    return null;
  }
});

export const getStats = cache(() => apiGet<Stats>("/api/stats"));

export const getCategories = cache(() => apiGet<Category[]>("/api/categories"));

export function getItems(params: { q?: string; category?: string; limit?: number; status?: string } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.status) search.set("status", params.status);
  if (params.limit) search.set("limit", String(params.limit));
  const suffix = search.toString();
  return apiGet<Item[]>(`/api/items${suffix ? `?${suffix}` : ""}`);
}

export const getItem = cache(async (id: string): Promise<Item | null> => {
  try {
    return await apiGet<Item>(`/api/items/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
});

export function getInterestPanel(itemId: string) {
  return apiGet<InterestPanelData>(`/api/items/${encodeURIComponent(itemId)}/interests`, { auth: true });
}

export function getMyItems() {
  return apiGet<Item[]>("/api/users/me/items", { auth: true });
}

export function getMyInterests() {
  return apiGet<MyInterest[]>("/api/users/me/interests", { auth: true });
}
