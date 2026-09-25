import assert from "node:assert/strict";
import test from "node:test";
import { createAssistantActionToken } from "../lib/assistant-action-token";
import {
  AssistantRequestAuthError,
  authorizeAssistantAction,
} from "../lib/assistant-request-auth";

const actionSecret = "c".repeat(64);
const extensionKey = "d".repeat(64);
const now = Date.UTC(2026, 8, 25, 0, 0, 0);

function headersFor(token?: string, key = extensionKey) {
  const headers = new Headers({
    "X-ReUse-Extension-Key": key,
  });

  if (token) headers.set("X-ReUse-Action-Token", token);
  return headers;
}

test("autoriza extensão e token válidos", () => {
  const { token } = createAssistantActionToken({
    userId: "owner-1",
    secret: actionSecret,
    scopes: ["items:pause"],
    now,
  });

  const claims = authorizeAssistantAction({
    headers: headersFor(token),
    requiredScope: "items:pause",
    extensionKey,
    actionSecret,
    now,
  });

  assert.equal(claims.sub, "owner-1");
});

test("rejeita chave da extensão incorreta", () => {
  const { token } = createAssistantActionToken({
    userId: "owner-1",
    secret: actionSecret,
    now,
  });

  assert.throws(
    () =>
      authorizeAssistantAction({
        headers: headersFor(token, "x".repeat(64)),
        requiredScope: "items:pause",
        extensionKey,
        actionSecret,
        now,
      }),
    (error) =>
      error instanceof AssistantRequestAuthError &&
      error.code === "invalid_extension_key" &&
      error.status === 401
  );
});

test("rejeita requisição sem token de ação", () => {
  assert.throws(
    () =>
      authorizeAssistantAction({
        headers: headersFor(),
        requiredScope: "items:read",
        extensionKey,
        actionSecret,
        now,
      }),
    (error) =>
      error instanceof AssistantRequestAuthError &&
      error.code === "missing_action_token" &&
      error.status === 401
  );
});

test("diferencia token sem escopo de token inválido", () => {
  const { token } = createAssistantActionToken({
    userId: "owner-1",
    secret: actionSecret,
    scopes: ["items:read"],
    now,
  });

  assert.throws(
    () =>
      authorizeAssistantAction({
        headers: headersFor(token),
        requiredScope: "items:reactivate",
        extensionKey,
        actionSecret,
        now,
      }),
    (error) =>
      error instanceof AssistantRequestAuthError &&
      error.code === "insufficient_scope" &&
      error.status === 403
  );
});
