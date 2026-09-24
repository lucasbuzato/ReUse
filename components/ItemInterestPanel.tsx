"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";
import type { InterestPanelData } from "@/lib/interest-types";

type FormValues = {
  message: string;
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDate(value: string) {
  return dateTimeFormat.format(new Date(value));
}

export default function ItemInterestPanel({
  itemId,
  initialData,
}: {
  itemId: string;
  initialData: InterestPanelData;
}) {
  const endpoint = `/api/items/${itemId}/interests`;
  const {
    data = initialData,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<InterestPanelData>(endpoint, {
    fallbackData: initialData,
    keepPreviousData: true,
    refreshInterval: (latestData) =>
      latestData?.role === "owner" ? 5_000 : 0,
  });

  const form = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      message: "",
    },
  });

  const message = useWatch({
    control: form.control,
    name: "message",
    defaultValue: "",
  });

  async function onSubmit(values: FormValues) {
    form.clearErrors("root");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        form.setError("root", {
          message: payload?.error ?? "Não foi possível enviar seu interesse.",
        });
        return;
      }

      await mutate(payload as InterestPanelData, { revalidate: false });
      form.reset();
      void mutate();
    } catch {
      form.setError("root", {
        message: "Erro de conexão. Verifique sua internet e tente novamente.",
      });
    }
  }

  if (isLoading && !data) {
    return (
      <section
        className="mt-7 rounded-2xl border border-gray-100 bg-white p-6"
        aria-busy="true"
        aria-label="Carregando interesses"
      >
        <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-gray-50" />
      </section>
    );
  }

  if (data.role === "owner") {
    return (
      <section
        className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        aria-labelledby="interests-title"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-green-500"
                aria-hidden="true"
              />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-reuse-green">
                Sincronização em tempo real
              </p>
            </div>
            <h2 id="interests-title" className="mt-2 text-2xl font-bold text-gray-900">
              Pessoas interessadas
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {data.total === 1
                ? "1 pessoa demonstrou interesse"
                : `${data.total} pessoas demonstraram interesse`}
              . A lista é revalidada automaticamente a cada 5 segundos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void mutate()}
            disabled={isValidating}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-reuse-green hover:text-reuse-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reuse-green focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            <span aria-hidden="true">↻</span>
            {isValidating ? "Atualizando..." : "Atualizar agora"}
          </button>
        </div>

        <p className="sr-only" aria-live="polite">
          {isValidating ? "Atualizando a lista de interessados." : "Lista atualizada."}
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4" role="alert">
            <p className="text-sm text-amber-900">
              Não foi possível sincronizar agora. Os últimos dados carregados continuam visíveis.
            </p>
          </div>
        )}

        {data.interests.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-reuse-greenLight text-2xl" aria-hidden="true">
              💬
            </div>
            <p className="mt-4 font-semibold text-gray-700">Ainda não há interessados</p>
            <p className="mt-1 text-sm text-gray-500">
              Quando alguém enviar uma mensagem, ela aparecerá aqui sem recarregar a página.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.interests.map((interest) => (
              <li
                key={interest.id}
                className="rounded-2xl border border-gray-100 p-5 transition hover:border-green-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reuse-greenLight font-bold text-reuse-greenDark"
                    aria-hidden="true"
                  >
                    {interest.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{interest.user.name}</p>
                    <a
                      href={`mailto:${interest.user.email}`}
                      className="block truncate text-sm text-reuse-green underline-offset-4 hover:underline"
                    >
                      {interest.user.email}
                    </a>
                    <p className="mt-1 text-xs text-gray-400">
                      Recebido em {formatDate(interest.createdAt)}
                    </p>
                  </div>
                </div>
                <blockquote className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  “{interest.message}”
                </blockquote>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (data.role === "anonymous") {
    return (
      <section className="mt-7 rounded-2xl border border-green-100 bg-green-50/60 p-6" aria-labelledby="interest-cta-title">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100" aria-hidden="true">
            💚
          </div>
          <div>
            <h2 id="interest-cta-title" className="font-bold text-gray-900">Quero este item</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Entre na sua conta para enviar uma mensagem ao doador. Somente ele verá seus dados de contato.
            </p>
            <p className="mt-2 text-xs font-medium text-gray-500">
              {data.total === 1 ? "1 interesse registrado" : `${data.total} interesses registrados`}
            </p>
          </div>
        </div>
        <Link href="/login" className="reuse-button-primary mt-5 w-full sm:w-auto">
          Entrar para demonstrar interesse
        </Link>
      </section>
    );
  }

  if (data.ownInterest) {
    return (
      <section className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-6" aria-labelledby="interest-sent-title">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reuse-green text-white" aria-hidden="true">
            ✓
          </div>
          <div>
            <h2 id="interest-sent-title" className="font-bold text-gray-900">Interesse enviado</h2>
            <p className="mt-1 text-sm text-gray-600">
              O doador já pode ver sua mensagem. Seus dados pessoais não são exibidos para outros visitantes.
            </p>
          </div>
        </div>
        <blockquote className="mt-4 rounded-xl border border-green-100 bg-white p-4 text-sm leading-6 text-gray-700">
          “{data.ownInterest.message}”
        </blockquote>
        <p className="mt-3 text-xs text-gray-500">
          Enviado em {formatDate(data.ownInterest.createdAt)}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-7 rounded-2xl border border-green-100 bg-green-50/60 p-6" aria-labelledby="interest-form-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100" aria-hidden="true">
          💚
        </div>
        <div>
          <h2 id="interest-form-title" className="font-bold text-gray-900">Quero este item</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Conte ao doador por que o item seria útil e combine a retirada com segurança.
          </p>
          <p className="mt-2 text-xs font-medium text-gray-500">
            {data.total === 1 ? "1 interesse registrado" : `${data.total} interesses registrados`}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
        <div>
          <label htmlFor="interest-message" className="block text-sm font-semibold text-gray-800">
            Mensagem para o doador
          </label>
          <textarea
            id="interest-message"
            rows={4}
            placeholder="Ex.: Posso retirar amanhã à tarde e vou reutilizá-lo em um projeto comunitário."
            aria-describedby="interest-help interest-count"
            aria-invalid={Boolean(form.formState.errors.message)}
            className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-reuse-green focus:ring-2 focus:ring-green-100"
            {...form.register("message", {
              required: "Escreva uma mensagem para o doador.",
              minLength: {
                value: 10,
                message: "Use pelo menos 10 caracteres.",
              },
              maxLength: {
                value: 500,
                message: "Use no máximo 500 caracteres.",
              },
            })}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
            <p id="interest-help" className="text-gray-500">
              Não inclua documentos, senhas ou dados bancários.
            </p>
            <p id="interest-count" className="shrink-0 text-gray-400">
              {message.length}/500
            </p>
          </div>
          {form.formState.errors.message && (
            <p className="mt-2 text-sm font-medium text-red-700" role="alert">
              {form.formState.errors.message.message}
            </p>
          )}
        </div>

        {form.formState.errors.root && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
            <p className="text-sm text-red-800">{form.formState.errors.root.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
          className="reuse-button-primary w-full disabled:cursor-not-allowed disabled:opacity-55"
        >
          {form.formState.isSubmitting ? "Enviando interesse..." : "Enviar interesse"}
        </button>
      </form>
    </section>
  );
}
