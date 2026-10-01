import assert from "node:assert/strict";
import test from "node:test";
import {
  AssistantActionTokenError,
  createAssistantActionToken,
  createAssistantUserId,
  verifyAssistantActionToken,
} from "../lib/assistant-action-token";

const secret = "a".repeat(64);
const otherSecret = "b".repeat(64);
const now = Date.UTC(2026, 8, 25, 0, 0, 0);

test("cria e valida um token com usuário, audiência e escopo", () => {
  const { token, expiresAt } = createAssistantActionToken({
    userId: "user-owner",
    secret,
    scopes: ["items:read", "items:pause"],
    ttlSeconds: 600,
    now,
  });

  const claims = verifyAssistantActionToken(token, {
    secret,
    requiredScope: "items:pause",
    now: now + 30_000,
  });

  assert.equal(claims.sub, "user-owner");
  assert.equal(claims.aud, "reuse-assistant-actions");
  assert.deepEqual(claims.scopes, ["items:read", "items:pause"]);
  assert.equal(expiresAt, "2026-09-25T00:10:00.000Z");
});

test("rejeita token adulterado ou assinado por outro segredo", () => {
  const { token } = createAssistantActionToken({
    userId: "user-owner",
    secret,
    now,
  });

  const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;

  assert.throws(
    () =>
      verifyAssistantActionToken(tampered, {
        secret,
        requiredScope: "items:read",
        now,
      }),
    (error) =>
      error instanceof AssistantActionTokenError &&
      error.code === "invalid_signature"
  );

  assert.throws(
    () =>
      verifyAssistantActionToken(token, {
        secret: otherSecret,
        requiredScope: "items:read",
        now,
      }),
    (error) =>
      error instanceof AssistantActionTokenError &&
      error.code === "invalid_signature"
  );
});

test("rejeita token expirado", () => {
  const { token } = createAssistantActionToken({
    userId: "user-owner",
    secret,
    ttlSeconds: 60,
    now,
  });

  assert.throws(
    () =>
      verifyAssistantActionToken(token, {
        secret,
        requiredScope: "items:read",
        now: now + 60_000,
      }),
    (error) =>
      error instanceof AssistantActionTokenError && error.code === "expired"
  );
});

test("rejeita ação fora do escopo concedido", () => {
  const { token } = createAssistantActionToken({
    userId: "user-owner",
    secret,
    scopes: ["items:read"],
    now,
  });

  assert.throws(
    () =>
      verifyAssistantActionToken(token, {
        secret,
        requiredScope: "items:pause",
        now,
      }),
    (error) =>
      error instanceof AssistantActionTokenError &&
      error.code === "insufficient_scope"
  );
});

test("gera identificador estável sem expor o ID interno", () => {
  const first = createAssistantUserId("internal-user-id", secret);
  const second = createAssistantUserId("internal-user-id", secret);

  assert.equal(first, second);
  assert.match(first, /^reuse_[A-Za-z0-9_-]{32}$/);
  assert.equal(first.includes("internal-user-id"), false);
});
