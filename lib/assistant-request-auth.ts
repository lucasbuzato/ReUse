import { timingSafeEqual } from "crypto";
import {
  AssistantActionTokenError,
  type AssistantActionClaims,
  type AssistantActionScope,
  resolveAssistantActionSecret,
  verifyAssistantActionToken,
} from "./assistant-action-token";

export const ASSISTANT_ACTION_TOKEN_HEADER = "x-reuse-action-token";
export const ASSISTANT_EXTENSION_KEY_HEADER = "x-reuse-extension-key";

export type AssistantRequestAuthErrorCode =
  | "configuration_error"
  | "invalid_extension_key"
  | "missing_action_token"
  | "invalid_action_token"
  | "insufficient_scope";

export class AssistantRequestAuthError extends Error {
  constructor(
    public readonly code: AssistantRequestAuthErrorCode,
    public readonly status: 401 | 403 | 503
  ) {
    super(code);
    this.name = "AssistantRequestAuthError";
  }
}

type AuthorizeOptions = {
  headers: Headers;
  requiredScope: AssistantActionScope;
  extensionKey?: string;
  actionSecret?: string;
  now?: number;
};

function secretsMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function resolveAssistantExtensionKey() {
  const key = process.env.ASSISTANT_EXTENSION_API_KEY;

  if (!key || key.length < 32) {
    throw new AssistantRequestAuthError("configuration_error", 503);
  }

  return key;
}

export function authorizeAssistantAction({
  headers,
  requiredScope,
  extensionKey,
  actionSecret,
  now,
}: AuthorizeOptions): AssistantActionClaims {
  let expectedExtensionKey: string;
  let expectedActionSecret: string;

  try {
    expectedExtensionKey = extensionKey ?? resolveAssistantExtensionKey();
    expectedActionSecret = actionSecret ?? resolveAssistantActionSecret();
  } catch (error) {
    if (error instanceof AssistantRequestAuthError) throw error;
    throw new AssistantRequestAuthError("configuration_error", 503);
  }

  const receivedExtensionKey =
    headers.get(ASSISTANT_EXTENSION_KEY_HEADER)?.trim() ?? "";

  if (
    !receivedExtensionKey ||
    !secretsMatch(receivedExtensionKey, expectedExtensionKey)
  ) {
    throw new AssistantRequestAuthError("invalid_extension_key", 401);
  }

  const actionToken = headers.get(ASSISTANT_ACTION_TOKEN_HEADER)?.trim() ?? "";
  if (!actionToken) {
    throw new AssistantRequestAuthError("missing_action_token", 401);
  }

  try {
    return verifyAssistantActionToken(actionToken, {
      secret: expectedActionSecret,
      requiredScope,
      now,
    });
  } catch (error) {
    if (
      error instanceof AssistantActionTokenError &&
      error.code === "insufficient_scope"
    ) {
      throw new AssistantRequestAuthError("insufficient_scope", 403);
    }

    throw new AssistantRequestAuthError("invalid_action_token", 401);
  }
}
