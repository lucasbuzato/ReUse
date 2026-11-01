/** Foto ilustrativa por categoria (fotos do Unsplash em public/seed). */
const CATEGORY_PHOTOS: Record<string, string> = {
  Brinquedos: "/seed/blocos-montar.webp",
  "Casa e cozinha": "/seed/panelas.webp",
  "Eletrônicos": "/seed/fone-bluetooth.webp",
  "Esportes e lazer": "/seed/skate.webp",
  "Instrumentos musicais": "/seed/violao.webp",
  Livros: "/seed/livros-literatura.webp",
  "Móveis": "/seed/cadeira.webp",
  Roupas: "/seed/jaqueta-jeans.webp",
};

export function categoryPhoto(name: string) {
  return CATEGORY_PHOTOS[name] ?? null;
}

export function categoryHref(name: string) {
  return `/itens?categoria=${encodeURIComponent(name)}`;
}
