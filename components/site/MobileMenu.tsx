"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

type NavLink = { href: string; label: string };

export default function MobileMenu({ links, signedIn }: { links: NavLink[]; signedIn: boolean }) {
  const pathname = usePathname();
  const panelId = useId();
  // Guardamos em qual página o menu foi aberto: ao navegar, ele fecha sozinho.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-surface text-ink"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open ? (
        <div id={panelId} className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <nav className="page flex flex-col gap-1 py-4" aria-label="Menu principal (celular)">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-soft">
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-4">
              {signedIn ? (
                <>
                  <Link href="/perfil" className="btn-secondary">
                    Meu perfil
                  </Link>
                  <Link href="/itens/novo" className="btn-primary">
                    Anunciar item
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary">
                    Entrar
                  </Link>
                  <Link href="/cadastro" className="btn-primary">
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
