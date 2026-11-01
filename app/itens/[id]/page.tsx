import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ItemActions from "@/components/ItemActions";
import ItemInterestPanel from "@/components/ItemInterestPanel";
import ItemCard from "@/components/ui/ItemCard";
import ItemImage from "@/components/ui/ItemImage";
import StatusBadge from "@/components/ui/StatusBadge";
import { ArrowLeftIcon, CheckIcon, HeartIcon, PinIcon } from "@/components/ui/Icons";
import { getCurrentUser, getInterestPanel, getItem, getItems } from "@/lib/api";
import { formatDate, plural, timeAgo } from "@/lib/format";
import type { InterestPanelData } from "@/lib/interest-types";
import type { Item } from "@/lib/types";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ publicado?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id).catch(() => null);
  if (!item) return { title: "Item não encontrado" };
  const description = item.description.slice(0, 155);
  return {
    title: `${item.title} — ${item.category.name}`,
    description,
    alternates: { canonical: `/itens/${item.id}` },
    openGraph: {
      title: item.title,
      description,
      images: item.imageUrl ? [{ url: item.imageUrl }] : undefined,
    },
  };
}

async function loadInterestPanel(item: Item): Promise<InterestPanelData> {
  try {
    return await getInterestPanel(item.id);
  } catch {
    return { role: "anonymous", total: item._count.interests, interests: [], ownInterest: null };
  }
}

export default async function ItemDetailPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [item, user] = await Promise.all([getItem(id), getCurrentUser()]);
  if (!item) notFound();

  const [interestData, related] = await Promise.all([
    loadInterestPanel(item),
    getItems({ category: item.category.name, limit: 5 }).catch(() => [] as Item[]),
  ]);

  const isOwner = user?.id === item.ownerId;
  const justPublished = isOwner && query.publicado === "1";
  const relatedItems = related.filter((entry) => entry.id !== item.id).slice(0, 4);
  const showInterestPanel =
    item.status === "DISPONIVEL" || (interestData.role === "visitor" && Boolean(interestData.ownInterest));

  return (
    <div className="page pb-8 pt-6 sm:pt-8">
      <Link href="/itens" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon />
        Voltar para o catálogo
      </Link>

      {justPublished ? (
        <div role="status" className="mt-2 flex items-start gap-3 rounded-xl border border-brand/30 bg-brand-soft p-4 text-brand-text">
          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong className="font-semibold">Anúncio publicado.</strong> Ele já aparece no catálogo. Os interessados
            vão aparecer no fim desta página.
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line bg-soft">
            <ItemImage src={item.imageUrl} alt={item.title} priority />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/itens?categoria=${encodeURIComponent(item.category.name)}`} className="tag hover:underline">
              {item.category.name}
            </Link>
            <StatusBadge status={item.status} />
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{item.title}</h1>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {[
              { label: "Conservação", value: item.condition },
              { label: "Cidade", value: item.owner.city ?? "Não informada" },
              { label: "Publicado", value: timeAgo(item.createdAt), title: formatDate(item.createdAt) },
              { label: "Interessados", value: String(item._count.interests) },
            ].map((entry) => (
              <div key={entry.label} className="flex flex-col bg-surface px-4 py-3">
                <dt className="order-2 text-xs text-muted">{entry.label}</dt>
                <dd className="truncate font-semibold" title={entry.title}>
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="sobre-titulo" className="mt-8">
            <h2 id="sobre-titulo" className="text-lg font-semibold">
              Sobre este item
            </h2>
            <p className="mt-2 whitespace-pre-line text-muted">{item.description}</p>
          </section>

          <section aria-label="Quem anunciou" className="mt-8 flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand text-lg font-bold text-brand-on" aria-hidden="true">
              {item.owner.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">Anunciado por</p>
              <p className="truncate font-semibold">{isOwner ? `${item.owner.name} (você)` : item.owner.name}</p>
              <p className="flex items-center gap-1 text-sm text-muted">
                <PinIcon className="h-3.5 w-3.5" />
                {item.owner.city ?? "Cidade não informada"}
              </p>
            </div>
          </section>

          {isOwner ? (
            <section aria-labelledby="gerenciar-titulo" className="mt-6 rounded-xl border border-line bg-surface p-5">
              <h2 id="gerenciar-titulo" className="font-semibold">
                Gerenciar anúncio
              </h2>
              <p className="mt-1 text-sm text-muted">Atualize o status quando combinar a entrega ou remova o anúncio.</p>
              <ItemActions itemId={item.id} status={item.status} />
            </section>
          ) : showInterestPanel ? (
            <div className="mt-6">
              <ItemInterestPanel itemId={item.id} initialData={interestData} />
            </div>
          ) : (
            <section className="mt-6 rounded-xl border border-line bg-soft p-5" aria-labelledby="indisponivel-titulo">
              <h2 id="indisponivel-titulo" className="font-semibold">
                Este item não aceita novos interesses
              </h2>
              <p className="mt-1 text-sm text-muted">Ele já foi reservado, doado ou pausado por quem anunciou.</p>
              <Link href="/itens" className="btn-secondary mt-4">
                Ver outros itens
              </Link>
            </section>
          )}

          {!isOwner && item._count.interests > 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <HeartIcon className="h-4 w-4 text-brand-text" />
              {plural(item._count.interests, "pessoa já demonstrou interesse", "pessoas já demonstraram interesse")}
            </p>
          ) : null}
        </div>
      </div>

      {isOwner ? (
        <div className="mt-10">
          <ItemInterestPanel itemId={item.id} initialData={interestData} />
        </div>
      ) : null}

      {relatedItems.length > 0 ? (
        <section aria-labelledby="relacionados-titulo" className="mt-20">
          <h2 id="relacionados-titulo" className="text-2xl font-bold tracking-tight">
            Mais em {item.category.name}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedItems.map((entry) => (
              <ItemCard key={entry.id} item={entry} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
