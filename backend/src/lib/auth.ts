import type { NextFunction, Request, Response } from "express";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { HttpError } from "./http.js";

/**
 * Sessão do usuário da plataforma: cookie httpOnly assinado com HMAC-SHA256.
 * O formato é o mesmo da versão anterior (Next.js), então sessões existentes continuam válidas.
 */
export const SESSION_COOKIE = "reuse_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function resolveAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET precisa ser configurado em produção.");
  }

  return "reuse-local-development-only";
}

type SessionPayload = { userId: string; expiresAt: number };

function sign(value: string) {
  return createHmac("sha256", resolveAuthSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function createSessionToken(userId: string) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readSessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !safeEqual(sign(encoded), signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
    if (!payload.userId || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionUserId(req: Request): string | null {
  const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
  return readSessionToken(token)?.userId ?? null;
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds * 1000,
  };
}

export function setSessionCookie(res: Response, userId: string) {
  res.cookie(SESSION_COOKIE, createSessionToken(userId), cookieOptions(SESSION_MAX_AGE_SECONDS));
}

export function clearSessionCookie(res: Response) {
  res.cookie(SESSION_COOKIE, "", cookieOptions(0));
}

/** Exige usuário autenticado; guarda o id em res.locals.userId. */
export function requireUser(message = "Faça login para continuar.") {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getSessionUserId(req);
    if (!userId) {
      next(new HttpError(401, message, "unauthenticated"));
      return;
    }
    res.locals.userId = userId;
    next();
  };
}
