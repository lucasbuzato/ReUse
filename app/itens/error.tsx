"use client";

import Link from "next/link";

export default function ItemsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page py-20">
      <section className="mx-auto max-w-lg rounded-xl border border-line bg-surface p-8 text-center" role="alert">
        <h1 className="text-2xl font-bold">Não foi possível carregar os itens</h1>
        <p className="mt-2 text-muted">A API pode estar iniciando. Aguarde alguns segundos e tente de novo.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn-primary">
            Tentar novamente
          </button>
          <Link href="/" className="btn-secondary">
            Voltar ao início
          </Link>
        </div>
      </section>
    </div>
  );
}
