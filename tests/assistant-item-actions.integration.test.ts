import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import {
  pauseOwnedAvailableItems,
  reactivateOwnedPausedItems,
} from "../lib/assistant-item-actions";
import { createPrismaAssistantItemStore } from "../lib/prisma-assistant-item-store";

const shouldRun = process.env.RUN_DATABASE_TESTS === "1";

test(
  "integração: pausa e reativa somente itens do proprietário autenticado",
  { skip: !shouldRun },
  async () => {
    const prisma = new PrismaClient();
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const category = await prisma.category.create({
      data: { name: `Categoria Assistant ${suffix}` },
    });
    const owner = await prisma.user.create({
      data: {
        name: "Owner Assistant Test",
        email: `owner-${suffix}@example.test`,
        password: "test-only",
      },
    });
    const otherOwner = await prisma.user.create({
      data: {
        name: "Other Owner Assistant Test",
        email: `other-${suffix}@example.test`,
        password: "test-only",
      },
    });

    try {
      const [ownerAvailable, ownerPaused, otherAvailable] =
        await Promise.all([
          prisma.item.create({
            data: {
              title: "Disponível do proprietário",
              description: "Teste de integração",
              condition: "Usado",
              status: "DISPONIVEL",
              ownerId: owner.id,
              categoryId: category.id,
            },
          }),
          prisma.item.create({
            data: {
              title: "Pausado do proprietário",
              description: "Teste de integração",
              condition: "Usado",
              status: "PAUSADO",
              ownerId: owner.id,
              categoryId: category.id,
            },
          }),
          prisma.item.create({
            data: {
              title: "Disponível de outra pessoa",
              description: "Teste de integração",
              condition: "Usado",
              status: "DISPONIVEL",
              ownerId: otherOwner.id,
              categoryId: category.id,
            },
          }),
        ]);

      const store = createPrismaAssistantItemStore(prisma);
      const paused = await pauseOwnedAvailableItems(store, owner.id);

      assert.equal(paused.affectedCount, 1);
      assert.deepEqual(paused.items.map((item) => item.id), [ownerAvailable.id]);

      const afterPause = await prisma.item.findMany({
        where: {
          id: { in: [ownerAvailable.id, ownerPaused.id, otherAvailable.id] },
        },
        select: { id: true, status: true },
      });
      const statusAfterPause = new Map(
        afterPause.map((item) => [item.id, item.status])
      );

      assert.equal(statusAfterPause.get(ownerAvailable.id), "PAUSADO");
      assert.equal(statusAfterPause.get(ownerPaused.id), "PAUSADO");
      assert.equal(statusAfterPause.get(otherAvailable.id), "DISPONIVEL");

      const reactivated = await reactivateOwnedPausedItems(store, owner.id);
      assert.equal(reactivated.affectedCount, 2);

      const otherAfterReactivate = await prisma.item.findUniqueOrThrow({
        where: { id: otherAvailable.id },
        select: { status: true },
      });
      assert.equal(otherAfterReactivate.status, "DISPONIVEL");
    } finally {
      await prisma.interest.deleteMany({
        where: { item: { categoryId: category.id } },
      });
      await prisma.item.deleteMany({ where: { categoryId: category.id } });
      await prisma.user.deleteMany({
        where: { id: { in: [owner.id, otherOwner.id] } },
      });
      await prisma.category.delete({ where: { id: category.id } });
      await prisma.$disconnect();
    }
  }
);
