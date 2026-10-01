import Link from "next/link";
import { notFound } from "next/navigation";
import ItemActions from "@/components/ItemActions";
import ItemInterestPanel from "@/components/ItemInterestPanel";
import { getCurrentUser } from "@/lib/auth";
import type { InterestPanelData } from "@/lib/interest-types";
import { prisma } from "@/lib/prisma";

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

async function getInitialInterestData({
  itemId,
  ownerId,
  currentUserId,
  total,
}: {
  itemId: string;
  ownerId: string;
  currentUserId: string | null;
  total: number;
}): Promise<InterestPanelData> {
  if (currentUserId === ownerId) {
    const interests = await prisma.interest.findMany({
      where: { itemId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      role: "owner",
      total,
      ownInterest: null,
      interests: interests.map((interest) => ({
        id: interest.id,
        message: interest.message,
        createdAt: interest.createdAt.toISOString(),
        user: interest.user,
      })),
    };
  }

  if (currentUserId) {
    const ownInterest = await prisma.interest.findUnique({
      where: {
        userId_itemId: {
          userId: currentUserId,
          itemId,
        },
      },
    });

    return {
      role: "visitor",
      total,
      interests: [],
      ownInterest: ownInterest
        ? {
            id: ownInterest.id,
            message: ownInterest.message,
            createdAt: ownInterest.createdAt.toISOString(),
          }
        : null,
    };
  }

  return {
    role: "anonymous",
    total,
    interests: [],
    ownInterest: null,
  };
}

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const [item, currentUserId] = await Promise.all([
    getItem(id),
    getCurrentUser(),
  ]);

  if (!item) {
    notFound();
  }

  const isOwner = currentUserId === item.ownerId;
  const interestData = await getInitialInterestData({
    itemId: item.id,
    ownerId: item.ownerId,
    currentUserId,
    total: item._count.interests,
  });

  const statusInfo: Record<
    string,
    { label: string; className: string; dot: string }
  > = {
    DISPONIVEL: {
      label: "Disponível",
      className: "border-green-200 bg-green-100 text-green-800",
      dot: "bg-green-500",
    },
    PAUSADO: {
      label: "Pausado",
      className: "border-slate-200 bg-slate-100 text-slate-700",
      dot: "bg-slate-500",
    },
    RESERVADO: {
      label: "Reservado",
      className: "border-amber-200 bg-amber-100 text-amber-800",
      dot: "bg-amber-500",
    },
    DOADO: {
      label: "Doado",
      className: "border-gray-200 bg-gray-100 text-gray-700",
      dot: "bg-gray-500",
    },
  };

  const status = statusInfo[item.status] ?? {
    label: item.status,
    className: "border-gray-200 bg-gray-100 text-gray-700",
    dot: "bg-gray-500",
  };

  const shouldShowInterestPanel =
    item.status === "DISPONIVEL" ||
    (interestData.role === "visitor" && Boolean(interestData.ownInterest));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        href="/itens"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-gray-600 transition hover:bg-white hover:text-reuse-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reuse-green"
      >
        <span aria-hidden="true">←</span>
        Voltar para o catálogo
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex aspect-square items-center justify-center bg-gray-50">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={`Foto do item ${item.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="px-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-reuse-greenLight" aria-hidden="true">
                  <span className="text-5xl">📦</span>
                </div>
                <p className="mt-5 font-semibold text-gray-600">Item sem foto</p>
                <p className="mt-1 text-sm text-gray-500">
                  O anunciante não adicionou uma imagem.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-reuse-greenDark">
              {item.category.name}
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}
            >
              <span className={`h-2 w-2 rounded-full ${status.dot}`} aria-hidden="true" />
              {status.label}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-tight text-gray-950 sm:text-4xl">
            {item.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm" aria-hidden="true">
                ✨
              </span>
              <div>
                <p className="text-xs text-gray-500">Conservação</p>
                <p className="font-semibold text-gray-800">{item.condition}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm" aria-hidden="true">
                📍
              </span>
              <div>
                <p className="text-xs text-gray-500">Localização</p>
                <p className="font-semibold text-gray-800">
                  {item.owner.city ?? "Não informada"}
                </p>
              </div>
            </div>
          </div>

          <div className="my-7 border-t border-gray-200" />

          <section aria-labelledby="item-description-title">
            <h2 id="item-description-title" className="text-lg font-bold text-gray-950">
              Sobre este item
            </h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-gray-700">
              {item.description}
            </p>
          </section>

          <div className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Anunciado por
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-reuse-green text-lg font-bold text-white" aria-hidden="true">
                {item.owner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{item.owner.name}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {item.owner.city ?? "Cidade não informada"}
                </p>
              </div>
            </div>
          </div>

          {isOwner ? (
            <section className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" aria-labelledby="manage-title">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100" aria-hidden="true">
                  ⚙️
                </div>
                <div>
                  <h2 id="manage-title" className="font-bold text-gray-900">Gerenciar anúncio</h2>
                  <p className="text-sm text-gray-500">
                    Atualize o status ou remova este item.
                  </p>
                </div>
              </div>
              <ItemActions itemId={item.id} status={item.status} />
            </section>
          ) : shouldShowInterestPanel ? (
            <ItemInterestPanel itemId={item.id} initialData={interestData} />
          ) : (
            <section className="mt-7 rounded-2xl border border-gray-200 bg-gray-100 p-5" aria-labelledby="unavailable-title">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white" aria-hidden="true">
                  ℹ️
                </div>
                <div>
                  <h2 id="unavailable-title" className="font-semibold text-gray-800">Item indisponível</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Este anúncio não aceita novos interesses no momento.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {isOwner && (
        <ItemInterestPanel itemId={item.id} initialData={interestData} />
      )}
    </div>
  );
}
