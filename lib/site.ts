/** URLs públicas usadas em metadados e links. */
const DEFAULT_SITE_URL = "https://reuse-alpha.vercel.app";

function withProtocol(host: string | undefined) {
  if (!host) return undefined;
  return host.startsWith("http") ? host : `https://${host}`;
}

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production" ? DEFAULT_SITE_URL : withProtocol(process.env.VERCEL_URL)) ||
  (process.env.NODE_ENV === "production" ? DEFAULT_SITE_URL : "http://localhost:3000")
).replace(/\/$/, "");

/**
 * Caminhos públicos da API no mesmo domínio do site. Na Vercel o vercel.json
 * envia estes caminhos para o serviço "api"; localmente o next.config.js
 * encaminha para a API em http://localhost:4000.
 */
export const backendLinks = {
  docs: "/api/docs",
  admin: "/admin",
  health: "/health",
} as const;

export const siteName = "ReUse!";
export const siteDescription =
  "Plataforma colaborativa para doar e trocar objetos em bom estado com pessoas da sua região. Gratuita, sem intermediários e com foco em economia circular.";
