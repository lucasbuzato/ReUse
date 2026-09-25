import type { PrismaClient } from "@prisma/client";
import type {
  AssistantItemStore,
  ChangeOwnedItemsStatusInput,
  OwnedItemSnapshot,
} from "./assistant-item-actions";

function toSnapshot(item: {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
}): OwnedItemSnapshot {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
  };
}

export function createPrismaAssistantItemStore(
  client: PrismaClient
): AssistantItemStore {
  return {
    async listOwnedItems(userId) {
      const items = await client.item.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return items.map(toSnapshot);
    },

    async changeOwnedItemsStatus({
      userId,
      fromStatus,
      toStatus,
    }: ChangeOwnedItemsStatusInput) {
      return client.$transaction(async (transaction) => {
        const candidates = await transaction.item.findMany({
          where: {
            ownerId: userId,
            status: fromStatus,
          },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        if (candidates.length === 0) {
          return { count: 0, items: [] };
        }

        const result = await transaction.item.updateMany({
          where: {
            ownerId: userId,
            status: fromStatus,
            id: {
              in: candidates.map((item) => item.id),
            },
          },
          data: {
            status: toStatus,
          },
        });

        const updatedItems = await transaction.item.findMany({
          where: {
            ownerId: userId,
            status: toStatus,
            id: {
              in: candidates.map((item) => item.id),
            },
          },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return {
          count: result.count,
          items: updatedItems.map(toSnapshot),
        };
      });
    },
  };
}
