import Link from "next/link";
import { backendPublicUrl } from "@/lib/site";
import { Wordmark } from "./Logo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="page grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 max-w-xs md:col-span-1">
          <Wordmark />
          <p className="mt-4 text-sm text-muted">
            Doe o que sobra, encontre o que falta. Uma plataforma colaborativa para dar nova vida a objetos em bom estado.
          </p>
        </div>

        <nav aria-label="Plataforma">
          <h2 className="text-sm font-semibold text-ink">Plataforma</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><Link className="inline-flex min-h-8 items-center hover:text-brand-text" href="/itens">Explorar itens</Link></li>
            <li><Link className="inline-flex min-h-8 items-center hover:text-brand-text" href="/itens/novo">Anunciar um item</Link></li>
            <li><Link className="inline-flex min-h-8 items-center hover:text-brand-text" href="/#como-funciona">Como funciona</Link></li>
            <li><Link className="inline-flex min-h-8 items-center hover:text-brand-text" href="/#perguntas">Perguntas frequentes</Link></li>
          </ul>
        </nav>

        <nav aria-label="Conta">
          <h2 className="text-sm font-semibold text-ink">Sua conta</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><Link className="inline-flex min-h-8 items-center hover:text-brand-text" href="/cadastro">Criar conta</Link></li>
            <li><Link className="inline-flex min-h-8 items-center hover:text-brand-text" href="/login">Entrar</Link></li>
            <li><Link className="inline-flex min-h-8 items-center hover:text-brand-text" href="/perfil">Meus anúncios</Link></li>
          </ul>
        </nav>

        <nav aria-label="Projeto">
          <h2 className="text-sm font-semibold text-ink">Projeto</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><a className="inline-flex min-h-8 items-center hover:text-brand-text" href={`${backendPublicUrl}/api/docs`}>Documentação da API</a></li>
            <li><a className="inline-flex min-h-8 items-center hover:text-brand-text" href={`${backendPublicUrl}/admin`}>Área administrativa</a></li>
            <li><a className="inline-flex min-h-8 items-center hover:text-brand-text" href="https://github.com/lucasbuzato/ReUse">Código no GitHub</a></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ReUse! · Projeto acadêmico FIAP ON.</p>
          <p>Fotos de demonstração: Unsplash. Pessoas e anúncios de exemplo são fictícios.</p>
        </div>
      </div>
    </footer>
  );
}
