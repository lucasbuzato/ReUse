import { PrismaClient } from "@prisma/client";

// Uma única instância por processo (evita esgotar conexões em dev com hot reload
// e reaproveita a conexão entre invocações da mesma função serverless).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
