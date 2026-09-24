import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "ReUse! | Doe, troque, reutilize",
  description:
    "Plataforma web ReUse! — conectando pessoas para dar uma nova vida aos objetos.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUser();

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      })
    : null;

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col bg-[#f6faf7]">
        <Providers>
          <header className="sticky top-0 z-50 border-b border-green-900/10 bg-white/95 backdrop-blur">
            <nav className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Principal">
              <div className="flex h-20 items-center justify-between gap-6">
                <Link
                  href="/"
                  className="group flex shrink-0 items-center gap-2"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-reuse-green text-lg font-bold text-white transition group-hover:rotate-3"
                    aria-hidden="true"
                  >
                    R
                  </div>

                  <div>
                    <span className="text-xl font-bold text-reuse-greenDark">
                      ReUse!
                    </span>
                    <p className="hidden text-[10px] uppercase tracking-widest text-gray-400 sm:block">
                      reutilize • compartilhe • transforme
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 text-sm font-medium sm:gap-5">
                  <Link
                    href="/itens"
                    className="rounded-lg px-3 py-2 text-gray-600 transition hover:bg-reuse-greenLight hover:text-reuse-greenDark"
                  >
                    Explorar
                  </Link>

                  <Link
                    href="/itens/novo"
                    className="hidden rounded-lg px-3 py-2 text-gray-600 transition hover:bg-reuse-greenLight hover:text-reuse-greenDark sm:block"
                  >
                    Anunciar
                  </Link>

                  <Link
                    href="/perfil"
                    className="rounded-lg px-3 py-2 text-gray-600 transition hover:bg-reuse-greenLight hover:text-reuse-greenDark"
                  >
                    Perfil
                  </Link>

                  {user ? (
                    <Link
                      href="/perfil"
                      className="hidden items-center gap-2 rounded-xl bg-reuse-greenLight px-3 py-2 md:flex"
                      aria-label={`Perfil de ${user.name}`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-reuse-green text-xs font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      <span className="text-reuse-greenDark">
                        {user.name.split(" ")[0]}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="reuse-button-primary !px-4 !py-2.5"
                    >
                      Entrar
                    </Link>
                  )}
                </div>
              </div>
            </nav>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
            {children}
          </main>

          <footer className="mt-16 border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-10">
              <div className="flex flex-col justify-between gap-6 sm:flex-row">
                <div>
                  <p className="text-lg font-bold text-reuse-greenDark">
                    ReUse!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Dê uma nova vida ao que você não usa mais.
                  </p>
                </div>

                <div className="text-sm text-gray-400 sm:text-right">
                  <p>Projeto acadêmico FIAP ON</p>
                  <p className="mt-1">Doe • Troque • Reutilize</p>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
