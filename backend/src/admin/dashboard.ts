import { ITEM_STATUS_LABELS, ITEM_STATUS_VALUES } from "../lib/item-status.js";
import { prisma } from "../lib/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dados do painel inicial da área administrativa (KPIs, status, categorias, campanhas). */
export async function buildDashboardData() {
  const since30d = new Date(Date.now() - 30 * DAY_MS);

  const [users, newUsers30d, byStatus, interests, interests30d, categories, utmSources, utmCampaigns, recentItems] =
    await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: since30d } } }),
      prisma.item.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.interest.count(),
      prisma.interest.count({ where: { createdAt: { gte: since30d } } }),
      prisma.category.findMany({ include: { _count: { select: { items: true } } } }),
      prisma.user.groupBy({ by: ["utmSource"], where: { role: "USER" }, _count: { _all: true } }),
      prisma.user.groupBy({
        by: ["utmCampaign"],
        where: { role: "USER", utmCampaign: { not: null } },
        _count: { _all: true },
      }),
      prisma.item.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          category: { select: { name: true } },
          owner: { select: { name: true, city: true } },
          _count: { select: { interests: true } },
        },
      }),
    ]);

  const statusCounts = ITEM_STATUS_VALUES.map((status) => ({
    status,
    label: ITEM_STATUS_LABELS[status],
    count: byStatus.find((entry) => entry.status === status)?._count._all ?? 0,
  }));
  const totalItems = statusCounts.reduce((sum, entry) => sum + entry.count, 0);
  const donated = statusCounts.find((entry) => entry.status === "DOADO")?.count ?? 0;

  return {
    kpis: {
      users,
      newUsers30d,
      totalItems,
      available: statusCounts.find((entry) => entry.status === "DISPONIVEL")?.count ?? 0,
      donated,
      donationRate: totalItems > 0 ? Math.round((donated / totalItems) * 100) : 0,
      interests,
      interests30d,
    },
    statusCounts,
    topCategories: categories
      .map((category) => ({ name: category.name, count: category._count.items }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    utmSources: utmSources
      .map((entry) => ({ label: entry.utmSource ?? "direto / orgânico", count: entry._count._all }))
      .sort((a, b) => b.count - a.count),
    utmCampaigns: utmCampaigns
      .map((entry) => ({ label: entry.utmCampaign ?? "", count: entry._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    recentItems: recentItems.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      statusLabel: ITEM_STATUS_LABELS[item.status as keyof typeof ITEM_STATUS_LABELS] ?? item.status,
      category: item.category.name,
      owner: item.owner.name,
      city: item.owner.city,
      interests: item._count.interests,
      createdAt: item.createdAt.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  };
}

export type DashboardData = Awaited<ReturnType<typeof buildDashboardData>>;
