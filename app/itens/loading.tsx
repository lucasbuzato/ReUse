export default function LoadingItems() {
  return (
    <div className="page pb-8 pt-10 sm:pt-14" aria-busy="true" aria-label="Carregando itens">
      <div className="h-4 w-24 animate-pulse rounded bg-soft" />
      <div className="mt-4 h-12 w-full max-w-lg animate-pulse rounded-lg bg-soft" />
      <div className="mt-8 h-12 w-full animate-pulse rounded-lg bg-soft" />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="aspect-[4/3] animate-pulse bg-soft" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-soft" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-soft" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-soft" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
