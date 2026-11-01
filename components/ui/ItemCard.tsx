import Link from "next/link";
import { timeAgo } from "@/lib/format";
import type { Item } from "@/lib/types";
import { PinIcon } from "./Icons";
import ItemImage from "./ItemImage";
import StatusBadge from "./StatusBadge";

export default function ItemCard({ item, priority = false }: { item: Item; priority?: boolean }) {
  return (
    <Link
      href={`/itens/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-brand/60"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-soft">
        <ItemImage
          src={item.imageUrl}
          alt={item.title}
          priority={priority}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {item.status !== "DISPONIVEL" ? <StatusBadge status={item.status} className="absolute left-3 top-3" /> : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-brand-text">{item.category.name}</span>
          <span className="text-muted">{item.condition}</span>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink group-hover:text-brand-text">{item.title}</h3>
        <p className="mt-auto flex items-center gap-1.5 pt-2 text-sm text-muted">
          <PinIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.owner.city ?? "Cidade não informada"}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{timeAgo(item.createdAt)}</span>
        </p>
      </div>
    </Link>
  );
}
