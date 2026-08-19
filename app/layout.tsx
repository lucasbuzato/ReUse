import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
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
      <body className="min-h-screen bg-[#f6faf7]">
        <header className="sticky top-0 z-50 border-b border-green-900/10 bg-white/95 backdrop-blur">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="h-20 flex items-center justify-between gap-6">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2 group shrink-0"
              >
                <div className="w-10 h-10 rounded-xl bg-reuse-green flex items-center justify-center text-white font-bold text-lg group-hover:rotate-3 transition">
                  R
                </div>

                <div>
                  <span className="text-xl font-bold text-reuse-greenDark">
                    ReUse!
                  </span>
                  <p className="hidden sm:block text-[10px] uppercase tracking-widest text-gray-400">
                    reutilize • compartilhe • transforme
                  </p>
                </div>
              </Link>

              {/* Navegação */}
              <div className="flex items-center gap-2 sm:gap-5 text-sm font-medium">
                <Link
                  href="/itens"
                  className="hidden sm:block px-3 py-2 rounded-lg text-gray-600 hover:text-reuse-greenDark hover:bg-reuse-greenLight transition"
                >
                  Explorar
                </Link>

                <Link
                  href="/itens/novo"
                  className="hidden sm:block px-3 py-2 rounded-lg text-gray-600 hover:text-reuse-greenDark hover:bg-reuse-greenLight transition"
                >
                  Anunciar
                </Link>

                <Link
                  href="/perfil"
                  className="px-3 py-2 rounded-lg text-gray-600 hover:text-reuse-greenDark hover:bg-reuse-greenLight transition"
                >
                  Perfil
                </Link>

                {user ? (
                  <Link
                    href="/perfil"
                    className="hidden md:flex items-center gap-2 bg-reuse-greenLight px-3 py-2 rounded-xl"
                  >
                    <div className="w-7 h-7 rounded-full bg-reuse-green text-white flex items-center justify-center text-xs font-bold">
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

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </main>

        <footer className="mt-16 border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <p className="text-lg font-bold text-reuse-greenDark">
                  ReUse!
                </p>
                <p className="text-sm text-gray-500 mt-1">
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
      </body>
    </html>
  );
}