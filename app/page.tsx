import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  const [totalItens, totalUsuarios, totalDoados] = await Promise.all([
    prisma.item.count(),
    prisma.user.count(),
    prisma.item.count({
      where: { status: "DOADO" },
    }),
  ]);

  return {
    totalItens,
    totalUsuarios,
    totalDoados,
  };
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-reuse-greenDark px-6 py-16 sm:px-12 sm:py-20 text-white">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm mb-6">
            ♻️ Economia circular na prática
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            O que não serve mais para você pode transformar a vida de alguém.
          </h1>

          <p className="text-green-100 text-base sm:text-lg leading-relaxed mt-6 max-w-2xl">
            O ReUse! conecta pessoas que querem doar, trocar e encontrar
            objetos que ainda podem ter uma nova história.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/itens"
              className="reuse-button bg-white text-reuse-greenDark hover:bg-green-50"
            >
              Explorar itens →
            </Link>

            <Link
              href="/itens/novo"
              className="reuse-button border border-white/40 text-white hover:bg-white/10"
            >
              Quero anunciar
            </Link>
          </div>
        </div>
      </section>

      {/* ESTATÍSTICAS */}
      <section>
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-reuse-green">
            Nossa comunidade
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mt-2">
            Pequenas ações geram grandes mudanças
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="reuse-card p-7 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-reuse-greenLight flex items-center justify-center text-2xl">
              📦
            </div>

            <p className="text-3xl font-bold text-reuse-greenDark mt-4">
              {stats.totalItens}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              itens cadastrados
            </p>
          </div>

          <div className="reuse-card p-7 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-reuse-greenLight flex items-center justify-center text-2xl">
              👥
            </div>

            <p className="text-3xl font-bold text-reuse-greenDark mt-4">
              {stats.totalUsuarios}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              pessoas na comunidade
            </p>
          </div>

          <div className="reuse-card p-7 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-reuse-greenLight flex items-center justify-center text-2xl">
              ♻️
            </div>

            <p className="text-3xl font-bold text-reuse-greenDark mt-4">
              {stats.totalDoados}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              itens já reutilizados
            </p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="reuse-card p-8 sm:p-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-reuse-green">
            Simples assim
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mt-2">
            Como funciona?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {[
            ["01", "Encontre", "Explore itens disponíveis na sua comunidade."],
            ["02", "Demonstre interesse", "Mostre que você gostaria de receber o item."],
            ["03", "Reutilize", "Combine a entrega e dê uma nova vida ao objeto."],
          ].map(([number, title, description]) => (
            <div key={number} className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-reuse-green text-white flex items-center justify-center font-bold">
                {number}
              </div>

              <h3 className="font-bold text-gray-800 mt-4">
                {title}
              </h3>

              <p className="text-sm text-gray-500 leading-relaxed mt-2">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}