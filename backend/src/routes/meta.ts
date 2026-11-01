import { Router, type Request } from "express";
import { config, resolvePublicBaseUrl } from "../config.js";
import { buildOpenApiDocument } from "../docs/openapi.js";

export const metaRouter = Router();

function baseUrl(req: Request) {
  return resolvePublicBaseUrl(req.get("x-forwarded-host") ?? req.get("host"));
}

export const API_ENDPOINTS = [
  ["GET", "/api/items", "Lista itens disponíveis (busca e filtros)"],
  ["POST", "/api/items", "Publica um item"],
  ["GET", "/api/items/:id", "Detalhe de um item"],
  ["PATCH", "/api/items/:id", "Atualiza status de um item próprio"],
  ["DELETE", "/api/items/:id", "Remove um item próprio"],
  ["GET", "/api/items/:id/interests", "Painel de interesses"],
  ["POST", "/api/items/:id/interests", "Manifesta interesse"],
  ["GET", "/api/categories", "Categorias"],
  ["GET", "/api/stats", "Números de impacto"],
  ["POST", "/api/users", "Cadastro (com UTM)"],
  ["POST", "/api/users/login", "Login"],
  ["POST", "/api/users/logout", "Logout"],
  ["GET", "/api/users/me", "Sessão atual"],
  ["GET", "/api/users/me/items", "Meus itens"],
  ["POST", "/api/assistant/session", "Identidade do IBM Web Chat"],
  ["GET", "/health", "Saúde do serviço"],
] as const;

metaRouter.get("/", (req, res) => {
  res.json({
    name: "ReUse! API",
    version: config.version,
    docs: `${baseUrl(req)}/api/docs`,
    openapi: `${baseUrl(req)}/api/openapi.json`,
    admin: `${baseUrl(req)}/admin`,
    frontend: config.frontendUrl,
    endpoints: API_ENDPOINTS.map(([method, path, description]) => ({ method, path, description })),
  });
});

metaRouter.get("/openapi.json", (req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json(buildOpenApiDocument(baseUrl(req)));
});

metaRouter.get("/docs", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.type("html").send(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ReUse! API · Documentação</title>
    <link rel="icon" href="/brand/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.76.4"></script>
    <script>
      Scalar.createApiReference("#app", {
        url: "/api/openapi.json",
        theme: "kepler",
        hideClientButton: false,
        withDefaultFonts: true,
        metaData: { title: "ReUse! API · Documentação" },
      });
    </script>
  </body>
</html>`);
});
