import { randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { isAllowedOrigin } from "../config.js";
import { getSessionUserId } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  createAssistantActionToken,
  resolveAssistantActionSecret,
} from "../lib/assistant/assistant-action-token.js";
import {
  getOwnedItemsSummary,
  pauseOwnedAvailableItems,
  reactivateOwnedPausedItems,
} from "../lib/assistant/assistant-item-actions.js";
import {
  AssistantRequestAuthError,
  authorizeAssistantAction,
} from "../lib/assistant/assistant-request-auth.js";
import {
  createAssistantWebChatIdentityToken,
  resolveAssistantWebChatIbmPublicKey,
  resolveAssistantWebChatPrivateKey,
  type AssistantWebChatUserPayload,
} from "../lib/assistant/assistant-web-chat-token.js";
import { createPrismaAssistantItemStore } from "../lib/assistant/prisma-assistant-item-store.js";

/**
 * Integração com o IBM watsonx Assistant (Web Chat + extensão personalizada).
 * - POST /api/assistant/session: JWT de identidade do Web Chat (RS256) com payload privado criptografado.
 * - /api/assistant/actions/items/*: ações chamadas pela extensão da IBM com X-ReUse-Extension-Key + token curto.
 */
export const assistantRouter = Router();

const ASSISTANT_VISITOR_COOKIE = "reuse_assistant_visitor";
const ASSISTANT_VISITOR_MAX_AGE_MS = 60 * 60 * 24 * 45 * 1000;
const ASSISTANT_VISITOR_ID_PATTERN = /^reuse_anon_[A-Za-z0-9_-]{24,64}$/;

function assistantJson(res: Response, data: unknown, status = 200) {
  res.set("Cache-Control", "private, no-store");
  res.set("Referrer-Policy", "no-referrer");
  res.status(status).json(data);
}

function isTrustedSessionOrigin(req: Request) {
  const origin = req.get("origin");
  if (!origin) return true;
  if (isAllowedOrigin(origin)) return true;

  try {
    const host = req.get("x-forwarded-host") ?? req.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getAnonymousSubject(req: Request) {
  const stored = (req.cookies as Record<string, string> | undefined)?.[ASSISTANT_VISITOR_COOKIE];

  if (stored && ASSISTANT_VISITOR_ID_PATTERN.test(stored)) {
    return { subject: stored, shouldSetCookie: false };
  }

  return {
    subject: `reuse_anon_${randomBytes(18).toString("base64url")}`,
    shouldSetCookie: true,
  };
}

assistantRouter.post("/session", async (req, res) => {
  if (!isTrustedSessionOrigin(req)) {
    assistantJson(res, { error: "forbidden", message: "Origem da requisição não permitida." }, 403);
    return;
  }

  try {
    const userId = getSessionUserId(req);
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } })
      : null;
    const anonymous = getAnonymousSubject(req);
    const privateKey = resolveAssistantWebChatPrivateKey();
    const ibmPublicKey = resolveAssistantWebChatIbmPublicKey();
    const userPayload: AssistantWebChatUserPayload = {
      reuse_authenticated: Boolean(user),
    };
    const subject = anonymous.subject;
    let displayName: string | undefined;

    if (user) {
      const secret = resolveAssistantActionSecret();
      const actionToken = createAssistantActionToken({ userId: user.id, secret });

      displayName = user.name.split(" ")[0];
      userPayload.reuse_action_token = actionToken.token;
      userPayload.reuse_token_expires_at = actionToken.expiresAt;
      userPayload.reuse_user_name = displayName;
    }

    const identity = createAssistantWebChatIdentityToken({
      subject,
      privateKey,
      ibmPublicKey,
      userPayload,
    });

    if (anonymous.shouldSetCookie) {
      res.cookie(ASSISTANT_VISITOR_COOKIE, anonymous.subject, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ASSISTANT_VISITOR_MAX_AGE_MS,
      });
    }

    assistantJson(res, {
      identityToken: identity.token,
      expiresAt: identity.expiresAt,
      authenticated: Boolean(user),
      ...(displayName ? { displayName } : {}),
    });
  } catch (error) {
    console.error("Erro ao criar identidade do Assistant:", error);
    assistantJson(
      res,
      { error: "assistant_not_configured", message: "O assistente ainda não está configurado neste ambiente." },
      503
    );
  }
});

function headersOf(req: Request): Pick<Headers, "get"> {
  return { get: (name: string) => req.get(name) ?? null };
}

function sendActionError(res: Response, error: unknown) {
  if (error instanceof AssistantRequestAuthError) {
    if (error.code === "configuration_error") {
      console.error("Configuração da extensão do Assistant incompleta.");
      assistantJson(
        res,
        { ok: false, error: "assistant_not_configured", message: "A integração do assistente ainda não está configurada." },
        503
      );
      return;
    }

    if (error.code === "insufficient_scope") {
      assistantJson(res, { ok: false, error: "forbidden", message: "Esta sessão não tem permissão para executar a ação." }, 403);
      return;
    }

    assistantJson(
      res,
      { ok: false, error: error.code, message: "Sua sessão expirou. Entre novamente no ReUse e reabra o chat." },
      401
    );
    return;
  }

  console.error("Erro na ação do Assistant:", error);
  assistantJson(
    res,
    { ok: false, error: "internal_error", message: "Não foi possível concluir a ação agora. Tente novamente." },
    500
  );
}

assistantRouter.get("/actions/items/summary", async (req, res) => {
  try {
    const claims = authorizeAssistantAction({ headers: headersOf(req), requiredScope: "items:read" });
    const summary = await getOwnedItemsSummary(createPrismaAssistantItemStore(prisma), claims.sub);
    const plural = (count: number, singular: string, pluralForm: string) => (count === 1 ? singular : pluralForm);

    assistantJson(res, {
      ok: true,
      ...summary,
      message:
        summary.total === 0
          ? "Você ainda não publicou nenhum anúncio."
          : `Você tem ${summary.total} ${plural(summary.total, "anúncio", "anúncios")}: ${summary.counts.available} ${plural(summary.counts.available, "disponível", "disponíveis")} e ${summary.counts.paused} ${plural(summary.counts.paused, "pausado", "pausados")}.`,
    });
  } catch (error) {
    sendActionError(res, error);
  }
});

assistantRouter.post("/actions/items/pause", async (req, res) => {
  try {
    const claims = authorizeAssistantAction({ headers: headersOf(req), requiredScope: "items:pause" });
    assistantJson(res, await pauseOwnedAvailableItems(createPrismaAssistantItemStore(prisma), claims.sub));
  } catch (error) {
    sendActionError(res, error);
  }
});

assistantRouter.post("/actions/items/reactivate", async (req, res) => {
  try {
    const claims = authorizeAssistantAction({ headers: headersOf(req), requiredScope: "items:reactivate" });
    assistantJson(res, await reactivateOwnedPausedItems(createPrismaAssistantItemStore(prisma), claims.sub));
  } catch (error) {
    sendActionError(res, error);
  }
});
