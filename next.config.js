/**
 * Frontend do ReUse!. Toda chamada para /api/* é encaminhada para a API Node.js
 * (projeto separado na Vercel). Assim o navegador fala só com este domínio:
 * os cookies de sessão continuam first-party e as URLs antigas (inclusive as
 * usadas pela extensão do IBM watsonx Assistant) continuam funcionando.
 */
const DEFAULT_BACKEND_URL = "https://reuse-api-lucasbuzatos-projects.vercel.app";

const backendUrl = (
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? DEFAULT_BACKEND_URL : "http://localhost:4000")
).replace(/\/$/, "");

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
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
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
