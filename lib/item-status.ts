export const ITEM_STATUS = {
  available: "DISPONIVEL",
  paused: "PAUSADO",
  reserved: "RESERVADO",
  donated: "DOADO",
} as const;

export type ItemStatus = (typeof ITEM_STATUS)[keyof typeof ITEM_STATUS];

export const ITEM_STATUS_VALUES: ItemStatus[] = Object.values(ITEM_STATUS);

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  DISPONIVEL: "Disponível",
  PAUSADO: "Pausado",
  RESERVADO: "Reservado",
  DOADO: "Doado",
};

export function isItemStatus(value: unknown): value is ItemStatus {
  return (
    typeof value === "string" &&
    ITEM_STATUS_VALUES.includes(value as ItemStatus)
  );
}
