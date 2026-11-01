import Link from "next/link";
import { BoxIcon } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <div className="page py-20 sm:py-28">
      <section className="mx-auto max-w-xl text-center" aria-labelledby="nao-encontrado">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <BoxIcon className="h-8 w-8" />
        </span>
        <p className="eyebrow mt-6">Erro 404</p>
        <h1 id="nao-encontrado" className="mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Não encontramos esta página
        </h1>
        <p className="mt-4 text-lg text-muted">
          O endereço pode estar errado, ou o anúncio já foi removido por quem publicou.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/itens" className="btn-primary">
            Ver itens disponíveis
          </Link>
          <Link href="/" className="btn-secondary">
            Ir para o início
          </Link>
        </div>
      </section>
    </div>
  );
}
