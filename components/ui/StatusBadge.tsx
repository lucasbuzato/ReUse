import { ITEM_STATUS_LABELS, type ItemStatus } from "@/lib/item-status";

const STYLES: Record<ItemStatus, { box: string; dot: string }> = {
  DISPONIVEL: { box: "bg-brand-soft text-brand-text", dot: "bg-brand" },
  RESERVADO: { box: "bg-warn-soft text-warn", dot: "bg-warn" },
  DOADO: { box: "bg-lime-soft text-ink", dot: "bg-[#8a9a1f]" },
  PAUSADO: { box: "bg-soft text-muted", dot: "bg-muted" },
};

export default function StatusBadge({ status, className = "" }: { status: ItemStatus; className?: string }) {
  const style = STYLES[status] ?? STYLES.PAUSADO;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.box} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {ITEM_STATUS_LABELS[status] ?? status}
    </span>
  );
}
