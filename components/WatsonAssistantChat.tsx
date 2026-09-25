"use client";

import { useEffect, useState } from "react";

type AssistantIdentity = {
  authenticated: true;
  actionToken: string;
  expiresAt: string;
  assistantUserId: string;
  displayName: string;
};

type SkillContext = {
  skill_variables?: Record<string, unknown>;
};

type WebChatEvent = {
  data: {
    context?: {
      skills?: Record<string, SkillContext>;
    };
  };
};

type WebChatInstance = {
  on(options: {
    type: "pre:send";
    handler: (event: WebChatEvent) => void | Promise<void>;
  }): void;
  render(): void | Promise<void>;
  updateUserID(userId: string): void;
  updateCSSVariables?(variables: Record<string, string>): void;
};

type WatsonAssistantChatOptions = {
  integrationID: string;
  region: string;
  serviceInstanceID: string;
  clientVersion: string;
  onLoad(instance: WebChatInstance): void | Promise<void>;
};

declare global {
  interface Window {
    watsonAssistantChatOptions?: WatsonAssistantChatOptions;
  }
}

const SCRIPT_ID = "reuse-watson-assistant-web-chat";
const ACTION_SKILL = "actions skill";

const integrationID =
  process.env.NEXT_PUBLIC_IBM_ASSISTANT_INTEGRATION_ID ?? "";
const region = process.env.NEXT_PUBLIC_IBM_ASSISTANT_REGION ?? "";
const serviceInstanceID =
  process.env.NEXT_PUBLIC_IBM_ASSISTANT_SERVICE_INSTANCE_ID ?? "";
const clientVersion =
  process.env.NEXT_PUBLIC_IBM_ASSISTANT_WEB_CHAT_VERSION ?? "latest";

const isConfigured = Boolean(integrationID && region && serviceInstanceID);

async function fetchAssistantIdentity(): Promise<AssistantIdentity | null> {
  const response = await fetch("/api/assistant/session", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Falha ao preparar a sessão do Assistant (${response.status}).`);
  }

  return response.json() as Promise<AssistantIdentity>;
}

function setActionSkillVariables(
  event: WebChatEvent,
  identity: AssistantIdentity | null
) {
  event.data.context ??= {};
  event.data.context.skills ??= {};
  event.data.context.skills[ACTION_SKILL] ??= {};
  event.data.context.skills[ACTION_SKILL].skill_variables ??= {};

  const variables =
    event.data.context.skills[ACTION_SKILL].skill_variables as Record<
      string,
      unknown
    >;

  variables.reuse_authenticated = Boolean(identity);

  if (identity) {
    variables.reuse_action_token = identity.actionToken;
    variables.reuse_token_expires_at = identity.expiresAt;
    variables.reuse_user_name = identity.displayName;
    return;
  }

  delete variables.reuse_action_token;
  delete variables.reuse_token_expires_at;
  delete variables.reuse_user_name;
}

export default function WatsonAssistantChat() {
  const [status, setStatus] = useState<
    "disabled" | "loading" | "ready" | "error"
  >(isConfigured ? "loading" : "disabled");

  useEffect(() => {
    if (!isConfigured) return;

    let mounted = true;
    let identity: AssistantIdentity | null = null;
    let identityCheckedAt = 0;

    async function getIdentity() {
      const expiresAt = identity ? Date.parse(identity.expiresAt) : 0;
      const tokenIsFresh = expiresAt > Date.now() + 60_000;
      const anonymousCheckIsFresh =
        !identity && Date.now() - identityCheckedAt < 60_000;

      if (tokenIsFresh || anonymousCheckIsFresh) return identity;

      try {
        identity = await fetchAssistantIdentity();
      } catch (error) {
        console.error(error);
        identity = null;
      } finally {
        identityCheckedAt = Date.now();
      }

      return identity;
    }

    window.watsonAssistantChatOptions = {
      integrationID,
      region,
      serviceInstanceID,
      clientVersion,
      async onLoad(instance) {
        const currentIdentity = await getIdentity();

        if (currentIdentity) {
          instance.updateUserID(currentIdentity.assistantUserId);
        }

        instance.on({
          type: "pre:send",
          async handler(event) {
            setActionSkillVariables(event, await getIdentity());
          },
        });

        instance.updateCSSVariables?.({
          "$focus": "#2f8f5b",
          "$interactive-01": "#2f8f5b",
          "$interactive-02": "#216b43",
        });

        await instance.render();
        if (mounted) setStatus("ready");
      },
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src =
        "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
        `${encodeURIComponent(clientVersion)}/WatsonAssistantChatEntry.js`;
      script.addEventListener("error", () => {
        console.error("Não foi possível carregar o IBM watsonx Assistant Web Chat.");
        if (mounted) setStatus("error");
      });
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <span
      className="sr-only"
      data-testid="watson-assistant-status"
      data-status={status}
      aria-live="polite"
    >
      {status === "disabled"
        ? "Assistente não configurado neste ambiente."
        : status === "error"
          ? "Assistente temporariamente indisponível."
          : status === "ready"
            ? "Assistente disponível."
            : "Carregando assistente."}
    </span>
  );
}
