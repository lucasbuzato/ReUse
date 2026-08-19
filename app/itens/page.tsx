import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getItens(categoria?: string) {
  return prisma.item.findMany({
    where: {
      status: "DISPONIVEL",
      ...(categoria
        ? {
            category: {
              name: categoria,
            },
          }
        : {}),
    },
    include: {
      category: true,
      owner: {
        select: {
          name: true,
          city: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getCategorias() {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

type Props = {
  searchParams: Promise<{
    categoria?: string;
  }>;
};

export default async function ItensPage({ searchParams }: Props) {
  const params = await searchParams;
  const categoria = params.categoria;

  const [itens, categorias] = await Promise.all([
    getItens(categoria),
    getCategorias(),
  ]);

  return (
    <div className="space-y-8">
      {/* CABEÇALHO */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-reuse-green uppercase tracking-wide">
              Explore a comunidade
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-reuse-greenDark mt-1">
              Encontre algo para reutilizar
            </h1>

            <p className="text-gray-500 mt-2 max-w-2xl">
              Descubra itens disponíveis para doação e dê uma nova vida ao que
              outras pessoas não utilizam mais.
            </p>
          </div>

          <Link
            href="/itens/novo"
            className="inline-flex items-center justify-center gap-2 bg-reuse-green text-white px-5 py-3 rounded-xl font-semibold hover:bg-reuse-greenDark transition"
          >
            + Anunciar item
          </Link>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">
            Categorias
          </h2>

          <span className="text-sm text-gray-400">
            {itens.length}{" "}
            {itens.length === 1 ? "item encontrado" : "itens encontrados"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/itens"
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              !categoria
                ? "bg-reuse-green text-white border-reuse-green"
                : "bg-white text-gray-600 border-gray-200 hover:border-reuse-green hover:text-reuse-green"
            }`}
          >
            Todos
          </Link>

          {categorias.map((cat) => (
            <Link
              key={cat.id}
              href={`/itens?categoria=${encodeURIComponent(cat.name)}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                categoria === cat.name
                  ? "bg-reuse-green text-white border-reuse-green"
                  : "bg-white text-gray-600 border-gray-200 hover:border-reuse-green hover:text-reuse-green"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* LISTA */}
      {itens.length === 0 ? (
        <section className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📦</div>

          <h2 className="text-lg font-bold text-gray-800">
            Nenhum item encontrado
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Ainda não existem itens disponíveis nessa categoria.
          </p>

          <Link
            href="/itens/novo"
            className="inline-flex mt-5 bg-reuse-green text-white px-5 py-2.5 rounded-xl font-semibold"
          >
            Anunciar um item
          </Link>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {itens.map((item) => (
            <Link
              key={item.id}
              href={`/itens/${item.id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              {/* IMAGEM */}
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="text-5xl">📦</span>
                    <span className="text-xs mt-2">
                      Sem imagem
                    </span>
                  </div>
                )}
              </div>

              {/* INFORMAÇÕES */}
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-reuse-green">
                    {item.category.name}
                  </span>

                  <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                    Disponível
                  </span>
                </div>

                <h2 className="text-lg font-bold text-gray-800 mt-2 group-hover:text-reuse-green transition">
                  {item.title}
                </h2>

                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    ✨ {item.condition}
                  </span>

                  <span className="text-xs text-gray-500">
                    📍 {item.owner.city ?? "Local não informado"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}