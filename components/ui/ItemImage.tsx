import { BoxIcon } from "./Icons";

/** Foto do item com alternativa visual quando o anúncio não tem imagem. */
export default function ItemImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-soft text-muted ${className}`}>
        <BoxIcon className="h-8 w-8" />
        <span className="text-xs font-medium">Sem foto</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagens podem vir de qualquer domínio informado pelo anunciante
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
