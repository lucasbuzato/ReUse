import type { MetadataRoute } from "next";
import { getItems } from "@/lib/api";
import { siteUrl } from "@/lib/site";
import type { Item } from "@/lib/types";

// Gerado a cada requisição: o catálogo muda o tempo todo e o build não depende da API.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await getItems({ limit: 100 }).catch(() => [] as Item[]);

  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/itens`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${siteUrl}/cadastro`, changeFrequency: "monthly", priority: 0.5 },
    ...items.map((item) => ({
      url: `${siteUrl}/itens/${item.id}`,
      lastModified: item.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
