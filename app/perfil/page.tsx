import type { Metadata } from "next";
import Link from "next/link";
import ItemActions from "@/components/ItemActions";
import LogoutButton from "@/components/LogoutButton";
import SignInPrompt from "@/components/site/SignInPrompt";
import EmptyState from "@/components/ui/EmptyState";
import { PanelIcon, PinIcon, PlusIcon } from "@/components/ui/Icons";
import ItemImage from "@/components/ui/ItemImage";
import StatusBadge from "@/components/ui/StatusBadge";
import { getCurrentUser, getMyInterests, getMyItems } from "@/lib/api";
import { formatMonthYear, formatNumber, plural, timeAgo } from "@/lib/format";
import { backendPublicUrl } from "@/lib/site";
import type { Item, MyInterest } from "@/lib/types";

export const metadata: Metadata = {
  title: "Meu perfil",
  robots: { index: false },
};

function LoadError({ what }: { what: string }) {
  return (
    <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger" role="alert">
      Não foi possível carregar {what} agora. Recarregue a página em alguns segundos.
    </p>
  );
}

function SectionHeading({ id, title, text, children }: { id: string; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-muted">{text}</p>
      </div>
      {children}
    </div>
  );
}

export default async function PerfilPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignInPrompt
        title="Acesse seu perfil"
        text="Entre para ver seus anúncios, os interesses que você recebeu e os itens que você pediu."
        next="/perfil"
      />
    );
  }

  const [items, interests] = await Promise.all([
    getMyItems().catch(() => null as Item[] | null),
    getMyInterests().catch(() => null as MyInterest[] | null),
  ]);

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const receivedInterests = items?.reduce((total, item) => total + item._count.interests, 0) ?? 0;
  const stats = [
    { label: "Anúncios ativos", value: items?.filter((item) => item.status === "DISPONIVEL").length ?? 0 },
    { label: "Interesses recebidos", value: receivedInterests },
    { label: "Itens doados", value: items?.filter((item) => item.status === "DOADO").length ?? 0 },
    { label: "Interesses enviados", value: interests?.length ?? 0 },
  ];
  const hasAdminAccess = user.role === "ADMIN" || user.role === "VIEWER";

  return (
    <div className="page space-y-12 py-10 sm:py-14">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand text-2xl font-bold text-brand-on"
            aria-hidden="true"
          >
            {firstName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="eyebrow">Minha conta</p>
            <h1 className="mt-1 truncate text-3xl font-bold tracking-tight sm:text-4xl">Olá, {firstName}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <PinIcon className="h-3.5 w-3.5" />
                {user.city ?? "Cidade não informada"}
              </span>
              <span aria-hidden="true">·</span>
              <span>Membro desde {formatMonthYear(user.createdAt)}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/itens/novo" className="btn-primary">
            <PlusIcon />
            Anunciar item
          </Link>
          <LogoutButton />
        </div>
      </header>

      <section aria-label="Resumo da conta">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col bg-surface px-5 py-4">
              <dt className="order-2 text-sm text-muted">{stat.label}</dt>
              <dd className="text-3xl font-bold tracking-tight">{formatNumber(stat.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {hasAdminAccess ? (
        <section
          aria-labelledby="admin-titulo"
          className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
              <PanelIcon />
            </span>
            <div>
              <h2 id="admin-titulo" className="font-semibold">
                Painel administrativo
              </h2>
              <p className="text-sm text-muted">
                {user.role === "ADMIN"
                  ? "Sua conta pode moderar anúncios, categorias e usuários."
                  : "Sua conta tem acesso de leitura aos dados e indicadores."}{" "}
                Use o mesmo e-mail e senha.
              </p>
            </div>
          </div>
          <a href={`${backendPublicUrl}/admin`} className="btn-secondary shrink-0">
            Abrir painel
          </a>
        </section>
      ) : null}

      <section aria-labelledby="anuncios-titulo" className="space-y-5">
        <SectionHeading id="anuncios-titulo" title="Meus anúncios" text="Atualize o status quando combinar a entrega." />

        {items === null ? (
          <LoadError what="seus anúncios" />
        ) : items.length === 0 ? (
          <EmptyState title="Você ainda não anunciou nada" text="Publique algo que você não usa mais. Leva menos de dois minutos.">
            <Link href="/itens/novo" className="btn-primary">
              <PlusIcon />
              Criar primeiro anúncio
            </Link>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <Link href={`/itens/${item.id}`} className="group flex min-w-0 items-center gap-4">
                  <div className="h-[4.5rem] w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-soft">
                    <ItemImage src={item.imageUrl} alt="" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="text-xs font-semibold text-brand-text">{item.category.name}</span>
                    </div>
                    <p className="mt-1.5 truncate font-semibold group-hover:text-brand-text group-hover:underline">{item.title}</p>
                    <p className="text-sm text-muted">
                      {plural(item._count.interests, "interessado", "interessados")} · publicado {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </Link>
                <div className="lg:shrink-0">
                  <ItemActions itemId={item.id} status={item.status} compact />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="interesses-titulo" className="space-y-5">
        <SectionHeading
          id="interesses-titulo"
          title="Meus interesses"
          text="Itens que você pediu. Quem anunciou recebe sua mensagem e responde por e-mail."
        />

        {interests === null ? (
          <LoadError what="seus interesses" />
        ) : interests.length === 0 ? (
          <EmptyState title="Nenhum interesse enviado" text="Encontrou algo útil no catálogo? Envie uma mensagem para quem anunciou.">
            <Link href="/itens" className="btn-secondary">
              Explorar itens
            </Link>
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {interests.map((interest) => (
              <li key={interest.id}>
                <Link
                  href={`/itens/${interest.item.id}`}
                  className="group flex h-full gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/60"
                >
                  <div className="h-[4.5rem] w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-soft">
                    <ItemImage src={interest.item.imageUrl} alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={interest.item.status} />
                      <span className="text-xs font-semibold text-brand-text">{interest.item.category.name}</span>
                    </div>
                    <p className="mt-1.5 truncate font-semibold group-hover:text-brand-text group-hover:underline">
                      {interest.item.title}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {interest.item.owner.name} · enviado {timeAgo(interest.createdAt)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm">“{interest.message}”</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
