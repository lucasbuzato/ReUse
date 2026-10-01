import assert from "node:assert/strict";
import test from "node:test";
import {
  type AssistantItemStore,
  type ChangeOwnedItemsStatusInput,
  getOwnedItemsSummary,
  pauseOwnedAvailableItems,
  reactivateOwnedPausedItems,
} from "../lib/assistant-item-actions";

function createStore(): AssistantItemStore & {
  changes: ChangeOwnedItemsStatusInput[];
} {
  const changes: ChangeOwnedItemsStatusInput[] = [];

  return {
    changes,
    async listOwnedItems(userId) {
      assert.equal(userId, "owner-1");
      return [
        {
          id: "available-1",
          title: "Cadeira",
          status: "DISPONIVEL",
          createdAt: "2026-09-24T10:00:00.000Z",
        },
        {
          id: "paused-1",
          title: "Livro",
          status: "PAUSADO",
          createdAt: "2026-09-23T10:00:00.000Z",
        },
        {
          id: "donated-1",
          title: "Mesa",
          status: "DOADO",
          createdAt: "2026-09-22T10:00:00.000Z",
        },
      ];
    },
    async changeOwnedItemsStatus(input) {
      changes.push(input);
      return {
        count: 1,
        items: [
          {
            id: "changed-1",
            title: "Item alterado",
            status: input.toStatus,
            createdAt: "2026-09-24T10:00:00.000Z",
          },
        ],
      };
    },
  };
}

test("resume apenas os anúncios do usuário autenticado", async () => {
  const summary = await getOwnedItemsSummary(createStore(), "owner-1");

  assert.equal(summary.total, 3);
  assert.deepEqual(summary.counts, {
    available: 1,
    paused: 1,
    reserved: 0,
    donated: 1,
    other: 0,
  });
  assert.deepEqual(summary.activeItems.map((item) => item.id), ["available-1"]);
  assert.deepEqual(summary.pausedItems.map((item) => item.id), ["paused-1"]);
});

test("pausa somente DISPONIVEL e mantém o userId autenticado", async () => {
  const store = createStore();
  const result = await pauseOwnedAvailableItems(store, "owner-1");

  assert.deepEqual(store.changes, [
    {
      userId: "owner-1",
      fromStatus: "DISPONIVEL",
      toStatus: "PAUSADO",
    },
  ]);
  assert.equal(result.operation, "pause");
  assert.equal(result.affectedCount, 1);
});

test("reativa somente PAUSADO e mantém o userId autenticado", async () => {
  const store = createStore();
  const result = await reactivateOwnedPausedItems(store, "owner-1");

  assert.deepEqual(store.changes, [
    {
      userId: "owner-1",
      fromStatus: "PAUSADO",
      toStatus: "DISPONIVEL",
    },
  ]);
  assert.equal(result.operation, "reactivate");
  assert.equal(result.affectedCount, 1);
});
