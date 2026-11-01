import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const ASSISTANT_ACTION_AUDIENCE = "reuse-assistant-actions";
export const ASSISTANT_ACTION_TOKEN_TTL_SECONDS = 10 * 60;

export const ASSISTANT_ACTION_SCOPES = [
  "items:read",
  "items:pause",
  "items:reactivate",
] as const;

export type AssistantActionScope = (typeof ASSISTANT_ACTION_SCOPES)[number];

export type AssistantActionClaims = {
  version: 1;
  sub: string;
  aud: typeof ASSISTANT_ACTION_AUDIENCE;
  scopes: AssistantActionScope[];
  iat: number;
  exp: number;
  jti: string;
};

type CreateTokenOptions = {
  userId: string;
  secret: string;
  scopes?: AssistantActionScope[];
  ttlSeconds?: number;
  now?: number;
};

type VerifyTokenOptions = {
  secret: string;
  requiredScope: AssistantActionScope;
  now?: number;
};

export type AssistantActionTokenErrorCode =
  | "invalid_format"
  | "invalid_signature"
  | "invalid_claims"
  | "expired"
  | "not_yet_valid"
  | "insufficient_scope";

export class AssistantActionTokenError extends Error {
  constructor(public readonly code: AssistantActionTokenErrorCode) {
    super(code);
    this.name = "AssistantActionTokenError";
  }
}

function nowInSeconds(now = Date.now()) {
  return Math.floor(now / 1000);
}

function assertSecret(secret: string) {
  if (secret.length < 32) {
    throw new Error("O segredo de ações do Assistant deve ter ao menos 32 caracteres.");
  }
}

function encodePayload(payload: AssistantActionClaims) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signaturesMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function isScope(value: unknown): value is AssistantActionScope {
  return (
    typeof value === "string" &&
    ASSISTANT_ACTION_SCOPES.includes(value as AssistantActionScope)
  );
}

function parseClaims(encoded: string): AssistantActionClaims {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as Partial<AssistantActionClaims>;

    if (
      parsed.version !== 1 ||
      typeof parsed.sub !== "string" ||
      parsed.sub.length === 0 ||
      parsed.aud !== ASSISTANT_ACTION_AUDIENCE ||
      !Array.isArray(parsed.scopes) ||
      !parsed.scopes.every(isScope) ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.jti !== "string" ||
      parsed.jti.length < 16
    ) {
      throw new AssistantActionTokenError("invalid_claims");
    }

    return parsed as AssistantActionClaims;
  } catch (error) {
    if (error instanceof AssistantActionTokenError) throw error;
    throw new AssistantActionTokenError("invalid_claims");
  }
}

export function resolveAssistantActionSecret() {
  const secret = process.env.ASSISTANT_ACTION_SECRET;

  if (secret) {
    assertSecret(secret);
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ASSISTANT_ACTION_SECRET precisa ser configurado em produção.");
  }

  return "reuse-assistant-local-development-only-change-me";
}

export function createAssistantActionToken({
  userId,
  secret,
  scopes = [...ASSISTANT_ACTION_SCOPES],
  ttlSeconds = ASSISTANT_ACTION_TOKEN_TTL_SECONDS,
  now = Date.now(),
}: CreateTokenOptions) {
  assertSecret(secret);

  if (!userId) throw new Error("userId é obrigatório.");
  if (ttlSeconds < 60 || ttlSeconds > 15 * 60) {
    throw new Error("A validade do token deve ficar entre 60 e 900 segundos.");
  }

  const issuedAt = nowInSeconds(now);
  const claims: AssistantActionClaims = {
    version: 1,
    sub: userId,
    aud: ASSISTANT_ACTION_AUDIENCE,
    scopes: [...new Set(scopes)],
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    jti: randomBytes(16).toString("base64url"),
  };

  const encoded = encodePayload(claims);
  const signedValue = `v1.${encoded}`;

  return {
    token: `${signedValue}.${sign(signedValue, secret)}`,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
    claims,
  };
}

export function verifyAssistantActionToken(
  token: string,
  { secret, requiredScope, now = Date.now() }: VerifyTokenOptions
) {
  assertSecret(secret);

  const [version, encoded, signature, extra] = token.split(".");
  if (version !== "v1" || !encoded || !signature || extra) {
    throw new AssistantActionTokenError("invalid_format");
  }

  const signedValue = `${version}.${encoded}`;
  if (!signaturesMatch(signature, sign(signedValue, secret))) {
    throw new AssistantActionTokenError("invalid_signature");
  }

  const claims = parseClaims(encoded);
  const currentTime = nowInSeconds(now);

  if (claims.iat > currentTime + 60) {
    throw new AssistantActionTokenError("not_yet_valid");
  }

  if (claims.exp <= currentTime) {
    throw new AssistantActionTokenError("expired");
  }

  if (!claims.scopes.includes(requiredScope)) {
    throw new AssistantActionTokenError("insufficient_scope");
  }

  return claims;
}

export function createAssistantUserId(userId: string, secret: string) {
  assertSecret(secret);
  return `reuse_${createHmac("sha256", secret)
    .update(`assistant-user:${userId}`)
    .digest("base64url")
    .slice(0, 32)}`;
}
