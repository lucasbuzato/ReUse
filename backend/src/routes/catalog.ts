import { Router } from "express";
import { asyncHandler, publicCache } from "../lib/http.js";
import { ITEM_STATUS } from "../lib/item-status.js";
import { prisma } from "../lib/prisma.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: { where: { status: ITEM_STATUS.available } } } } },
    });

    publicCache(res, 60);
    res.json(categories.map(({ _count, ...category }) => ({ ...category, availableItems: _count.items })));
  })
);

export const statsRouter = Router();

/** Números de impacto exibidos na landing page. */
statsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [byStatus, users, interests, categories, cities] = await Promise.all([
      prisma.item.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.interest.count(),
      prisma.category.count(),
      prisma.user.findMany({
        where: { role: "USER", city: { not: null } },
        distinct: ["city"],
        select: { city: true },
      }),
    ]);

    const countOf = (status: string) => byStatus.find((entry) => entry.status === status)?._count._all ?? 0;
    const total = byStatus.reduce((sum, entry) => sum + entry._count._all, 0);

    publicCache(res, 60);
    res.json({
      items: {
        total,
        available: countOf(ITEM_STATUS.available),
        reserved: countOf(ITEM_STATUS.reserved),
        donated: countOf(ITEM_STATUS.donated),
        paused: countOf(ITEM_STATUS.paused),
      },
      users,
      interests,
      categories,
      cities: cities.length,
      updatedAt: new Date().toISOString(),
    });
  })
);
