import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getItems } from "@/lib/api";
import { plural } from "@/lib/format";
import ItemCard from "@/components/ui/ItemCard";
import EmptyState from "@/components/ui/EmptyState";
import { PlusIcon, SearchIcon } from "@/components/ui/Icons";

type Props = {
  searchParams: Promise<{ categoria?: string; busca?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { categoria } = await searchParams;
  return {
    title: categoria ? `${categoria} para doação e troca` : "Explorar itens",
    description: "Veja objetos disponíveis para doação e troca na sua região e demonstre interesse em poucos cliques.",
    alternates: { canonical: "/itens" },
  };
}

export default async function ItemsPage({ searchParams }: Props) {
  const params = await searchParams;
  const category = params.categoria?.trim().slice(0, 60) || undefined;
  const query = params.busca?.trim().slice(0, 80) || undefined;

  const [items, categories] = await Promise.all([getItems({ q: query, category, limit: 60 }), getCategories()]);

  const hrefFor = (nextCategory?: string) => {
    const search = new URLSearchParams();
    if (nextCategory) search.set("categoria", nextCategory);
    if (query) search.set("busca", query);
    const suffix = search.toString();
    return suffix ? `/itens?${suffix}` : "/itens";
  };

  const chip = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors ${
      active ? "border-brand bg-brand text-brand-on" : "border-line bg-surface text-ink hover:border-brand/60"
    }`;

  const hasFilters = Boolean(category || query);
  const totalAvailable = categories.reduce((sum, entry) => sum + (entry.availableItems ?? 0), 0);

  return (
    <div className="page pb-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Encontre algo para reutilizar</h1>
          <p className="mt-3 max-w-xl text-lg text-muted">
            Busque por nome, descrição ou cidade. Todos os itens são gratuitos para doação ou troca.
          </p>
        </div>
        <Link href="/itens/novo" className="btn-secondary shrink-0">
          <PlusIcon />
          Anunciar um item
        </Link>
      </header>

      <form action="/itens" method="get" role="search" className="mt-8">
        {category ? <input type="hidden" name="categoria" value={category} /> : null}
        <label htmlFor="busca" className="sr-only">
          Buscar itens por nome, descrição ou cidade
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              id="busca"
              name="busca"
              type="search"
              maxLength={80}
              defaultValue={query}
              placeholder="Ex.: bicicleta, livros, Campinas"
              className="field !min-h-12 !pl-12 text-base"
            />
          </div>
          <button type="submit" className="btn-primary !min-h-12 sm:w-36">
            Buscar
          </button>
          {hasFilters ? (
            <Link href="/itens" className="btn-ghost !min-h-12">
              Limpar filtros
            </Link>
          ) : null}
        </div>
      </form>

      <nav aria-label="Filtrar por categoria" className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <ul className="flex gap-2 sm:flex-wrap">
          <li>
            <Link href={hrefFor()} aria-current={!category ? "page" : undefined} className={chip(!category)}>
              Todos
              <span className={!category ? "text-brand-on/80" : "text-muted"}>{totalAvailable}</span>
            </Link>
          </li>
          {categories.map((entry) => {
            const active = category === entry.name;
            return (
              <li key={entry.id}>
                <Link href={hrefFor(entry.name)} aria-current={active ? "page" : undefined} className={chip(active)}>
                  {entry.name}
                  <span className={active ? "text-brand-on/80" : "text-muted"}>{entry.availableItems ?? 0}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-5 text-sm text-muted">
        <p aria-live="polite">
          {plural(items.length, "item encontrado", "itens encontrados")}
          {query ? (
            <>
              {" "}para <strong className="text-ink">“{query}”</strong>
            </>
          ) : null}
          {category ? (
            <>
              {" "}em <strong className="text-ink">{category}</strong>
            </>
          ) : null}
        </p>
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            title="Nenhum item com esses filtros"
            text="Tente outro termo, remova a categoria ou seja a primeira pessoa a anunciar algo parecido."
          >
            <Link href="/itens" className="btn-secondary">
              Limpar filtros
            </Link>
            <Link href="/itens/novo" className="btn-primary">
              Anunciar um item
            </Link>
          </EmptyState>
        ) : (
          <section aria-label="Itens disponíveis" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, index) => (
              <ItemCard key={item.id} item={item} priority={index < 4} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
