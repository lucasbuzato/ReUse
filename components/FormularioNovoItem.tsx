"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon, ImageIcon, PinIcon } from "@/components/ui/Icons";
import ItemImage from "@/components/ui/ItemImage";
import { categoryPhoto } from "@/lib/categories";

type Categoria = { id: string; name: string };
type Owner = { name: string; city: string | null };
type Form = { title: string; description: string; condition: string; categoryId: string; imageUrl: string };
type Campo = "title" | "description" | "categoryId" | "imageUrl";
type Erros = Partial<Record<Campo, string>>;

const CONDICOES = [
  { value: "Novo", hint: "Sem uso ou na embalagem" },
  { value: "Seminovo", hint: "Pouco uso, sem defeitos" },
  { value: "Usado", hint: "Marcas de uso, funcionando" },
] as const;

const LIMITE_TITULO = 120;
const LIMITE_DESCRICAO = 2000;
const ORDEM: Campo[] = ["title", "description", "categoryId", "imageUrl"];
const IDS: Record<Campo, string> = {
  title: "item-title",
  description: "item-description",
  categoryId: "item-category",
  imageUrl: "item-image-url",
};

/** Mesmas regras do backend: http(s) ou caminho interno (ex.: /seed/livros.webp). */
function enderecoDeImagemValido(value: string) {
  const text = value.trim();
  if (!text) return true;
  if (text.startsWith("/") && !text.startsWith("//")) return true;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validar(form: Form, imagemComFalha: boolean): Erros {
  const erros: Erros = {};
  const title = form.title.trim();
  const description = form.description.trim();

  if (title.length < 3) erros.title = "Escreva um título com pelo menos 3 caracteres.";
  else if (title.length > LIMITE_TITULO) erros.title = `Use no máximo ${LIMITE_TITULO} caracteres.`;

  if (description.length < 10) erros.description = "Descreva o item com pelo menos 10 caracteres.";
  else if (description.length > LIMITE_DESCRICAO) erros.description = `Use no máximo ${LIMITE_DESCRICAO} caracteres.`;

  if (!form.categoryId) erros.categoryId = "Escolha uma categoria.";

  if (!enderecoDeImagemValido(form.imageUrl)) {
    erros.imageUrl = "Informe um endereço que comece com http:// ou https://.";
  } else if (imagemComFalha) {
    erros.imageUrl = "A imagem não carregou. Corrija o endereço ou deixe o campo vazio.";
  }

  return erros;
}

export default function FormularioNovoItem({ categorias, owner }: { categorias: Categoria[]; owner: Owner }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    title: "",
    description: "",
    condition: "Seminovo",
    categoryId: "",
    imageUrl: "",
  });
  const [erros, setErros] = useState<Erros>({});
  const [erroServidor, setErroServidor] = useState("");
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [imagem, setImagem] = useState<{ src: string; ok: boolean } | null>(null);

  const imageSrc = form.imageUrl.trim();
  const imagemValida = Boolean(imageSrc) && enderecoDeImagemValido(imageSrc);
  const estadoImagem = !imagemValida ? "vazia" : imagem?.src === imageSrc ? (imagem.ok ? "ok" : "falha") : "carregando";
  const categoria = categorias.find((entry) => entry.id === form.categoryId);
  const fotoIlustrativa = categoria ? categoryPhoto(categoria.name) : null;

  function atualizar<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    if (campo in erros) setErros((atuais) => ({ ...atuais, [campo]: undefined }));
  }

  function descricao(campo: Campo, dica?: string) {
    return [dica, erros[campo] ? `${IDS[campo]}-erro` : null].filter(Boolean).join(" ") || undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroServidor("");
    setSessaoExpirada(false);

    const novosErros = validar(form, estadoImagem === "falha");
    setErros(novosErros);
    const primeiro = ORDEM.find((campo) => novosErros[campo]);
    if (primeiro) {
      document.getElementById(IDS[primeiro])?.focus();
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          condition: form.condition,
          categoryId: form.categoryId,
          imageUrl: imageSrc || null,
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.id) {
        router.push(`/itens/${data.id}?publicado=1`);
        router.refresh();
        return;
      }

      if (res.status === 401) setSessaoExpirada(true);
      setErroServidor(data?.error ?? "Não foi possível publicar o anúncio. Tente de novo.");
      setCarregando(false);
    } catch {
      setErroServidor("Sem conexão com o servidor. Confira sua internet e tente de novo.");
      setCarregando(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
      <form noValidate onSubmit={handleSubmit} className="card p-5 sm:p-8" aria-busy={carregando}>
        <div className="space-y-7">
          <div>
            <label htmlFor={IDS.title} className="field-label">
              Título do anúncio
            </label>
            <input
              id={IDS.title}
              name="title"
              value={form.title}
              maxLength={LIMITE_TITULO}
              onChange={(e) => atualizar("title", e.target.value)}
              placeholder="Ex.: Bicicleta infantil aro 16"
              aria-invalid={Boolean(erros.title)}
              aria-describedby={descricao("title", "item-title-dica")}
              className="field"
            />
            <div className="field-hint flex justify-between gap-4" id="item-title-dica">
              <span>Diga o que é, a marca ou o tamanho.</span>
              <span className="shrink-0 tabular-nums" aria-hidden="true">
                {form.title.length}/{LIMITE_TITULO}
              </span>
            </div>
            {erros.title ? (
              <p id={`${IDS.title}-erro`} className="field-error">
                {erros.title}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={IDS.description} className="field-label">
              Descrição
            </label>
            <textarea
              id={IDS.description}
              name="description"
              rows={5}
              value={form.description}
              maxLength={LIMITE_DESCRICAO}
              onChange={(e) => atualizar("description", e.target.value)}
              placeholder="Conte o estado do item, medidas, se falta alguma peça e como prefere combinar a entrega."
              aria-invalid={Boolean(erros.description)}
              aria-describedby={descricao("description", "item-description-dica")}
              className="field resize-y"
            />
            <div className="field-hint flex justify-between gap-4" id="item-description-dica">
              <span>Detalhes evitam perguntas repetidas.</span>
              <span className="shrink-0 tabular-nums" aria-hidden="true">
                {form.description.length}/{LIMITE_DESCRICAO}
              </span>
            </div>
            {erros.description ? (
              <p id={`${IDS.description}-erro`} className="field-error">
                {erros.description}
              </p>
            ) : null}
          </div>

          <fieldset>
            <legend className="field-label">Estado de conservação</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {CONDICOES.map((opcao) => {
                const ativo = form.condition === opcao.value;
                return (
                  <label
                    key={opcao.value}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${
                      ativo ? "border-brand bg-brand-soft" : "border-field/60 bg-surface hover:border-brand/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={opcao.value}
                      checked={ativo}
                      onChange={() => atualizar("condition", opcao.value)}
                      className="mt-1 h-4 w-4 shrink-0 accent-brand"
                    />
                    <span>
                      <span className="block font-semibold">{opcao.value}</span>
                      <span className="block text-sm text-muted">{opcao.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor={IDS.categoryId} className="field-label">
              Categoria
            </label>
            <select
              id={IDS.categoryId}
              name="categoryId"
              value={form.categoryId}
              onChange={(e) => atualizar("categoryId", e.target.value)}
              aria-invalid={Boolean(erros.categoryId)}
              aria-describedby={descricao("categoryId")}
              className="field"
              disabled={categorias.length === 0}
            >
              <option value="" disabled>
                Escolha uma categoria
              </option>
              {categorias.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            {categorias.length === 0 ? (
              <p className="field-error">Não foi possível carregar as categorias agora. Recarregue a página.</p>
            ) : null}
            {erros.categoryId ? (
              <p id={`${IDS.categoryId}-erro`} className="field-error">
                {erros.categoryId}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={IDS.imageUrl} className="field-label">
              Foto <span className="font-normal text-muted">(opcional)</span>
            </label>
            <input
              id={IDS.imageUrl}
              name="imageUrl"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={form.imageUrl}
              onChange={(e) => atualizar("imageUrl", e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              aria-invalid={Boolean(erros.imageUrl)}
              aria-describedby={descricao("imageUrl", "item-image-url-dica")}
              className="field"
            />
            <p id="item-image-url-dica" className="field-hint">
              Cole o endereço de uma foto publicada na internet. Anúncios com foto real recebem mais interesse.
            </p>
            {erros.imageUrl ? (
              <p id={`${IDS.imageUrl}-erro`} className="field-error">
                {erros.imageUrl}
              </p>
            ) : null}

            {imagemValida ? (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-soft p-2 pr-3" aria-live="polite">
                <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element -- prévia de qualquer domínio informado */}
                  <img
                    key={imageSrc}
                    src={imageSrc}
                    alt=""
                    onLoad={() => setImagem({ src: imageSrc, ok: true })}
                    onError={() => setImagem({ src: imageSrc, ok: false })}
                    className={`h-full w-full object-cover ${estadoImagem === "ok" ? "" : "opacity-0"}`}
                  />
                  {estadoImagem !== "ok" ? (
                    <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-muted" />
                  ) : null}
                </div>
                <p className={`text-sm ${estadoImagem === "falha" ? "font-medium text-danger" : "text-muted"}`}>
                  {estadoImagem === "ok"
                    ? "Foto carregada. Veja a prévia do anúncio."
                    : estadoImagem === "falha"
                      ? "Não foi possível abrir essa foto."
                      : "Carregando a foto..."}
                </p>
              </div>
            ) : null}

            {fotoIlustrativa && imageSrc !== fotoIlustrativa ? (
              <button
                type="button"
                onClick={() => atualizar("imageUrl", fotoIlustrativa)}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-brand-text hover:underline"
              >
                <ImageIcon className="h-4 w-4" />
                Sem foto agora? Usar imagem ilustrativa de {categoria?.name}
              </button>
            ) : null}
          </div>
        </div>

        {erroServidor ? (
          <div className="mt-7 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-danger" role="alert">
            <p className="font-medium">{erroServidor}</p>
            {sessaoExpirada ? (
              <Link href="/login?next=/itens/novo" className="mt-2 inline-flex min-h-11 items-center font-semibold underline">
                Entrar de novo
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">Você pode pausar ou excluir o anúncio depois, no seu perfil.</p>
          <button
            type="submit"
            disabled={carregando || categorias.length === 0}
            className="btn-primary w-full shrink-0 sm:w-auto"
          >
            {carregando ? "Publicando..." : "Publicar anúncio"}
          </button>
        </div>
      </form>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Prévia e dicas">
        <div className="hidden lg:block">
          <p className="mb-3 text-sm font-semibold text-muted">Prévia no catálogo</p>
          <div className="overflow-hidden rounded-xl border border-line bg-surface" aria-hidden="true">
            <div className="aspect-[4/3] bg-soft">
              <ItemImage src={estadoImagem === "ok" ? imageSrc : null} alt="" />
            </div>
            <div className="flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-brand-text">{categoria?.name ?? "Categoria"}</span>
                <span className="text-muted">{form.condition}</span>
              </div>
              <p className={`line-clamp-2 font-semibold leading-snug ${form.title.trim() ? "" : "text-muted"}`}>
                {form.title.trim() || "Título do seu anúncio"}
              </p>
              <p className="flex items-center gap-1.5 pt-2 text-sm text-muted">
                <PinIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{owner.city ?? "Cidade não informada"}</span>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">hoje</span>
              </p>
            </div>
          </div>
        </div>

        <section className="card p-5" aria-labelledby="dicas-titulo">
          <h2 id="dicas-titulo" className="font-semibold">
            Dicas para doar mais rápido
          </h2>
          <ul className="mt-3 space-y-3 text-sm text-muted">
            {[
              "Use uma foto com boa luz e o objeto inteiro.",
              "Conte defeitos com sinceridade. Isso evita desistências.",
              "Veja os interessados na página do anúncio e responda por e-mail.",
            ].map((dica) => (
              <li key={dica} className="flex gap-2.5">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
                <span>{dica}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
