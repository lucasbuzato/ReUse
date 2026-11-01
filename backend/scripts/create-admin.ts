// Cria ou atualiza uma conta do painel administrativo sem expor a senha no código.
// Uso: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="..." ADMIN_ROLE=ADMIN|VIEWER npm run admin:create
import { PrismaClient, type UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";

try {
  process.loadEnvFile();
} catch {
  // sem .env: usa as variáveis do ambiente
}

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME?.trim() || "Equipe ReUse!";
const role = (process.env.ADMIN_ROLE?.trim().toUpperCase() || "ADMIN") as UserRole;

if (!email || password.length < 8 || !["ADMIN", "VIEWER"].includes(role)) {
  console.error("Defina ADMIN_EMAIL, ADMIN_PASSWORD (mín. 8 caracteres) e ADMIN_ROLE (ADMIN ou VIEWER).");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.upsert({
    where: { email },
    update: { role, password: hashPassword(password), name },
    create: { email, name, role, password: hashPassword(password), city: "São Paulo" },
    select: { email: true, role: true },
  });
  console.log(`Conta do painel pronta: ${user.email} (${user.role}).`);
} finally {
  await prisma.$disconnect();
}
