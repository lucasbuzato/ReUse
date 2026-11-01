import Link from "next/link";
import type { CurrentUser } from "@/lib/types";
import { Wordmark } from "./Logo";
import MobileMenu from "./MobileMenu";

const links = [
  { href: "/itens", label: "Explorar itens" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#perguntas", label: "Dúvidas" },
];

export default function Header({ user }: { user: CurrentUser | null }) {
  const firstName = user?.name.split(" ")[0];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      <div className="page relative flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link href="/" className="shrink-0 rounded-lg" aria-label="ReUse! — página inicial">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Menu principal">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-[15px] font-medium text-muted transition-colors hover:bg-soft hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href="/itens/novo" className="btn-primary !min-h-10 !px-4">
                Anunciar item
              </Link>
              <Link
                href="/perfil"
                className="flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink hover:border-brand"
                aria-label={`Meu perfil (${user.name})`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-on" aria-hidden="true">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {firstName}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !min-h-10">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-primary !min-h-10 !px-4">
                Criar conta grátis
              </Link>
            </>
          )}
        </div>

        <MobileMenu links={[...links, { href: "/itens/novo", label: "Anunciar um item" }]} signedIn={Boolean(user)} />
      </div>
    </header>
  );
}
