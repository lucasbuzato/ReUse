/** URLs públicas usadas em metadados, rodapé e links para o backend. */
const DEFAULT_SITE_URL = "https://reuse-alpha.vercel.app";
const DEFAULT_BACKEND_URL = "https://reuse-api-lucasbuzatos-projects.vercel.app";

function withProtocol(host: string | undefined) {
  if (!host) return undefined;
  return host.startsWith("http") ? host : `https://${host}`;
}

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production" ? DEFAULT_SITE_URL : withProtocol(process.env.VERCEL_URL)) ||
  (process.env.NODE_ENV === "production" ? DEFAULT_SITE_URL : "http://localhost:3000")
).replace(/\/$/, "");

/** Endereço público da API (documentação, health check e painel administrativo). */
export const backendPublicUrl = (
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? DEFAULT_BACKEND_URL : "http://localhost:4000")
).replace(/\/$/, "");

export const siteName = "ReUse!";
export const siteDescription =
  "Plataforma colaborativa para doar e trocar objetos em bom estado com pessoas da sua região. Gratuita, sem intermediários e com foco em economia circular.";
