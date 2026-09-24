export default function ItemsLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando catálogo de itens">
      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="h-4 w-44 animate-pulse rounded bg-green-100" />
        <div className="mt-4 h-10 max-w-xl animate-pulse rounded-lg bg-gray-100" />
        <div className="mt-3 h-5 max-w-2xl animate-pulse rounded bg-gray-100" />
        <div className="mt-7 h-12 animate-pulse rounded-xl bg-gray-100" />
      </section>

      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-10 w-28 shrink-0 animate-pulse rounded-full bg-gray-100" />
        ))}
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="aspect-[4/3] animate-pulse bg-gray-100" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-24 animate-pulse rounded bg-green-100" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
