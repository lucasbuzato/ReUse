import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { assistantJson } from "@/lib/assistant-api";
import {
  createAssistantActionToken,
  createAssistantUserId,
  resolveAssistantActionSecret,
} from "@/lib/assistant-action-token";
import {
  createAssistantWebChatIdentityToken,
  resolveAssistantWebChatIbmPublicKey,
  resolveAssistantWebChatPrivateKey,
  type AssistantWebChatUserPayload,
} from "@/lib/assistant-web-chat-token";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ASSISTANT_VISITOR_COOKIE = "reuse_assistant_visitor";
const ASSISTANT_VISITOR_MAX_AGE = 60 * 60 * 24 * 45;
const ASSISTANT_VISITOR_ID_PATTERN = /^reuse_anon_[A-Za-z0-9_-]{24,64}$/;

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function getAnonymousSubject(request: NextRequest) {
  const stored = request.cookies.get(ASSISTANT_VISITOR_COOKIE)?.value;

  if (stored && ASSISTANT_VISITOR_ID_PATTERN.test(stored)) {
    return { subject: stored, shouldSetCookie: false };
  }

  return {
    subject: `reuse_anon_${randomBytes(18).toString("base64url")}`,
    shouldSetCookie: true,
  };
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return assistantJson(
      { error: "forbidden", message: "Origem da requisição não permitida." },
      { status: 403 }
    );
  }

  const userId = await getCurrentUser();
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
        },
      })
    : null;
  const anonymous = getAnonymousSubject(request);

  try {
    const privateKey = resolveAssistantWebChatPrivateKey();
    const ibmPublicKey = resolveAssistantWebChatIbmPublicKey();
    const userPayload: AssistantWebChatUserPayload = {
      reuse_authenticated: Boolean(user),
    };
    let subject = anonymous.subject;
    let displayName: string | undefined;

    if (user) {
      const secret = resolveAssistantActionSecret();
      const actionToken = createAssistantActionToken({
        userId: user.id,
        secret,
      });

      subject = createAssistantUserId(user.id, secret);
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
    const response = assistantJson({
      identityToken: identity.token,
      expiresAt: identity.expiresAt,
      authenticated: Boolean(user),
      ...(displayName ? { displayName } : {}),
    });

    if (!user && anonymous.shouldSetCookie) {
      response.cookies.set(ASSISTANT_VISITOR_COOKIE, anonymous.subject, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ASSISTANT_VISITOR_MAX_AGE,
      });
    }

    return response;
  } catch (error) {
    console.error("Erro ao criar identidade do Assistant:", error);
    return assistantJson(
      {
        error: "assistant_not_configured",
        message: "O assistente ainda não está configurado neste ambiente.",
      },
      { status: 503 }
    );
  }
}
