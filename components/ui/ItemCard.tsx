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
      <div className="flex flex-1 flex-col gap-1 p-3 sm:gap-1.5 sm:p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="truncate font-semibold text-brand-text">{item.category.name}</span>
          <span className="hidden shrink-0 text-muted sm:inline">{item.condition}</span>
        </div>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink group-hover:text-brand-text sm:text-base">
          {item.title}
        </h3>
        <p className="mt-auto flex items-center gap-1.5 pt-1.5 text-[13px] text-muted sm:pt-2 sm:text-sm">
          <PinIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span className="truncate">{item.owner.city ?? "Cidade não informada"}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{timeAgo(item.createdAt)}</span>
        </p>
      </div>
    </Link>
  );
}
