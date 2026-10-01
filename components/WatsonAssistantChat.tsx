"use client";

import { useEffect, useRef, useState } from "react";

type AssistantIdentity = {
  identityToken: string;
  expiresAt: string;
  authenticated: boolean;
  displayName?: string;
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

type IdentityTokenExpiredEvent = {
  identityToken?: string;
};

type WebChatInstance = {
  on(options: {
    type: "pre:send";
    handler: (event: WebChatEvent) => void | Promise<void>;
  }): void;
  on(options: {
    type: "identityTokenExpired";
    handler: (event: IdentityTokenExpiredEvent) => void | Promise<void>;
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
  updateCSSVariables?(variables: Record<string, string>): void;
};

type WatsonAssistantChatOptions = {
  integrationID: string;
  region: string;
  serviceInstanceID: string;
  clientVersion: string;
  identityToken: string;
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
const ACTION_SKILLS = ["actions skill", "action skill"] as const;
const VOICE_START_TIMEOUT_MS = 8_000;
const VOICE_LISTEN_TIMEOUT_MS = 12_000;
const VOICE_SEND_TIMEOUT_MS = 10_000;

const integrationID =
  process.env.NEXT_PUBLIC_IBM_ASSISTANT_INTEGRATION_ID ?? "";
const region = process.env.NEXT_PUBLIC_IBM_ASSISTANT_REGION ?? "";
const serviceInstanceID =
  process.env.NEXT_PUBLIC_IBM_ASSISTANT_SERVICE_INSTANCE_ID ?? "";
const clientVersion =
  process.env.NEXT_PUBLIC_IBM_ASSISTANT_WEB_CHAT_VERSION ?? "latest";

const isConfigured = Boolean(integrationID && region && serviceInstanceID);

async function fetchAssistantIdentity(): Promise<AssistantIdentity> {
  const response = await fetch("/api/assistant/session", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao preparar a sessão do Assistant (${response.status}).`);
  }

  return response.json() as Promise<AssistantIdentity>;
}

function setPublicActionSkillVariables(
  event: WebChatEvent,
  identity: AssistantIdentity | null
) {
  event.data.context ??= {};
  event.data.context.skills ??= {};

  for (const actionSkill of ACTION_SKILLS) {
    event.data.context.skills[actionSkill] ??= {};
    event.data.context.skills[actionSkill].skill_variables ??= {};

    const variables = event.data.context.skills[actionSkill]
      .skill_variables as Record<string, unknown>;

    variables.reuse_authenticated = identity?.authenticated ?? false;

    if (identity?.authenticated) {
      variables.reuse_token_expires_at = identity.expiresAt;

      if (identity.displayName) {
        variables.reuse_user_name = identity.displayName;
      }

      continue;
    }

    delete variables.reuse_token_expires_at;
    delete variables.reuse_user_name;
  }
}

function getVoiceErrorMessage(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Permita o acesso ao microfone nas configurações do navegador e tente novamente.";
  }

  if (error === "audio-capture") {
    return "Nenhum microfone disponível foi encontrado.";
  }

  if (error === "no-speech") {
    return "Não detectei sua fala. Clique no microfone e tente novamente.";
  }

  if (error === "network") {
    return "O serviço de reconhecimento de voz está indisponível. Tente novamente.";
  }

  return "Não foi possível iniciar a entrada por voz. Tente novamente.";
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, code: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(code)), timeoutMs);

    operation.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

export default function WatsonAssistantChat() {
  const [status, setStatus] = useState<
    "disabled" | "loading" | "ready" | "error"
  >(isConfigured ? "loading" : "disabled");
  const [voiceSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
  );
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "requesting" | "listening" | "sending" | "error"
  >("idle");
  const [voiceFeedback, setVoiceFeedback] = useState("");
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
      setVoiceFeedback("A entrada por voz não está disponível neste navegador.");
      setVoiceStatus("error");
      return;
    }

    const recognition = new SpeechRecognition();
    let receivedResult = false;
    let recognitionFailed = false;
    let timedOut = false;
    let startTimeout: number | null = null;
    let listenTimeout: number | null = null;

    const clearVoiceTimeouts = () => {
      if (startTimeout !== null) {
        window.clearTimeout(startTimeout);
        startTimeout = null;
      }

      if (listenTimeout !== null) {
        window.clearTimeout(listenTimeout);
        listenTimeout = null;
      }
    };

    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      clearVoiceTimeouts();
      setVoiceFeedback("Ouvindo… fale agora.");
      setVoiceStatus("listening");
      listenTimeout = window.setTimeout(() => {
        if (receivedResult || recognitionFailed) return;

        timedOut = true;
        recognitionFailed = true;
        speechRecognitionRef.current = null;
        setVoiceFeedback(
          "O Chrome não concluiu o reconhecimento da fala. Verifique o microfone e tente novamente."
        );
        setVoiceStatus("error");
        recognition.abort();
      }, VOICE_LISTEN_TIMEOUT_MS);
    };
    recognition.onresult = (event) => {
      clearVoiceTimeouts();
      receivedResult = true;
      const transcript = event.results[0]?.[0]?.transcript.trim();

      if (!transcript) {
        setVoiceFeedback("Não detectei sua fala. Clique no microfone e tente novamente.");
        setVoiceStatus("error");
        return;
      }

      setVoiceFeedback("Enviando a mensagem reconhecida…");
      setVoiceStatus("sending");
      void (async () => {
        try {
          const openOperation = instance.openWindow?.();
          if (openOperation) {
            void Promise.resolve(openOperation).catch((error) => {
              console.error("Não foi possível abrir o chat antes do envio por voz.", error);
            });
          }

          await withTimeout(
            Promise.resolve(instance.send({ input: { text: transcript } })),
            VOICE_SEND_TIMEOUT_MS,
            "voice_send_timeout"
          );
          setVoiceFeedback("");
          setVoiceStatus("idle");
        } catch (error) {
          console.error("Não foi possível enviar a mensagem por voz.", error);
          setVoiceFeedback(
            error instanceof Error && error.message === "voice_send_timeout"
              ? "Reconheci sua fala, mas o chat não confirmou o envio. Tente novamente."
              : "Reconheci sua fala, mas não consegui enviar a mensagem."
          );
          setVoiceStatus("error");
        }
      })();
    };
    recognition.onerror = (event) => {
      clearVoiceTimeouts();
      recognitionFailed = true;

      if (event.error === "aborted") {
        if (!timedOut) {
          setVoiceFeedback("");
          setVoiceStatus("idle");
        }
        return;
      }

      console.error("Não foi possível reconhecer a mensagem por voz.", event.error);
      setVoiceFeedback(getVoiceErrorMessage(event.error));
      setVoiceStatus("error");
    };
    recognition.onend = () => {
      clearVoiceTimeouts();
      speechRecognitionRef.current = null;

      if (timedOut) return;

      if (!receivedResult && !recognitionFailed) {
        setVoiceFeedback("Não detectei sua fala. Clique no microfone e tente novamente.");
        setVoiceStatus("error");
      }
    };

    speechRecognitionRef.current = recognition;
    setVoiceFeedback("Iniciando reconhecimento de voz…");
    setVoiceStatus("requesting");

    try {
      startTimeout = window.setTimeout(() => {
        if (receivedResult || recognitionFailed) return;

        timedOut = true;
        recognitionFailed = true;
        speechRecognitionRef.current = null;
        setVoiceFeedback(
          "O Chrome não iniciou o reconhecimento de voz. Recarregue a página e tente novamente."
        );
        setVoiceStatus("error");
        recognition.abort();
      }, VOICE_START_TIMEOUT_MS);
      recognition.start();
    } catch (error) {
      clearVoiceTimeouts();
      speechRecognitionRef.current = null;
      console.error("Não foi possível iniciar o reconhecimento de voz.", error);
      setVoiceFeedback("Não foi possível iniciar o microfone. Recarregue a página e tente novamente.");
      setVoiceStatus("error");
    }
  }

  useEffect(() => {
    if (!isConfigured) return;

    let mounted = true;
    let identity: AssistantIdentity | null = null;

    async function getIdentity() {
      identity = await fetchAssistantIdentity();
      return identity;
    }

    function appendWebChatScript() {
      if (document.getElementById(SCRIPT_ID)) return;

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

    void (async () => {
      try {
        const initialIdentity = await getIdentity();
        if (!mounted) return;

        window.watsonAssistantChatOptions = {
          integrationID,
          region,
          serviceInstanceID,
          clientVersion,
          identityToken: initialIdentity.identityToken,
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

            instance.on({
              type: "identityTokenExpired",
              async handler(event) {
                const refreshedIdentity = await getIdentity();
                event.identityToken = refreshedIdentity.identityToken;
              },
            });

            instance.on({
              type: "pre:send",
              handler(event) {
                setPublicActionSkillVariables(event, identity);
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

        appendWebChatScript();
      } catch (error) {
        console.error("Não foi possível preparar a identidade do Assistant.", error);
        if (mounted) setStatus("error");
      }
    })();

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
      : voiceStatus === "requesting"
        ? "Solicitando acesso ao microfone"
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
          {voiceFeedback ? (
            <span
              className={`fixed bottom-40 right-5 z-[100000] max-w-xs rounded-md border bg-white px-3 py-2 text-sm font-medium shadow-sm md:bottom-20 md:right-[27rem] ${
                voiceStatus === "error"
                  ? "border-red-200 text-red-700"
                  : "border-slate-200 text-slate-800"
              }`}
              role={voiceStatus === "error" ? "alert" : "status"}
              aria-live={voiceStatus === "error" ? "assertive" : "polite"}
            >
              {voiceFeedback}
            </span>
          ) : null}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={voiceStatus === "requesting" || voiceStatus === "sending"}
            aria-label={voiceLabel}
            aria-pressed={voiceStatus === "listening"}
            title={voiceLabel}
            data-testid="watson-assistant-voice"
            data-state={voiceStatus}
            className={`fixed bottom-24 right-5 z-[100000] flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F7D5A]/30 disabled:cursor-wait disabled:opacity-70 md:bottom-6 md:right-[28rem] ${
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
            {voiceFeedback}
          </span>
        </>
      ) : null}
    </>
  );
}
