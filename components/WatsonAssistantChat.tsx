"use client";

import { useEffect, useRef, useState } from "react";

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
  openWindow?(): void | Promise<void>;
  render(): void | Promise<void>;
  send(message: { input: { text: string } }): void | Promise<void>;
  updateHomeScreenConfig?(config: {
    is_on: boolean;
    greeting: string;
    starters: {
      is_on: boolean;
      buttons: Array<{ label: string }>;
    };
  }): void | Promise<void>;
  updateLocale?(locale: string, savePreference?: boolean): void | Promise<void>;
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

type SpeechRecognitionResultEventLike = Event & {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    watsonAssistantChatOptions?: WatsonAssistantChatOptions;
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
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
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "listening" | "sending" | "error"
  >("idle");
  const webChatInstanceRef = useRef<WebChatInstance | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function toggleVoiceInput() {
    if (voiceStatus === "listening") {
      speechRecognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const instance = webChatInstanceRef.current;

    if (!SpeechRecognition || !instance) {
      setVoiceStatus("error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceStatus("listening");
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript.trim();

      if (!transcript) {
        setVoiceStatus("error");
        return;
      }

      setVoiceStatus("sending");
      void (async () => {
        try {
          await instance.openWindow?.();
          await instance.send({ input: { text: transcript } });
          setVoiceStatus("idle");
        } catch (error) {
          console.error("Não foi possível enviar a mensagem por voz.", error);
          setVoiceStatus("error");
        }
      })();
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        setVoiceStatus("idle");
        return;
      }

      console.error("Não foi possível reconhecer a mensagem por voz.", event.error);
      setVoiceStatus("error");
    };
    recognition.onend = () => {
      speechRecognitionRef.current = null;
      setVoiceStatus((current) =>
        current === "listening" ? "idle" : current
      );
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  }

  useEffect(() => {
    if (!isConfigured) return;

    let mounted = true;
    let identity: AssistantIdentity | null = null;
    let identityCheckedAt = 0;

    setVoiceSupported(
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
    );

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
        await instance.updateLocale?.("pt-BR");
        await instance.updateHomeScreenConfig?.({
          is_on: true,
          greeting:
            "Olá! Sou o Assistente ReUse. Posso ajudar você a anunciar, encontrar e gerenciar itens. Como posso ajudar?",
          starters: {
            is_on: true,
            buttons: [
              { label: "Como cadastrar um novo item?" },
              { label: "Como encontrar itens?" },
              { label: "Como demonstrar interesse?" },
              { label: "Como gerenciar anúncios?" },
            ],
          },
        });

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
          "$focus": "#2F7D5A",
          "$interactive-01": "#2F7D5A",
          "$interactive-02": "#20563E",
        });

        await instance.render();
        webChatInstanceRef.current = instance;
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
      speechRecognitionRef.current?.abort();
      speechRecognitionRef.current = null;
      webChatInstanceRef.current = null;
    };
  }, []);

  const voiceLabel =
    voiceStatus === "listening"
      ? "Parar entrada por voz"
      : voiceStatus === "sending"
        ? "Enviando mensagem por voz"
        : "Falar com o Assistente ReUse";

  return (
    <>
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

      {status === "ready" && voiceSupported ? (
        <>
          {voiceStatus === "listening" ? (
            <span className="fixed bottom-28 right-20 z-[9998] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm">
              Ouvindo…
            </span>
          ) : null}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={voiceStatus === "sending"}
            aria-label={voiceLabel}
            aria-pressed={voiceStatus === "listening"}
            title={voiceLabel}
            data-testid="watson-assistant-voice"
            data-state={voiceStatus}
            className={`fixed bottom-24 right-5 z-[9998] flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F7D5A]/30 disabled:cursor-wait disabled:opacity-70 ${
              voiceStatus === "listening"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#2F7D5A] hover:bg-[#20563E]"
            }`}
          >
            {voiceStatus === "listening" ? (
              <span aria-hidden="true" className="h-4 w-4 rounded-sm bg-white" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                <path
                  d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          <span className="sr-only" aria-live="polite">
            {voiceStatus === "listening"
              ? "O assistente está ouvindo."
              : voiceStatus === "sending"
                ? "Enviando a mensagem reconhecida."
                : voiceStatus === "error"
                  ? "Não foi possível usar a entrada por voz. Tente novamente."
                  : ""}
          </span>
        </>
      ) : null}
    </>
  );
}
