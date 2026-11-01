/**
 * Frontend do ReUse!.
 *
 * Na Vercel, site e API ficam no mesmo projeto ("reuse") com Vercel Services:
 * o vercel.json envia /api, /admin e /health para o serviço "api" (pasta
 * backend/) antes de a requisição chegar ao Next.js. Assim o navegador fala só
 * com um domínio, os cookies de sessão continuam first-party e as URLs usadas
 * pela extensão do IBM watsonx Assistant continuam iguais.
 *
 * Fora da Vercel (npm run dev / npm start), o próprio Next.js faz esse
 * encaminhamento para a API local (BACKEND_URL, padrão http://localhost:4000).
 */
const backendUrl = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
const proxyToLocalBackend = !process.env.VERCEL;

const backendPaths = ["/api/:path*", "/admin/:path*", "/admin-assets/:path*", "/brand/:path*", "/health"];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    if (!proxyToLocalBackend) return [];
    return backendPaths.map((source) => ({ source, destination: `${backendUrl}${source}` }));
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/seed/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

module.exports = nextConfig;
