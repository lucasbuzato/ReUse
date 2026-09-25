import { ITEM_STATUS } from "./item-status";

export type OwnedItemSnapshot = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

export type ChangeOwnedItemsStatusInput = {
  userId: string;
  fromStatus: string;
  toStatus: string;
};

export type ChangeOwnedItemsStatusResult = {
  count: number;
  items: OwnedItemSnapshot[];
};

export interface AssistantItemStore {
  listOwnedItems(userId: string): Promise<OwnedItemSnapshot[]>;
  changeOwnedItemsStatus(
    input: ChangeOwnedItemsStatusInput
  ): Promise<ChangeOwnedItemsStatusResult>;
}

export type OwnedItemsSummary = {
  total: number;
  counts: {
    available: number;
    paused: number;
    reserved: number;
    donated: number;
    other: number;
  };
  activeItems: OwnedItemSnapshot[];
  pausedItems: OwnedItemSnapshot[];
};

export type AssistantItemMutationResult = {
  ok: true;
  operation: "pause" | "reactivate";
  affectedCount: number;
  items: OwnedItemSnapshot[];
  message: string;
};

export async function getOwnedItemsSummary(
  store: AssistantItemStore,
  userId: string
): Promise<OwnedItemsSummary> {
  const items = await store.listOwnedItems(userId);
  const counts = {
    available: 0,
    paused: 0,
    reserved: 0,
    donated: 0,
    other: 0,
  };

  for (const item of items) {
    if (item.status === ITEM_STATUS.available) counts.available += 1;
    else if (item.status === ITEM_STATUS.paused) counts.paused += 1;
    else if (item.status === ITEM_STATUS.reserved) counts.reserved += 1;
    else if (item.status === ITEM_STATUS.donated) counts.donated += 1;
    else counts.other += 1;
  }

  return {
    total: items.length,
    counts,
    activeItems: items.filter((item) => item.status === ITEM_STATUS.available),
    pausedItems: items.filter((item) => item.status === ITEM_STATUS.paused),
  };
}

export async function pauseOwnedAvailableItems(
  store: AssistantItemStore,
  userId: string
): Promise<AssistantItemMutationResult> {
  const result = await store.changeOwnedItemsStatus({
    userId,
    fromStatus: ITEM_STATUS.available,
    toStatus: ITEM_STATUS.paused,
  });

  return {
    ok: true,
    operation: "pause",
    affectedCount: result.count,
    items: result.items,
    message:
      result.count === 0
        ? "Você não tem anúncios disponíveis para pausar."
        : result.count === 1
          ? "1 anúncio foi pausado com sucesso."
          : `${result.count} anúncios foram pausados com sucesso.`,
  };
}

export async function reactivateOwnedPausedItems(
  store: AssistantItemStore,
  userId: string
): Promise<AssistantItemMutationResult> {
  const result = await store.changeOwnedItemsStatus({
    userId,
    fromStatus: ITEM_STATUS.paused,
    toStatus: ITEM_STATUS.available,
  });

  return {
    ok: true,
    operation: "reactivate",
    affectedCount: result.count,
    items: result.items,
    message:
      result.count === 0
        ? "Você não tem anúncios pausados para reativar."
        : result.count === 1
          ? "1 anúncio foi reativado com sucesso."
          : `${result.count} anúncios foram reativados com sucesso.`,
  };
}
