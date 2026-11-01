import { Prisma } from "@prisma/client";
import { HttpError } from "../lib/http.js";
import type { InterestPanelData } from "../lib/interest-types.js";
import { ITEM_STATUS } from "../lib/item-status.js";
import { prisma } from "../lib/prisma.js";
import { requireLength, readString } from "../lib/validation.js";

/** Monta os dados do painel de interesses conforme o papel de quem consulta. */
export async function getInterestPanel(itemId: string, userId: string | null): Promise<InterestPanelData> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { ownerId: true, _count: { select: { interests: true } } },
  });

  if (!item) throw new HttpError(404, "Item não encontrado.", "not_found");

  if (userId === item.ownerId) {
    const interests = await prisma.interest.findMany({
      where: { itemId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      role: "owner",
      total: item._count.interests,
      ownInterest: null,
      interests: interests.map((interest) => ({
        id: interest.id,
        message: interest.message,
        createdAt: interest.createdAt.toISOString(),
        user: interest.user,
      })),
    };
  }

  if (userId) {
    const ownInterest = await prisma.interest.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });

    return {
      role: "visitor",
      total: item._count.interests,
      interests: [],
      ownInterest: ownInterest
        ? { id: ownInterest.id, message: ownInterest.message, createdAt: ownInterest.createdAt.toISOString() }
        : null,
    };
  }

  return { role: "anonymous", total: item._count.interests, interests: [], ownInterest: null };
}

/** Registra o interesse de um usuário em um item disponível de outra pessoa. */
export async function createInterest(itemId: string, userId: string, rawMessage: unknown) {
  const message = requireLength(readString(rawMessage, { max: 1000 }), "A mensagem", 10, 500);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { ownerId: true, status: true },
  });

  if (!item) throw new HttpError(404, "Item não encontrado.", "not_found");
  if (item.ownerId === userId) {
    throw new HttpError(400, "Você não pode manifestar interesse no próprio item.", "own_item");
  }
  if (item.status !== ITEM_STATUS.available) {
    throw new HttpError(409, "Este item não está mais disponível.", "item_unavailable");
  }

  const existing = await prisma.interest.findUnique({ where: { userId_itemId: { userId, itemId } }, select: { id: true } });
  if (existing) throw new HttpError(409, "Você já manifestou interesse neste item.", "duplicate_interest");

  try {
    return await prisma.interest.create({ data: { itemId, userId, message } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "Você já manifestou interesse neste item.", "duplicate_interest");
    }
    throw error;
  }
}
