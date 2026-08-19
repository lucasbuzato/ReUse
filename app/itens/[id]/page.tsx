import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import FormularioInteresse from "@/components/FormularioInteresse";
import ItemActions from "@/components/ItemActions";

async function getItem(id: string) {
  return prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      owner: {
        select: {
          name: true,
          city: true,
        },
      },
      _count: {
        select: {
          interests: true,
        },
      },
    },
  });
}

async function getInterests(itemId: string) {
  return prisma.interest.findMany({
    where: {
      itemId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ItemDetalhePage({ params }: Props) {
  const { id } = await params;

  const [item, currentUserId] = await Promise.all([
    getItem(id),
    getCurrentUser(),
  ]);

  if (!item) {
    return notFound();
  }

  const isOwner = currentUserId === item.ownerId;

  const interests = isOwner
    ? await getInterests(item.id)
    : [];

  const statusInfo =
    {
      DISPONIVEL: {
        label: "Disponível",
        className: "bg-green-100 text-green-700 border-green-200",
        dot: "bg-green-500",
      },
      RESERVADO: {
        label: "Reservado",
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
        dot: "bg-yellow-500",
      },
      DOADO: {
        label: "Doado",
        className: "bg-gray-100 text-gray-600 border-gray-200",
        dot: "bg-gray-400",
      },
    }[item.status] ?? {
      label: item.status,
      className: "bg-gray-100 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
    };

  const initial = item.owner.name
    ? item.owner.name.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* VOLTAR */}
      <Link
        href="/itens"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-reuse-green transition"
      >
        <span className="text-lg">←</span>
        Voltar para itens
      </Link>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* IMAGEM */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="aspect-square bg-gray-50 flex items-center justify-center">

            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center px-6">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gray-100 flex items-center justify-center">
                  <span className="text-5xl">📦</span>
                </div>

                <p className="text-gray-500 font-medium mt-5">
                  Este item não possui imagem
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  O anunciante não adicionou uma foto.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* INFORMAÇÕES */}
        <div className="flex flex-col">

          {/* CATEGORIA + STATUS */}
          <div className="flex flex-wrap items-center gap-2">

            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-reuse-greenDark text-xs font-bold uppercase tracking-wide">
              {item.category.name}
            </span>

            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${statusInfo.className}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${statusInfo.dot}`}
              />

              {statusInfo.label}
            </span>

          </div>

          {/* TÍTULO */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mt-5">
            {item.title}
          </h1>

          {/* INFORMAÇÕES RÁPIDAS */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-5">

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                ✨
              </span>

              <div>
                <p className="text-xs text-gray-400">
                  Estado
                </p>

                <p className="font-medium text-gray-700">
                  {item.condition}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                📍
              </span>

              <div>
                <p className="text-xs text-gray-400">
                  Localização
                </p>

                <p className="font-medium text-gray-700">
                  {item.owner.city ?? "Não informada"}
                </p>
              </div>
            </div>

          </div>

          <div className="border-t border-gray-100 my-7" />

          {/* DESCRIÇÃO */}
          <section>
            <h2 className="text-lg font-bold text-gray-900">
              Sobre este item
            </h2>

            <p className="text-gray-600 leading-7 mt-3 whitespace-pre-line">
              {item.description}
            </p>
          </section>

          {/* DOADOR */}
          <div className="mt-7 rounded-2xl bg-gray-50 border border-gray-100 p-5">

            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              Anunciado por
            </p>

            <div className="flex items-center gap-4 mt-4">

              <div className="w-12 h-12 rounded-full bg-reuse-green text-white flex items-center justify-center font-bold text-lg shrink-0">
                {initial}
              </div>

              <div>
                <p className="font-bold text-gray-800">
                  {item.owner.name}
                </p>

                <p className="text-sm text-gray-500 mt-0.5">
                  {item.owner.city ?? "Cidade não informada"}
                </p>
              </div>

            </div>

          </div>

          {/* AÇÕES */}
          {isOwner ? (

            <div className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  ⚙️
                </div>

                <div>
                  <h2 className="font-bold text-gray-800">
                    Gerenciar anúncio
                  </h2>

                  <p className="text-xs text-gray-400">
                    Atualize o status ou remova seu anúncio.
                  </p>
                </div>
              </div>

              <ItemActions
                itemId={item.id}
                status={item.status}
              />
            </div>

          ) : item.status === "DISPONIVEL" ? (

            <div className="mt-7 rounded-2xl border border-green-100 bg-green-50/50 p-6">

              <div className="flex items-start gap-3 mb-5">

                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  💚
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Quero este item
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Demonstre seu interesse e entre em contato
                    com o doador.
                  </p>
                </div>

              </div>

              {currentUserId ? (

                <FormularioInteresse itemId={item.id} />

              ) : (

                <div className="bg-white border border-green-100 rounded-xl p-4">

                  <p className="text-sm text-gray-600 mb-4">
                    Você precisa estar conectado à sua conta
                    para demonstrar interesse neste item.
                  </p>

                </div>

              )}

            </div>

          ) : (

            <div className="mt-7 rounded-2xl bg-gray-50 border border-gray-100 p-5">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  ℹ️
                </div>

                <div>
                  <p className="font-semibold text-gray-700">
                    Item indisponível
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Este item não está mais disponível
                    para novos interessados.
                  </p>
                </div>

              </div>

            </div>

          )}

        </div>
      </div>

      {/* INTERESSES DO DONO */}
      {isOwner && (

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Pessoas interessadas
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {interests.length}{" "}
                {interests.length === 1
                  ? "pessoa demonstrou interesse"
                  : "pessoas demonstraram interesse"}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-xl">
              👥
            </div>

          </div>

          {interests.length === 0 ? (

            <div className="border border-dashed border-gray-200 rounded-2xl text-center py-12 mt-6">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-2xl">
                💬
              </div>

              <p className="font-semibold text-gray-700 mt-4">
                Ainda não há interessados
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Quando alguém demonstrar interesse,
                aparecerá aqui.
              </p>

            </div>

          ) : (

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

              {interests.map((interest) => (

                <li
                  key={interest.id}
                  className="border border-gray-100 rounded-2xl p-5 hover:border-green-100 hover:shadow-sm transition"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-green-50 text-reuse-greenDark flex items-center justify-center font-bold">
                        {interest.user.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800">
                          {interest.user.name}
                        </p>

                        <p className="text-xs text-gray-400 mt-0.5">
                          {interest.user.email}
                        </p>
                      </div>

                    </div>

                    <span className="text-lg">
                      💚
                    </span>

                  </div>

                  <div className="mt-4 bg-gray-50 rounded-xl p-3">

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {interest.message}
                    </p>

                  </div>

                </li>

              ))}

            </ul>

          )}

        </section>

      )}

    </div>
  );
}