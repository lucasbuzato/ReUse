import { NextRequest } from "next/server";
import { assistantJson } from "@/lib/assistant-api";
import {
  createAssistantActionToken,
  createAssistantUserId,
  resolveAssistantActionSecret,
} from "@/lib/assistant-action-token";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return assistantJson(
      { error: "forbidden", message: "Origem da requisição não permitida." },
      { status: 403 }
    );
  }

  const userId = await getCurrentUser();
  if (!userId) {
    return assistantJson(
      { error: "unauthorized", message: "Faça login para automatizar tarefas." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!user) {
    return assistantJson(
      { error: "unauthorized", message: "Sessão de usuário inválida." },
      { status: 401 }
    );
  }

  try {
    const secret = resolveAssistantActionSecret();
    const { token, expiresAt } = createAssistantActionToken({
      userId: user.id,
      secret,
    });

    return assistantJson({
      authenticated: true,
      actionToken: token,
      expiresAt,
      assistantUserId: createAssistantUserId(user.id, secret),
      displayName: user.name.split(" ")[0],
    });
  } catch (error) {
    console.error("Erro ao criar sessão do Assistant:", error);
    return assistantJson(
      {
        error: "assistant_not_configured",
        message: "O assistente ainda não está configurado neste ambiente.",
      },
      { status: 503 }
    );
  }
}
