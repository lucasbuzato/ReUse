import Link from "next/link";
import { getCategories, getCurrentUser, getItems, getStats } from "@/lib/api";
import { categoryHref, categoryPhoto } from "@/lib/categories";
import { formatNumber, plural } from "@/lib/format";
import type { Category, Item, Stats } from "@/lib/types";
import ItemCard from "@/components/ui/ItemCard";
import { ArrowRightIcon, ChatIcon, CheckIcon, HeartIcon, LeafIcon, PinIcon, SearchIcon } from "@/components/ui/Icons";

async function settle<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

const steps = [
  {
    title: "Anuncie em poucos minutos",
    text: "Coloque uma foto, descreva o estado do item e escolha a categoria. Pronto: ele já aparece para a comunidade.",
  },
  {
    title: "Receba pedidos de interesse",
    text: "Quem precisa envia uma mensagem curta. Você acompanha a lista de interessados em tempo real.",
  },
  {
    title: "Escolha e combine a entrega",
    text: "Você decide para quem doar ou com quem trocar, combina o local e marca o item como doado.",
  },
];

const faqs = [
  {
    q: "O ReUse! cobra alguma taxa?",
    a: "Não. Anunciar, procurar e demonstrar interesse é gratuito. Não existe pagamento dentro da plataforma.",
  },
  {
    q: "Posso trocar em vez de doar?",
    a: "Pode. Na mensagem de interesse, conte o que você oferece em troca. Quem anunciou o item decide se aceita.",
  },
  {
    q: "Como a entrega é combinada?",
    a: "Depois de escolher uma pessoa interessada, vocês combinam local e horário. Prefira locais públicos e movimentados.",
  },
  {
    q: "Quem vê meus dados?",
    a: "Seu e-mail aparece só para quem anunciou o item em que você demonstrou interesse. A senha é guardada como hash, nunca em texto puro.",
  },
  {
    q: "O que posso anunciar?",
    a: "Objetos em bom estado: roupas, livros, móveis, eletrônicos, brinquedos, instrumentos e mais. Itens perigosos, vencidos ou ilegais não são permitidos.",
  },
];

function HeroMosaic({ highlight, donated }: { highlight: Item | null; donated: number | null }) {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="grid grid-cols-5 grid-rows-6 gap-3 sm:gap-4" style={{ aspectRatio: "5 / 5.2" }}>
        <figure className="col-span-3 row-span-4 overflow-hidden rounded-xl bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seed/bicicleta.webp" alt="Bicicleta urbana com cestinha encostada em uma parede amarela" className="h-full w-full object-cover" />
        </figure>
        <figure className="col-span-2 row-span-3 overflow-hidden rounded-xl bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seed/violao.webp" alt="Violão acústico" className="h-full w-full object-cover" />
        </figure>
        <figure className="col-span-2 row-span-3 overflow-hidden rounded-xl bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seed/livros-literatura.webp" alt="Pilha de livros de literatura" className="h-full w-full object-cover" />
        </figure>
        <figure className="col-span-3 row-span-2 overflow-hidden rounded-xl bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seed/cadeira.webp" alt="Cadeira de madeira estilo escandinavo" className="h-full w-full object-cover object-[50%_40%]" />
        </figure>
      </div>

      {highlight ? (
        <Link
          href={`/itens/${highlight.id}`}
          className="absolute -bottom-5 left-4 right-4 flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.08)] sm:left-auto sm:right-6 sm:w-80"
        >
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-soft">
            {highlight.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={highlight.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-brand-text">Novo na vitrine</span>
            <span className="block truncate text-sm font-semibold text-ink">{highlight.title}</span>
            <span className="flex items-center gap-1 text-xs text-muted">
              <PinIcon className="h-3.5 w-3.5" />
              {highlight.owner.city ?? "Cidade não informada"}
            </span>
          </span>
        </Link>
      ) : null}

      {donated ? (
        <p className="absolute -top-4 left-4 rounded-full bg-lime px-3.5 py-1.5 text-sm font-semibold text-[#13201a] sm:left-6">
          {plural(donated, "item já ganhou nova casa", "itens já ganharam nova casa")}
        </p>
      ) : null}
    </div>
  );
}

function ImpactStrip({ stats }: { stats: Stats | null }) {
  const value = (number: number | undefined) => (typeof number === "number" ? formatNumber(number) : "—");
  const entries = [
    { value: value(stats?.items.total), label: "itens anunciados" },
    { value: value(stats?.items.donated), label: "itens já doados" },
    { value: value(stats?.users), label: "pessoas na comunidade" },
    { value: value(stats?.cities), label: "cidades com anúncios" },
  ];

  return (
    <section aria-labelledby="impacto-titulo" className="bg-night text-white">
      <div className="page grid gap-10 py-14 lg:grid-cols-[1fr_2fr] lg:items-center lg:py-16">
        <div>
          <h2 id="impacto-titulo" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pequenas doações, impacto real.
          </h2>
          <p className="mt-3 max-w-sm text-[#b9c7bf]">
            Números atualizados direto da plataforma. Cada item reutilizado é uma compra nova a menos.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {entries.map((entry) => (
            <div key={entry.label} className="flex flex-col border-l border-white/15 pl-4">
              <dt className="order-2 mt-1 text-sm text-[#b9c7bf]">{entry.label}</dt>
              <dd className="text-4xl font-bold tracking-tight text-lime sm:text-5xl">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categorias-titulo" className="page py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Categorias</p>
          <h2 id="categorias-titulo" className="mt-2 text-3xl font-bold tracking-tight">
            O que você procura hoje?
          </h2>
        </div>
        <Link href="/itens" className="inline-flex items-center gap-2 font-semibold text-brand-text hover:underline">
          Ver todos os itens <ArrowRightIcon />
        </Link>
      </div>
      <ul className="mt-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {categories.map((category) => {
          const photo = categoryPhoto(category.name);
          return (
            <li key={category.id}>
              <Link
                href={categoryHref(category.name)}
                className="group flex h-full items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:border-brand/60"
              >
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-soft">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug text-ink group-hover:text-brand-text">{category.name}</span>
                  <span className="block text-sm text-muted">
                    {plural(category.availableItems ?? 0, "disponível", "disponíveis")}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  const [stats, categories, latest, user] = await Promise.all([
    settle(getStats(), null),
    settle(getCategories(), [] as Category[]),
    settle(getItems({ limit: 8 }), [] as Item[]),
    getCurrentUser(),
  ]);

  const highlight = latest.find((item) => item.imageUrl) ?? null;
  const primaryCta = user ? { href: "/itens/novo", label: "Anunciar um item" } : { href: "/cadastro", label: "Criar conta grátis" };

  return (
    <>
      {/* 1. Hero: proposta de valor + chamadas para ação (landing de campanha) */}
      <section className="page grid items-center gap-14 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
        <div>
          <p className="eyebrow">Economia circular perto de você</p>
          <h1 className="mt-4 text-[2.6rem] font-bold leading-[1.05] tracking-tightest sm:text-6xl lg:text-[4.2rem]">
            Doe o que sobra.
            <br />
            <span className="text-brand-text">Encontre o que falta.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            O ReUse! conecta pessoas da mesma região para doar e trocar objetos em bom estado. É gratuito, rápido e evita que
            coisas úteis virem lixo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/itens" className="btn-primary !min-h-12 !px-6 text-base">
              <SearchIcon className="h-5 w-5" />
              Explorar itens
            </Link>
            <Link href="/itens/novo" className="btn-secondary !min-h-12 !px-6 text-base">
              Anunciar um item
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {["Sem taxas", "Sem intermediários", "Você escolhe quem recebe"].map((text) => (
              <li key={text} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-brand-text">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <HeroMosaic highlight={highlight} donated={stats?.items.donated ?? null} />
      </section>

      {/* 2. Impacto em números (dados reais da API) */}
      <ImpactStrip stats={stats} />

      {/* 3. Como funciona */}
      <section id="como-funciona" aria-labelledby="como-titulo" className="scroll-mt-24 border-b border-line">
        <div className="page grid gap-12 py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow">Como funciona</p>
            <h2 id="como-titulo" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Três passos entre um objeto parado e alguém que precisa dele.
            </h2>
            <Link href={primaryCta.href} className="btn-primary mt-8">
              {primaryCta.label}
              <ArrowRightIcon />
            </Link>
          </div>
          <ol className="divide-y divide-line border-y border-line">
            {steps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[3.5rem_1fr] gap-4 py-6 sm:grid-cols-[5rem_1fr]">
                <span className="text-4xl font-bold tracking-tight text-brand-text/40 sm:text-5xl" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-1.5 max-w-lg text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. Categorias */}
      <CategoryGrid categories={categories} />

      {/* 5. Itens recentes */}
      {latest.length > 0 ? (
        <section aria-labelledby="recentes-titulo" className="bg-soft/70 py-20">
          <div className="page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Acabaram de chegar</p>
                <h2 id="recentes-titulo" className="mt-2 text-3xl font-bold tracking-tight">
                  Itens disponíveis agora
                </h2>
              </div>
              <Link href="/itens" className="btn-secondary">
                Ver catálogo completo
                <ArrowRightIcon />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {latest.slice(0, 8).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 6. Benefícios */}
      <section aria-labelledby="beneficios-titulo" className="page py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Por que usar</p>
          <h2 id="beneficios-titulo" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Bom para quem doa, para quem recebe e para o planeta.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <article className="card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
              <HeartIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">Para quem doa</h3>
            <p className="mt-2 text-muted">Libere espaço em casa, ajude alguém perto de você e acompanhe quem se interessou por cada anúncio.</p>
          </article>
          <article className="card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
              <SearchIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">Para quem procura</h3>
            <p className="mt-2 text-muted">Encontre itens gratuitos por categoria ou cidade e fale direto com quem está doando.</p>
          </article>
          <article className="card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-soft text-ink">
              <ChatIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">Assistente ReUse</h3>
            <p className="mt-2 text-muted">
              Tire dúvidas por texto ou voz com o assistente virtual (IBM watsonx). Ele também consulta, pausa e reativa os seus anúncios.
            </p>
          </article>
        </div>
        <p className="mt-6 flex items-start gap-2 text-sm text-muted">
          <LeafIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
          Reutilizar prolonga a vida útil dos objetos e reduz o descarte — um passo simples rumo ao consumo responsável (ODS 12 da ONU).
        </p>
      </section>

      {/* 7. Perguntas frequentes */}
      <section id="perguntas" aria-labelledby="faq-titulo" className="scroll-mt-24 border-t border-line">
        <div className="page grid gap-10 py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow">Dúvidas frequentes</p>
            <h2 id="faq-titulo" className="mt-2 text-3xl font-bold tracking-tight">
              Antes de começar
            </h2>
            <p className="mt-3 max-w-sm text-muted">Não achou a resposta? Use o assistente no canto da tela.</p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Chamada final */}
      <section aria-labelledby="cta-titulo" className="page">
        <div className="relative overflow-hidden rounded-xl bg-[#1d5c45] px-6 py-14 text-white sm:px-12 sm:py-16">
          <div className="max-w-2xl">
            <h2 id="cta-titulo" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tem algo parado em casa? Alguém perto de você pode precisar.
            </h2>
            <p className="mt-4 text-lg text-white/85">Crie sua conta em menos de um minuto e publique o primeiro anúncio hoje.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryCta.href} className="btn-lime !min-h-12 !px-6 text-base">
                {primaryCta.label}
                <ArrowRightIcon />
              </Link>
              <Link href="/itens" className="btn !min-h-12 border border-white/40 !px-6 text-base text-white hover:bg-white/10">
                Ver itens disponíveis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
