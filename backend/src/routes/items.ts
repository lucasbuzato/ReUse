import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { requireUser, getSessionUserId } from "../lib/auth.js";
import { asyncHandler, HttpError, noStore } from "../lib/http.js";
import { ITEM_CONDITIONS, ITEM_STATUS, isItemStatus } from "../lib/item-status.js";
import { prisma } from "../lib/prisma.js";
import { readHttpUrl, readString, requireLength } from "../lib/validation.js";
import { createInterest, getInterestPanel } from "../services/interests.js";

export const itemInclude = {
  category: true,
  owner: { select: { name: true, city: true } },
  _count: { select: { interests: true } },
} satisfies Prisma.ItemInclude;

export const itemsRouter = Router();

function readCondition(value: unknown) {
  const condition = readString(value, { max: 40 });
  if (!ITEM_CONDITIONS.includes(condition as (typeof ITEM_CONDITIONS)[number])) {
    throw new HttpError(400, `Estado inválido. Use: ${ITEM_CONDITIONS.join(", ")}.`, "validation_error");
  }
  return condition;
}

async function requireCategory(categoryId: unknown) {
  const id = readString(categoryId, { max: 60 });
  const category = id ? await prisma.category.findUnique({ where: { id } }) : null;
  if (!category) throw new HttpError(400, "Categoria inválida.", "validation_error");
  return category;
}

async function requireOwnedItem(itemId: string, userId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, "Item não encontrado.", "not_found");
  if (item.ownerId !== userId) throw new HttpError(403, "Acesso negado.", "forbidden");
  return item;
}

/** Lista pública de itens, com busca por texto/cidade e filtro por categoria. */
itemsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = readString(req.query.q, { max: 80 });
    const categoryName = readString(req.query.category, { max: 60 });
    const categoryId = readString(req.query.categoryId, { max: 60 });
    const status = readString(req.query.status, { max: 20 }).toUpperCase() || ITEM_STATUS.available;
    const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 100);

    if (!isItemStatus(status)) throw new HttpError(400, "Status inválido.", "validation_error");

    const where: Prisma.ItemWhereInput = {
      status,
      ...(categoryId ? { categoryId } : {}),
      ...(categoryName ? { category: { name: categoryName } } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { owner: { city: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const items = await prisma.item.findMany({
      where,
      include: itemInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.set("Cache-Control", "public, max-age=0, s-maxage=15, stale-while-revalidate=60");
    res.json(items);
  })
);

itemsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await prisma.item.findUnique({ where: { id: req.params.id }, include: itemInclude });
    if (!item) throw new HttpError(404, "Item não encontrado.", "not_found");
    res.json(item);
  })
);

itemsRouter.post(
  "/",
  requireUser("Faça login para anunciar um item."),
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = requireLength(readString(body.title, { max: 200 }), "O título", 3, 120);
    const description = requireLength(readString(body.description, { max: 3000 }), "A descrição", 10, 2000);
    const condition = readCondition(body.condition);
    const imageUrl = readHttpUrl(body.imageUrl);
    const category = await requireCategory(body.categoryId);

    const item = await prisma.item.create({
      data: { title, description, condition, imageUrl, categoryId: category.id, ownerId: res.locals.userId as string },
      include: itemInclude,
    });

    res.status(201).json(item);
  })
);

/** Atualiza status (e, opcionalmente, dados) de um item do próprio usuário. */
itemsRouter.patch(
  "/:id",
  requireUser("Faça login."),
  asyncHandler(async (req, res) => {
    await requireOwnedItem(req.params.id, res.locals.userId as string);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Prisma.ItemUncheckedUpdateInput = {};

    if (body.status !== undefined) {
      if (!isItemStatus(body.status)) throw new HttpError(400, "Status inválido.", "validation_error");
      data.status = body.status;
    }
    if (body.title !== undefined) data.title = requireLength(readString(body.title, { max: 200 }), "O título", 3, 120);
    if (body.description !== undefined) {
      data.description = requireLength(readString(body.description, { max: 3000 }), "A descrição", 10, 2000);
    }
    if (body.condition !== undefined) data.condition = readCondition(body.condition);
    if (body.imageUrl !== undefined) data.imageUrl = readHttpUrl(body.imageUrl);
    if (body.categoryId !== undefined) data.categoryId = (await requireCategory(body.categoryId)).id;

    if (Object.keys(data).length === 0) throw new HttpError(400, "Nenhuma alteração informada.", "validation_error");

    const updated = await prisma.item.update({ where: { id: req.params.id }, data, include: itemInclude });
    res.json(updated);
  })
);

itemsRouter.delete(
  "/:id",
  requireUser("Faça login."),
  asyncHandler(async (req, res) => {
    await requireOwnedItem(req.params.id, res.locals.userId as string);
    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ ok: true, message: "Item removido com sucesso." });
  })
);

itemsRouter.get(
  "/:id/interests",
  asyncHandler(async (req, res) => {
    noStore(res);
    res.json(await getInterestPanel(req.params.id, getSessionUserId(req)));
  })
);

itemsRouter.post(
  "/:id/interests",
  requireUser("Faça login para manifestar interesse."),
  asyncHandler(async (req, res) => {
    noStore(res);
    const userId = res.locals.userId as string;
    await createInterest(req.params.id, userId, (req.body as Record<string, unknown> | undefined)?.message);
    res.status(201).json(await getInterestPanel(req.params.id, userId));
  })
);
