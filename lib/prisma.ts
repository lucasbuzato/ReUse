import { PrismaClient } from "@prisma/client";

// Evita múltiplas instâncias do Prisma Client em ambiente de desenvolvimento
// (o Next.js recarrega módulos a cada alteração de código - "hot reload")
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
