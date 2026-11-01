// Dados de demonstração do ReUse! (idempotente: pode rodar mais de uma vez).
// Pessoas e e-mails são fictícios (domínio reservado .example). Fotos: Unsplash License.
// Uso: SEED_PASSWORD="..." npm run prisma:seed   (em banco local a senha padrão é usada)
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";

try {
  process.loadEnvFile();
} catch {
  // sem .env: usa as variáveis do ambiente
}

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

const databaseUrl = process.env.DATABASE_URL ?? "";
const isLocalDatabase = /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl);
const seedPassword = process.env.SEED_PASSWORD ?? (isLocalDatabase ? "reuse-demo-local" : "");

if (seedPassword.length < 8) {
  console.error("Defina SEED_PASSWORD (mínimo de 8 caracteres) para popular um banco remoto.");
  process.exit(1);
}

const CATEGORIES = [
  "Brinquedos",
  "Casa e cozinha",
  "Eletrônicos",
  "Esportes e lazer",
  "Instrumentos musicais",
  "Livros",
  "Móveis",
  "Roupas",
] as const;

type Utm = [source: string, medium: string, campaign: string] | null;

const USERS: Array<{ key: string; name: string; city: string; utm: Utm; daysAgo: number }> = [
  { key: "ana", name: "Ana Ribeiro", city: "São Paulo", utm: ["google", "cpc", "lancamento_reuse"], daysAgo: 44 },
  { key: "bruno", name: "Bruno Carvalho", city: "Campinas", utm: ["instagram", "paid_social", "lancamento_reuse"], daysAgo: 41 },
  { key: "carla", name: "Carla Mendes", city: "Santos", utm: null, daysAgo: 38 },
  { key: "diego", name: "Diego Alves", city: "Guarulhos", utm: ["facebook", "paid_social", "lancamento_reuse"], daysAgo: 33 },
  { key: "eduarda", name: "Eduarda Lima", city: "Santo André", utm: ["google", "cpc", "doacao_moveis"], daysAgo: 25 },
  { key: "felipe", name: "Felipe Rocha", city: "Sorocaba", utm: ["linkedin", "paid_social", "semana_sustentavel"], daysAgo: 19 },
  { key: "gabriela", name: "Gabriela Nunes", city: "Osasco", utm: ["whatsapp", "referral", "indique_amigos"], daysAgo: 16 },
  { key: "henrique", name: "Henrique Dias", city: "São Bernardo do Campo", utm: ["tiktok", "paid_social", "lancamento_reuse"], daysAgo: 12 },
  { key: "demo", name: "Júlia Martins", city: "São Paulo", utm: ["google", "cpc", "lancamento_reuse"], daysAgo: 9 },
];

type Status = "DISPONIVEL" | "RESERVADO" | "DOADO" | "PAUSADO";

const ITEMS: Array<{
  owner: string;
  category: (typeof CATEGORIES)[number];
  condition: "Novo" | "Seminovo" | "Usado";
  status: Status;
  daysAgo: number;
  title: string;
  description: string;
  image: string;
}> = [
  { owner: "ana", category: "Esportes e lazer", condition: "Usado", status: "DISPONIVEL", daysAgo: 2, image: "bicicleta", title: "Bicicleta urbana aro 26 com cestinha", description: "Bicicleta de passeio com quadro de aço, cestinha e 6 marchas. Pneus calibrados e freios revisados no mês passado. Ideal para deslocamentos curtos e passeios no parque." },
  { owner: "bruno", category: "Móveis", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 4, image: "cadeira", title: "Cadeira de madeira estilo escandinavo", description: "Cadeira em madeira clara, assento anatômico e estrutura firme. Usada em home office por menos de um ano, sem riscos aparentes." },
  { owner: "carla", category: "Livros", condition: "Usado", status: "DISPONIVEL", daysAgo: 6, image: "livros-literatura", title: "Coleção de clássicos da literatura (12 livros)", description: "Machado de Assis, Clarice Lispector, Graciliano Ramos e outros autores. Edições de bolso em bom estado, algumas com anotações a lápis. Ótimo para o vestibular." },
  { owner: "diego", category: "Instrumentos musicais", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 3, image: "violao", title: "Violão acústico com capa acolchoada", description: "Violão de cordas de aço com capa e afinador. Cordas trocadas recentemente. Perfeito para quem está começando a tocar." },
  { owner: "eduarda", category: "Eletrônicos", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 1, image: "monitor", title: "Monitor 27 polegadas com suporte", description: "Monitor IPS de 27 polegadas com suporte ajustável e cabo HDMI. Sem pixels mortos. Troquei de modelo e quero que este continue sendo útil." },
  { owner: "felipe", category: "Eletrônicos", condition: "Usado", status: "DISPONIVEL", daysAgo: 9, image: "teclado-mecanico", title: "Teclado mecânico compacto (75%)", description: "Teclado mecânico com switches marrons e conexão USB-C. Algumas teclas com leve desgaste. Acompanha o cabo." },
  { owner: "gabriela", category: "Eletrônicos", condition: "Usado", status: "RESERVADO", daysAgo: 12, image: "camera-analogica", title: "Câmera analógica 35 mm", description: "Câmera de filme clássica com lente 50 mm f/1.8 e fotômetro funcionando. Ideal para quem quer explorar a fotografia analógica." },
  { owner: "henrique", category: "Casa e cozinha", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 5, image: "luminaria", title: "Luminária de mesa cogumelo", description: "Luminária com cúpula branca e luz amarela aconchegante. Acompanha lâmpada LED e funciona perfeitamente." },
  { owner: "ana", category: "Casa e cozinha", condition: "Usado", status: "DISPONIVEL", daysAgo: 14, image: "panelas", title: "Panela de ferro fundido 24 cm", description: "Panela de ferro fundido com tampa, curada e pronta para uso. Ótima para feijão, cozidos e assados. Muito durável." },
  { owner: "bruno", category: "Casa e cozinha", condition: "Usado", status: "DOADO", daysAgo: 30, image: "cafeteira-moka", title: "Cafeteira italiana para 6 xícaras", description: "Cafeteira de alumínio para fogão, com vedação nova. Faz um café encorpado em poucos minutos." },
  { owner: "carla", category: "Roupas", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 7, image: "jaqueta-jeans", title: "Jaqueta jeans masculina tamanho M", description: "Jaqueta jeans escura com gola de veludo cotelê. Pouquíssimo uso; ficou pequena. Sem manchas ou rasgos." },
  { owner: "diego", category: "Roupas", condition: "Usado", status: "DOADO", daysAgo: 26, image: "tenis-corrida", title: "Tênis de corrida nº 41", description: "Tênis leve para corrida, solado em bom estado. Usado em treinos por cerca de seis meses." },
  { owner: "eduarda", category: "Roupas", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 10, image: "casaco-infantil", title: "Kit com 4 suéteres de tricô", description: "Suéteres de tricô em tons neutros, tamanhos P e M. Lavados e prontos para o inverno." },
  { owner: "felipe", category: "Brinquedos", condition: "Usado", status: "DISPONIVEL", daysAgo: 8, image: "blocos-montar", title: "Blocos de montar de madeira (40 peças)", description: "Blocos coloridos de madeira atóxica, ótimos para crianças de 2 a 6 anos. Acompanham caixa de armazenamento." },
  { owner: "gabriela", category: "Brinquedos", condition: "Seminovo", status: "DOADO", daysAgo: 22, image: "pelucia", title: "Urso de pelúcia com laço", description: "Urso de pelúcia macio, higienizado e sem desgaste. Mede cerca de 30 cm." },
  { owner: "henrique", category: "Brinquedos", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 11, image: "quebra-cabeca", title: "Quebra-cabeça de 1000 peças", description: "Quebra-cabeça completo (conferido peça por peça), montado apenas uma vez. Na caixa original." },
  { owner: "ana", category: "Móveis", condition: "Usado", status: "DOADO", daysAgo: 35, image: "estante", title: "Estante de parede com 4 prateleiras", description: "Estante de parede em madeira clara com suportes metálicos. Desmontada e com todos os parafusos." },
  { owner: "bruno", category: "Móveis", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 13, image: "mesa-cabeceira", title: "Mesa de cabeceira com gaveta", description: "Mesa de cabeceira em madeira escura, com uma gaveta e nicho aberto. Pequenas marcas de uso no tampo." },
  { owner: "carla", category: "Esportes e lazer", condition: "Usado", status: "DISPONIVEL", daysAgo: 15, image: "skate", title: "Skate completo com shape ilustrado", description: "Shape de 8 polegadas, trucks e rolamentos em bom estado e lixa nova. Ótimo para iniciantes." },
  { owner: "diego", category: "Esportes e lazer", condition: "Seminovo", status: "DOADO", daysAgo: 28, image: "halteres", title: "Par de halteres de 5 kg", description: "Halteres sextavados emborrachados, ideais para treinar em casa. Sem rachaduras." },
  { owner: "eduarda", category: "Casa e cozinha", condition: "Novo", status: "DISPONIVEL", daysAgo: 2, image: "vasos-ceramica", title: "Vaso de cerâmica com suporte de madeira", description: "Vaso pintado à mão com suporte de madeira. Nunca usado: ganhei de presente em duplicidade." },
  { owner: "felipe", category: "Livros", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 6, image: "livros-programacao", title: "Livros de programação web (HTML, CSS e JavaScript)", description: "Três livros de desenvolvimento web para iniciantes e intermediários. Conteúdo ainda atual para estudar front-end." },
  { owner: "demo", category: "Eletrônicos", condition: "Seminovo", status: "DISPONIVEL", daysAgo: 3, image: "fone-bluetooth", title: "Fone de ouvido Bluetooth com cancelamento de ruído", description: "Fone over-ear com cancelamento de ruído e até 30 horas de bateria. Acompanha cabo e estojo." },
  { owner: "demo", category: "Instrumentos musicais", condition: "Usado", status: "DISPONIVEL", daysAgo: 5, image: "teclado-musical", title: "Teclado musical de 61 teclas", description: "Teclado com 61 teclas sensitivas, fonte e suporte de partitura. Funciona perfeitamente; algumas marcas no acabamento." },
];

const INTERESTS: Array<{ user: string; item: string; daysAgo: number; message: string }> = [
  { user: "bruno", item: "Bicicleta urbana aro 26 com cestinha", daysAgo: 1, message: "Oi, Ana! Uso bicicleta para ir ao trabalho e a minha quebrou. Posso buscar no fim de semana?" },
  { user: "gabriela", item: "Bicicleta urbana aro 26 com cestinha", daysAgo: 1, message: "Tenho interesse para o meu filho de 14 anos. Consigo retirar em São Paulo na sexta à tarde." },
  { user: "demo", item: "Monitor 27 polegadas com suporte", daysAgo: 0, message: "Olá! O monitor ajudaria muito nos meus estudos. Posso retirar em Santo André nesta semana." },
  { user: "ana", item: "Fone de ouvido Bluetooth com cancelamento de ruído", daysAgo: 2, message: "Oi! Tenho interesse no fone para usar no transporte público. Posso retirar perto do metrô." },
  { user: "henrique", item: "Fone de ouvido Bluetooth com cancelamento de ruído", daysAgo: 1, message: "Estou começando a gravar podcasts e o fone ajudaria bastante. Podemos combinar a retirada?" },
  { user: "carla", item: "Teclado musical de 61 teclas", daysAgo: 3, message: "Minha sobrinha está aprendendo piano e adoraria o teclado. Posso buscar em São Paulo." },
  { user: "felipe", item: "Coleção de clássicos da literatura (12 livros)", daysAgo: 4, message: "Estou me preparando para o vestibular e a coleção seria perfeita. Retiro em Santos." },
  { user: "eduarda", item: "Blocos de montar de madeira (40 peças)", daysAgo: 5, message: "Tenho uma filha de 3 anos e ela iria adorar os blocos! Posso retirar em Sorocaba." },
  { user: "diego", item: "Luminária de mesa cogumelo", daysAgo: 2, message: "Preciso de uma luminária para a mesa de estudos. Posso retirar no sábado de manhã." },
  { user: "carla", item: "Cafeteira italiana para 6 xícaras", daysAgo: 28, message: "Adoro café coado na moka! Posso retirar em Campinas quando for melhor para você." },
  { user: "ana", item: "Urso de pelúcia com laço", daysAgo: 20, message: "Seria um presente para a minha afilhada. Consigo retirar em Osasco." },
];

const ago = (days: number, hour = 10) => {
  const date = new Date(Date.now() - days * DAY_MS);
  date.setUTCHours(hour + 3, (days * 7) % 60, 0, 0);
  return date;
};

async function main() {
  const passwordHash = hashPassword(seedPassword);

  const categories = new Map<string, string>();
  for (const name of CATEGORIES) {
    const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categories.set(name, category.id);
  }

  const users = new Map<string, string>();
  for (const user of USERS) {
    const email = `${user.key}@reuse.example`;
    const [utmSource, utmMedium, utmCampaign] = user.utm ?? [null, null, null];
    const record = await prisma.user.upsert({
      where: { email },
      update: { name: user.name, city: user.city, utmSource, utmMedium, utmCampaign },
      create: {
        email,
        name: user.name,
        city: user.city,
        password: passwordHash,
        utmSource,
        utmMedium,
        utmCampaign,
        createdAt: ago(user.daysAgo, 9),
      },
    });
    users.set(user.key, record.id);
  }

  const items = new Map<string, string>();
  for (const item of ITEMS) {
    const ownerId = users.get(item.owner)!;
    const data = {
      title: item.title,
      description: item.description,
      condition: item.condition,
      status: item.status,
      imageUrl: `/seed/${item.image}.webp`,
      categoryId: categories.get(item.category)!,
      ownerId,
    };
    const existing = await prisma.item.findFirst({ where: { title: item.title, ownerId }, select: { id: true } });
    const record = existing
      ? await prisma.item.update({ where: { id: existing.id }, data })
      : await prisma.item.create({ data: { ...data, createdAt: ago(item.daysAgo, 11 + (item.daysAgo % 8)) } });
    items.set(item.title, record.id);
  }

  for (const interest of INTERESTS) {
    const userId = users.get(interest.user)!;
    const itemId = items.get(interest.item)!;
    await prisma.interest.upsert({
      where: { userId_itemId: { userId, itemId } },
      update: { message: interest.message },
      create: { userId, itemId, message: interest.message, createdAt: ago(interest.daysAgo, 15) },
    });
  }

  console.log(`Seed concluído: ${CATEGORIES.length} categorias, ${USERS.length} pessoas, ${ITEMS.length} itens, ${INTERESTS.length} interesses.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
