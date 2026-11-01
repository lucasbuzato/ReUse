import type { NextFunction, Request, RequestHandler, Response } from "express";
import { Prisma } from "@prisma/client";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Encaminha erros de handlers assíncronos para o middleware de erro do Express 4. */
export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export function noStore(res: Response) {
  res.set("Cache-Control", "private, no-store");
}

export function publicCache(res: Response, seconds: number) {
  res.set("Cache-Control", `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 5}`);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "Rota não encontrada.", path: req.path });
}

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
    return;
  }

  if (typeof error === "object" && error && "type" in error && error.type === "entity.parse.failed") {
    res.status(400).json({ error: "JSON inválido no corpo da requisição." });
    return;
  }

  if (typeof error === "object" && error && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({ error: "Corpo da requisição muito grande." });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    res.status(404).json({ error: "Registro não encontrado." });
    return;
  }

  console.error("Erro não tratado na API:", error);
  res.status(500).json({ error: "Erro interno do servidor." });
}
