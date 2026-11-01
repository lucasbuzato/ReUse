"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";
import type { InterestPanelData } from "@/lib/interest-types";
import { CheckIcon, HeartIcon, RefreshIcon } from "@/components/ui/Icons";

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

function totalLabel(total: number) {
  return total === 1 ? "1 interesse registrado" : `${total} interesses registrados`;
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
    refreshInterval: (latestData) => (latestData?.role === "owner" ? 5_000 : 0),
  });

  const form = useForm<FormValues>({
    mode: "onChange",
    defaultValues: { message: "" },
  });

  const message = useWatch({ control: form.control, name: "message", defaultValue: "" });

  async function onSubmit(values: FormValues) {
    form.clearErrors("root");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        form.setError("root", { message: payload?.error ?? "Não foi possível enviar seu interesse." });
        return;
      }

      await mutate(payload as InterestPanelData, { revalidate: false });
      form.reset();
      void mutate();
    } catch {
      form.setError("root", { message: "Erro de conexão. Verifique sua internet e tente novamente." });
    }
  }

  if (isLoading && !data) {
    return (
      <section className="rounded-xl border border-line bg-surface p-6" aria-busy="true" aria-label="Carregando interesses">
        <div className="h-5 w-48 animate-pulse rounded bg-soft" />
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-soft" />
      </section>
    );
  }

  if (data.role === "owner") {
    return (
      <section className="rounded-xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="interests-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
              </span>
              Atualização automática
            </p>
            <h2 id="interests-title" className="mt-2 text-2xl font-bold tracking-tight">
              Pessoas interessadas
            </h2>
            <p className="mt-1 text-sm text-muted">
              {data.total === 1 ? "1 pessoa demonstrou interesse" : `${data.total} pessoas demonstraram interesse`}. A lista se
              atualiza a cada 5 segundos.
            </p>
          </div>

          <button type="button" onClick={() => void mutate()} disabled={isValidating} className="btn-secondary shrink-0">
            <RefreshIcon className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`} />
            {isValidating ? "Atualizando..." : "Atualizar agora"}
          </button>
        </div>

        <p className="sr-only" aria-live="polite">
          {isValidating ? "Atualizando a lista de interessados." : "Lista atualizada."}
        </p>

        {error ? (
          <div className="mt-5 rounded-lg border border-warn/30 bg-warn-soft p-4" role="alert">
            <p className="text-sm text-warn">Não foi possível sincronizar agora. Os últimos dados carregados continuam visíveis.</p>
          </div>
        ) : null}

        {data.interests.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-field/60 px-6 py-10 text-center">
            <p className="font-semibold">Ainda não há interessados</p>
            <p className="mt-1 text-sm text-muted">Quando alguém enviar uma mensagem, ela aparece aqui sem recarregar a página.</p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.interests.map((interest) => (
              <li key={interest.id} className="rounded-lg border border-line p-5">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft font-bold text-brand-text"
                    aria-hidden="true"
                  >
                    {interest.user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{interest.user.name}</p>
                    <a
                      href={`mailto:${interest.user.email}`}
                      className="block truncate text-sm text-brand-text underline-offset-4 hover:underline"
                    >
                      {interest.user.email}
                    </a>
                    <p className="mt-1 text-xs text-muted">Recebido em {formatDate(interest.createdAt)}</p>
                  </div>
                </div>
                <blockquote className="mt-4 rounded-lg bg-soft p-4 text-sm text-ink">“{interest.message}”</blockquote>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (data.role === "anonymous") {
    return (
      <section className="rounded-xl border border-brand/25 bg-brand-soft/60 p-6" aria-labelledby="interest-cta-title">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-text" aria-hidden="true">
            <HeartIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="interest-cta-title" className="font-semibold">
              Quero este item
            </h2>
            <p className="mt-1 text-sm text-muted">
              Entre na sua conta para enviar uma mensagem a quem anunciou. Só essa pessoa verá seu contato.
            </p>
            <p className="mt-2 text-xs font-medium text-muted">{totalLabel(data.total)}</p>
          </div>
        </div>
        <Link href={`/login?next=${encodeURIComponent(`/itens/${itemId}`)}`} className="btn-primary mt-5 w-full">
          Entrar para demonstrar interesse
        </Link>
        <p className="mt-3 text-center text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link
            href={`/cadastro?next=${encodeURIComponent(`/itens/${itemId}`)}`}
            className="font-semibold text-brand-text underline-offset-2 hover:underline"
          >
            Crie grátis em 1 minuto
          </Link>
        </p>
      </section>
    );
  }

  if (data.ownInterest) {
    return (
      <section className="rounded-xl border border-brand/30 bg-brand-soft/60 p-6" aria-labelledby="interest-sent-title">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-on" aria-hidden="true">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="interest-sent-title" className="font-semibold">
              Interesse enviado
            </h2>
            <p className="mt-1 text-sm text-muted">
              Quem anunciou já pode ver sua mensagem e seu e-mail para combinar a entrega.
            </p>
          </div>
        </div>
        <blockquote className="mt-4 rounded-lg border border-line bg-surface p-4 text-sm text-ink">“{data.ownInterest.message}”</blockquote>
        <p className="mt-3 text-xs text-muted">Enviado em {formatDate(data.ownInterest.createdAt)}</p>
      </section>
    );
  }

  const messageError = form.formState.errors.message;

  return (
    <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="interest-form-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text" aria-hidden="true">
          <HeartIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 id="interest-form-title" className="font-semibold">
            Quero este item
          </h2>
          <p className="mt-1 text-sm text-muted">Conte por que o item seria útil e quando você pode retirar.</p>
          <p className="mt-2 text-xs font-medium text-muted">{totalLabel(data.total)}</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
        <div>
          <label htmlFor="interest-message" className="field-label">
            Mensagem para quem anunciou
          </label>
          <textarea
            id="interest-message"
            rows={4}
            placeholder="Ex.: Posso retirar amanhã à tarde. Vou usar no projeto de leitura da escola do bairro."
            aria-describedby="interest-help interest-count"
            aria-invalid={Boolean(messageError)}
            className="field resize-y"
            {...form.register("message", {
              required: "Escreva uma mensagem para quem anunciou.",
              minLength: { value: 10, message: "Use pelo menos 10 caracteres." },
              maxLength: { value: 500, message: "Use no máximo 500 caracteres." },
            })}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
            <p id="interest-help" className="text-muted">
              Não inclua documentos, senhas ou dados bancários.
            </p>
            <p id="interest-count" className="shrink-0 text-muted">
              {message.length}/500
            </p>
          </div>
          {messageError ? (
            <p className="field-error" role="alert">
              {messageError.message}
            </p>
          ) : null}
        </div>

        {form.formState.errors.root ? (
          <div className="rounded-lg border border-danger/30 bg-danger-soft p-3" role="alert">
            <p className="text-sm text-danger">{form.formState.errors.root.message}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
          className="btn-primary w-full"
        >
          {form.formState.isSubmitting ? "Enviando..." : "Enviar interesse"}
        </button>
      </form>
    </section>
  );
}
