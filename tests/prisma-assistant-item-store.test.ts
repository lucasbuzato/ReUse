import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";
import { createPrismaAssistantItemStore } from "../lib/prisma-assistant-item-store";

type QueryArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

test("o adaptador Prisma filtra leitura e atualização por ownerId", async () => {
  const findManyCalls: QueryArgs[] = [];
  const updateManyCalls: QueryArgs[] = [];
  let findManyCount = 0;

  const transaction = {
    item: {
      async findMany(args: QueryArgs) {
        findManyCalls.push(args);
        findManyCount += 1;

        return [
          {
            id: "item-owner-1",
            title: "Item do proprietário",
            status: findManyCount === 1 ? "DISPONIVEL" : "PAUSADO",
            createdAt: new Date("2026-09-24T10:00:00.000Z"),
          },
        ];
      },
      async updateMany(args: QueryArgs) {
        updateManyCalls.push(args);
        return { count: 1 };
      },
    },
  };

  const client = {
    async $transaction(
      callback: (value: typeof transaction) => Promise<unknown>
    ) {
      return callback(transaction);
    },
  } as unknown as PrismaClient;

  const store = createPrismaAssistantItemStore(client);
  const result = await store.changeOwnedItemsStatus({
    userId: "owner-1",
    fromStatus: "DISPONIVEL",
    toStatus: "PAUSADO",
  });

  assert.equal(result.count, 1);
  assert.equal(findManyCalls.length, 2);
  assert.deepEqual(findManyCalls[0].where, {
    ownerId: "owner-1",
    status: "DISPONIVEL",
  });
  assert.deepEqual(updateManyCalls[0], {
    where: {
      ownerId: "owner-1",
      status: "DISPONIVEL",
      id: { in: ["item-owner-1"] },
    },
    data: {
      status: "PAUSADO",
    },
  });
  assert.deepEqual(findManyCalls[1].where, {
    ownerId: "owner-1",
    status: "PAUSADO",
    id: { in: ["item-owner-1"] },
  });
});
