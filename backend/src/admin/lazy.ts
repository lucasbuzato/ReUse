import type { NextFunction, Request, Response, Router } from "express";

// O AdminJS é carregado só na primeira requisição a /admin.
// Assim as rotas da API não pagam o custo de inicialização do painel (cold start menor).
let routerPromise: Promise<Router> | null = null;

function loadAdminRouter() {
  if (!routerPromise) {
    routerPromise = import("./setup.js").then((module) => module.buildAdminRouter());
    routerPromise.catch(() => {
      routerPromise = null;
    });
  }
  return routerPromise;
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  loadAdminRouter()
    .then((router) => router(req, res, next))
    .catch((error: unknown) => {
      console.error("Falha ao iniciar o painel administrativo:", error);
      if (!res.headersSent) {
        res.status(503).type("text").send("Painel administrativo indisponível no momento. Tente novamente em instantes.");
      }
    });
}
