import { NextResponse } from "next/server";
import { AssistantRequestAuthError } from "./assistant-request-auth";

export function assistantJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export function assistantActionErrorResponse(error: unknown) {
  if (error instanceof AssistantRequestAuthError) {
    if (error.code === "configuration_error") {
      console.error("Configuração da extensão do Assistant incompleta.");
      return assistantJson(
        {
          ok: false,
          error: "assistant_not_configured",
          message: "A integração do assistente ainda não está configurada.",
        },
        { status: 503 }
      );
    }

    if (error.code === "insufficient_scope") {
      return assistantJson(
        {
          ok: false,
          error: "forbidden",
          message: "Esta sessão não tem permissão para executar a ação.",
        },
        { status: 403 }
      );
    }

    return assistantJson(
      {
        ok: false,
        error: "unauthorized",
        message: "Sua sessão expirou. Entre novamente no ReUse e reabra o chat.",
      },
      { status: 401 }
    );
  }

  console.error("Erro na ação do Assistant:", error);
  return assistantJson(
    {
      ok: false,
      error: "internal_error",
      message: "Não foi possível concluir a ação agora. Tente novamente.",
    },
    { status: 500 }
  );
}
