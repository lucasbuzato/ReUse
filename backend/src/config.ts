const isProduction = process.env.NODE_ENV === "production";

const DEFAULT_FRONTEND_URL = "https://reuse-alpha.vercel.app";

/** Origens públicas conhecidas do frontend (produção e domínio do time na Vercel). */
const KNOWN_FRONTEND_ORIGINS = [
  DEFAULT_FRONTEND_URL,
  "https://reuse-lucasbuzatos-projects.vercel.app",
];

/** Deploys de preview do frontend na Vercel (ex.: reuse-git-branch-lucasbuzatos-projects.vercel.app). */
const PREVIEW_ORIGIN_PATTERN = /^https:\/\/reuse-[a-z0-9-]+-lucasbuzatos-projects\.vercel\.app$/;

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const frontendUrl = (process.env.FRONTEND_URL ?? (isProduction ? DEFAULT_FRONTEND_URL : "http://localhost:3000")).replace(/\/$/, "");

const allowedOrigins = new Set([
  frontendUrl,
  ...KNOWN_FRONTEND_ORIGINS,
  ...splitList(process.env.CORS_ORIGINS),
  ...(isProduction ? [] : ["http://localhost:3000", "http://127.0.0.1:3000"]),
]);

export const config = {
  isProduction,
  isVercel: Boolean(process.env.VERCEL),
  port: Number(process.env.PORT ?? 4000),
  version: "2.0.0",
  frontendUrl,
};

export function isAllowedOrigin(origin: string | undefined | null) {
  if (!origin) return false;
  const normalized = origin.replace(/\/$/, "");
  return allowedOrigins.has(normalized) || PREVIEW_ORIGIN_PATTERN.test(normalized);
}

/** URL pública deste backend (usada em links da documentação e do painel). */
export function resolvePublicBaseUrl(fallbackHost?: string) {
  if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (fallbackHost) return `${isProduction ? "https" : "http"}://${fallbackHost}`;
  return `http://localhost:${config.port}`;
}
