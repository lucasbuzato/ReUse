import React from "react";
import { ValueGroup } from "@adminjs/design-system";
import { useTranslation } from "adminjs";

type Props = {
  where: "list" | "show" | "edit" | "filter";
  property: { path: string; label: string };
  record?: { params?: Record<string, string | undefined> };
  resource?: { id: string };
};

/** Miniatura do item na listagem e imagem maior na tela de detalhes. */
const ImagePreview = ({ where, property, record, resource }: Props) => {
  const { translateProperty } = useTranslation();
  const label = translateProperty(property.path, resource?.id);
  const raw = record?.params?.[property.path];
  const src = record?.params?.imageSrc || raw;

  if (where === "list") {
    if (!src) return <span style={{ color: "#8a978f" }}>—</span>;
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 10, display: "block", background: "#eef2ef" }}
      />
    );
  }

  return (
    <ValueGroup label={label}>
      {src ? (
        <div>
          <img
            src={src}
            alt={record?.params?.title ?? ""}
            style={{ width: 320, maxWidth: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 14, display: "block", background: "#eef2ef" }}
          />
          <div style={{ fontSize: 12, color: "#5b6b62", marginTop: 8, wordBreak: "break-all" }}>{raw}</div>
        </div>
      ) : (
        <span style={{ color: "#5b6b62" }}>Sem imagem</span>
      )}
    </ValueGroup>
  );
};

export default ImagePreview;
