import React from "react";
import { ValueGroup } from "@adminjs/design-system";
import { useTranslation } from "adminjs";

type Props = {
  where: "list" | "show" | "edit" | "filter";
  property: { path: string; label: string; availableValues?: Array<{ value: string; label: string }> | null };
  record?: { params?: Record<string, string | undefined> };
  resource?: { id: string };
};

const COLORS: Record<string, { bg: string; fg: string }> = {
  DISPONIVEL: { bg: "#1d5c45", fg: "#ffffff" },
  RESERVADO: { bg: "#f3d98b", fg: "#4a3700" },
  DOADO: { bg: "#dcebe4", fg: "#1d5c45" },
  PAUSADO: { bg: "#e4e7e5", fg: "#3d4a43" },
};

/** Status do item com a mesma paleta usada no site e no painel. */
const StatusBadge = ({ where, property, record, resource }: Props) => {
  const { translateProperty } = useTranslation();
  const label = translateProperty(property.path, resource?.id);
  const value = record?.params?.[property.path] ?? "";
  const valueLabel = property.availableValues?.find((option) => option.value === value)?.label ?? value;
  const colors = COLORS[value] ?? { bg: "#e4e7e5", fg: "#3d4a43" };

  const badge = (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
        background: colors.bg,
        color: colors.fg,
        whiteSpace: "nowrap",
      }}
    >
      {valueLabel || "—"}
    </span>
  );

  if (where === "list") return badge;
  return <ValueGroup label={label}>{badge}</ValueGroup>;
};

export default StatusBadge;
