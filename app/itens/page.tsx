import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getItems(category?: string, query?: string) {
  return prisma.item.findMany({
    where: {
      status: "DISPONIVEL",
      ...(category
        ? {
            category: {
              name: category,
            },
          }
        : {}),
      ...(query
        ? {
            OR: [
              {
                title: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
              {
                owner: {
                  city: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
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

async function getCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

type Props = {
  searchParams: Promise<{
    categoria?: string;
    busca?: string;
  }>;
};

export default async function ItemsPage({ searchParams }: Props) {
  const params = await searchParams;
  const category = params.categoria?.trim() || undefined;
  const query = params.busca?.trim().slice(0, 80) || undefined;

  const [items, categories] = await Promise.all([
    getItems(category, query),
    getCategories(),
  ]);

  function categoryHref(nextCategory?: string) {
    const search = new URLSearchParams();
    if (nextCategory) search.set("categoria", nextCategory);
    if (query) search.set("busca", query);
    const suffix = search.toString();
    return suffix ? `/itens?${suffix}` : "/itens";
  }

  const hasFilters = Boolean(category || query);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-green-900/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-reuse-green">
              Explore a comunidade
            </p>
            <h1 className="mt-2 text-3xl font-bold text-reuse-greenDark sm:text-4xl">
              Encontre algo para reutilizar
            </h1>
            <p className="mt-2 max-w-2xl leading-7 text-gray-600">
              Busque por nome, descrição ou cidade e dê uma nova história a um item disponível.
            </p>
          </div>

          <Link href="/itens/novo" className="reuse-button-primary shrink-0">
            <span aria-hidden="true">＋</span>
            Anunciar item
          </Link>
        </div>

        <form action="/itens" method="get" role="search" className="mt-7">
          {category && <input type="hidden" name="categoria" value={category} />}
          <label htmlFor="catalog-search" className="sr-only">
            Buscar itens por nome, descrição ou cidade
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span
                className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400"
                aria-hidden="true"
              >
                ⌕
              </span>
              <input
                id="catalog-search"
                name="busca"
                type="search"
                maxLength={80}
                defaultValue={query}
                placeholder="Ex.: bicicleta, livros ou São Paulo"
                className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-reuse-green focus:bg-white focus:ring-2 focus:ring-green-100"
              />
            </div>
            <button type="submit" className="reuse-button-primary min-h-12 sm:min-w-32">
              Buscar
            </button>
            {hasFilters && (
              <Link href="/itens" className="reuse-button min-h-12 border border-gray-200 bg-white text-gray-700 hover:border-reuse-green hover:text-reuse-green">
                Limpar
              </Link>
            )}
          </div>
        </form>
      </section>

      <section aria-labelledby="categories-title">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="categories-title" className="font-bold text-gray-900">
              Categorias
            </h2>
            {query && (
              <p className="mt-1 text-sm text-gray-500">
                Resultados para “{query}”
              </p>
            )}
          </div>
          <span className="text-sm font-medium text-gray-500" aria-live="polite">
            {items.length} {items.length === 1 ? "item encontrado" : "itens encontrados"}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar por categoria">
          <Link
            href={categoryHref()}
            aria-current={!category ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reuse-green focus-visible:ring-offset-2 ${
              !category
                ? "border-reuse-green bg-reuse-green text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-reuse-green hover:text-reuse-green"
            }`}
          >
            Todos
          </Link>

          {categories.map((itemCategory) => (
            <Link
              key={itemCategory.id}
              href={categoryHref(itemCategory.name)}
              aria-current={category === itemCategory.name ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reuse-green focus-visible:ring-offset-2 ${
                category === itemCategory.name
                  ? "border-reuse-green bg-reuse-green text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-reuse-green hover:text-reuse-green"
              }`}
            >
              {itemCategory.name}
            </Link>
          ))}
        </div>
      </section>

      {items.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center sm:p-14" aria-labelledby="empty-title">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-reuse-greenLight text-3xl" aria-hidden="true">
            📦
          </div>
          <h2 id="empty-title" className="mt-5 text-xl font-bold text-gray-900">
            Nenhum item corresponde aos filtros
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
            Tente outro termo, remova a categoria ou seja a primeira pessoa a anunciar algo parecido.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/itens" className="reuse-button border border-gray-200 bg-white text-gray-700 hover:border-reuse-green hover:text-reuse-green">
              Limpar filtros
            </Link>
            <Link href="/itens/novo" className="reuse-button-primary">
              Anunciar um item
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Itens disponíveis">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/itens/${item.id}`}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-green-100 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reuse-green focus-visible:ring-offset-4"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={`Foto do item ${item.title}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
                    <span className="text-5xl" aria-hidden="true">📦</span>
                    <span className="mt-2 text-xs">Sem imagem</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-reuse-green">
                    {item.category.name}
                  </span>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">
                    Disponível
                  </span>
                </div>

                <h2 className="mt-2 text-lg font-bold text-gray-900 transition group-hover:text-reuse-green">
                  {item.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                  {item.description}
                </p>

                <div className="mt-5 flex items-start justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-600">
                  <span>✨ {item.condition}</span>
                  <span className="text-right">📍 {item.owner.city ?? "Local não informado"}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
