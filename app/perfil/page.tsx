import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ItemActions from "@/components/ItemActions";
import LogoutButton from "@/components/LogoutButton";

export default async function PerfilPage() {
  const userId = await getCurrentUser();

  if (!userId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="reuse-card max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-reuse-greenLight flex items-center justify-center text-3xl">
            👤
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mt-5">
            Acesse seu perfil
          </h1>

          <p className="text-gray-500 mt-2 leading-relaxed">
            Entre na sua conta para visualizar seus dados, anúncios e
            manifestações de interesse.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
            <Link
              href="/login"
              className="reuse-button-primary"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="reuse-button-secondary"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      items: {
        include: {
          _count: {
            select: {
              interests: true,
            },
          },
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!usuario) return null;

  const totalInteresses = usuario.items.reduce(
    (total, item) => total + item._count.interests,
    0
  );

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-reuse-green font-semibold">
            Minha conta
          </p>

          <h1 className="text-3xl font-bold text-gray-800 mt-1">
            Olá, {usuario.name.split(" ")[0]}! 👋
          </h1>
        </div>

        <LogoutButton />
      </section>

      {/* PERFIL */}
      <section className="reuse-card overflow-hidden">
        <div className="h-24 bg-reuse-greenDark" />

        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white bg-reuse-green flex items-center justify-center text-white text-2xl font-bold shadow-sm">
              {usuario.name.charAt(0).toUpperCase()}
            </div>

            <div className="pb-1">
              <h2 className="text-xl font-bold text-gray-800">
                {usuario.name}
              </h2>

              <p className="text-sm text-gray-500">
                {usuario.email}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
            <span>
              📍 {usuario.city ?? "Cidade não informada"}
            </span>

            <span>
              📦 {usuario.items.length}{" "}
              {usuario.items.length === 1 ? "anúncio" : "anúncios"}
            </span>

            <span>
              💚 {totalInteresses} interessados
            </span>
          </div>
        </div>
      </section>

      {/* ESTATÍSTICAS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="reuse-card p-5">
          <p className="text-sm text-gray-500">Meus anúncios</p>
          <p className="text-3xl font-bold text-reuse-greenDark mt-1">
            {usuario.items.length}
          </p>
        </div>

        <div className="reuse-card p-5">
          <p className="text-sm text-gray-500">Interesses recebidos</p>
          <p className="text-3xl font-bold text-reuse-greenDark mt-1">
            {totalInteresses}
          </p>
        </div>

        <div className="reuse-card p-5">
          <p className="text-sm text-gray-500">Itens doados</p>
          <p className="text-3xl font-bold text-reuse-greenDark mt-1">
            {usuario.items.filter((item) => item.status === "DOADO").length}
          </p>
        </div>
      </section>

      {/* ITENS */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Meus anúncios
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Gerencie os itens que você publicou.
            </p>
          </div>

          <Link
            href="/itens/novo"
            className="reuse-button-primary !px-4 !py-2.5"
          >
            + Novo anúncio
          </Link>
        </div>

        {usuario.items.length === 0 ? (
          <div className="reuse-card p-12 text-center">
            <div className="text-5xl">📦</div>

            <h3 className="font-bold text-gray-800 mt-4">
              Você ainda não anunciou nada
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Publique algo que você não usa mais e ajude outra pessoa.
            </p>

            <Link
              href="/itens/novo"
              className="reuse-button-primary mt-5"
            >
              Criar primeiro anúncio
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {usuario.items.map((item) => {
              const status = {
                DISPONIVEL: "bg-green-100 text-green-700",
                PAUSADO: "bg-slate-100 text-slate-700",
                RESERVADO: "bg-yellow-100 text-yellow-700",
                DOADO: "bg-gray-100 text-gray-600",
              }[item.status] ?? "bg-gray-100 text-gray-600";

              return (
                <div
                  key={item.id}
                  className="reuse-card p-5 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Link
                      href={`/itens/${item.id}`}
                      className="flex-1"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-reuse-greenLight text-reuse-greenDark px-3 py-1 rounded-full text-xs font-semibold">
                          {item.category.name}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${status}`}
                        >
                          {item.status === "DISPONIVEL"
                            ? "Disponível"
                            : item.status === "PAUSADO"
                              ? "Pausado"
                              : item.status === "RESERVADO"
                                ? "Reservado"
                                : "Doado"}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-800 text-lg mt-3">
                        {item.title}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {item._count.interests}{" "}
                        {item._count.interests === 1
                          ? "pessoa interessada"
                          : "pessoas interessadas"}
                      </p>
                    </Link>

                    <ItemActions
                      itemId={item.id}
                      status={item.status}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}