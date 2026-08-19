const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const categorias = await Promise.all(
    ["Eletrônicos", "Móveis", "Roupas", "Livros", "Brinquedos"].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const senhaDemo = hashPassword("123456");
  const usuario1 = await prisma.user.upsert({
    where: { email: "maria@exemplo.com" },
    update: {},
    create: { name: "Maria Silva", email: "maria@exemplo.com", password: senhaDemo, city: "São Paulo" },
  });

  const usuario2 = await prisma.user.upsert({
    where: { email: "joao@exemplo.com" },
    update: {},
    create: { name: "João Souza", email: "joao@exemplo.com", password: senhaDemo, city: "Campinas" },
  });

  const cadeira = await prisma.item.findFirst({ where: { title: "Cadeira de escritório", ownerId: usuario1.id } });
  if (!cadeira) {
    await prisma.item.create({
      data: {
        title: "Cadeira de escritório",
        description: "Cadeira giratória em bom estado, pouco uso.",
        condition: "Seminovo",
        categoryId: categorias[1].id,
        ownerId: usuario1.id,
      },
    });
  }

  const notebook = await prisma.item.findFirst({ where: { title: "Notebook usado", ownerId: usuario2.id } });
  if (!notebook) {
    await prisma.item.create({
      data: {
        title: "Notebook usado",
        description: "Notebook funcionando, ideal para estudos.",
        condition: "Usado",
        categoryId: categorias[0].id,
        ownerId: usuario2.id,
      },
    });
  }

  console.log("Seed concluído com sucesso.");
  console.log("Contas de demonstração: maria@exemplo.com / 123456 e joao@exemplo.com / 123456");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
