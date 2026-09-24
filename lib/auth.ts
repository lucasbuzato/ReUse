import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "reuse_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function resolveAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET precisa ser configurado em produção.");
  }

  return "reuse-local-development-only";
}

const AUTH_SECRET = resolveAuthSecret();

type SessionPayload = { userId: string; expiresAt: number };

function sign(value: string) {
  return createHmac("sha256", AUTH_SECRET).update(value).digest("base64url");
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

export function createSession(userId: string) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function readSession(token?: string): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
    if (!payload.userId || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return readSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.userId ?? null;
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, createSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
