"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ItemsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na área de itens:", error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm sm:p-12" role="alert">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl" aria-hidden="true">
        ⚠️
      </div>
      <h1 className="mt-5 text-2xl font-bold text-gray-900">
        Não foi possível carregar os itens
      </h1>
      <p className="mt-2 leading-7 text-gray-600">
        O serviço pode estar temporariamente indisponível. Tente novamente; seus dados não foram alterados.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="reuse-button-primary">
          Tentar novamente
        </button>
        <Link href="/" className="reuse-button border border-gray-200 bg-white text-gray-700 hover:border-reuse-green hover:text-reuse-green">
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
