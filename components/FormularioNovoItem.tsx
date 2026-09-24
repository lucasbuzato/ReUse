"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Categoria = {
  id: string;
  name: string;
};

export default function FormularioNovoItem({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    condition: "Seminovo",
    imageUrl: "",
    categoryId: categorias[0]?.id ?? "",
  });

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const item = await res.json();

        router.push(`/itens/${item.id}`);
        router.refresh();

        return;
      }

      const data = await res.json().catch(() => null);

      setErro(
        data?.error ?? "Não foi possível cadastrar o item."
      );
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-busy={carregando}
    >
      {/* TÍTULO */}
      <div>
        <label
          htmlFor="item-title"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Título do item
        </label>

        <input
          id="item-title"
          name="title"
          required
          value={form.title}
          onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value,
            })
          }
          placeholder="Ex.: Bicicleta infantil"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-reuse-green focus:ring-2 focus:ring-green-100 transition"
        />
      </div>

      {/* DESCRIÇÃO */}
      <div>
        <label
          htmlFor="item-description"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Descrição
        </label>

        <textarea
          id="item-description"
          name="description"
          required
          rows={5}
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
          placeholder="Conte um pouco sobre o item, estado de conservação e outras informações importantes..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none focus:border-reuse-green focus:ring-2 focus:ring-green-100 transition"
        />
      </div>

      {/* ESTADO + CATEGORIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="item-condition"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Estado de conservação
          </label>

          <select
            id="item-condition"
            name="condition"
            value={form.condition}
            onChange={(e) =>
              setForm({
                ...form,
                condition: e.target.value,
              })
            }
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-reuse-green focus:ring-2 focus:ring-green-100"
          >
            <option>Novo</option>
            <option>Seminovo</option>
            <option>Usado</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="item-category"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Categoria
          </label>

          <select
            id="item-category"
            name="categoryId"
            required
            value={form.categoryId}
            onChange={(e) =>
              setForm({
                ...form,
                categoryId: e.target.value,
              })
            }
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-reuse-green focus:ring-2 focus:ring-green-100"
          >
            {categorias.map((categoria) => (
              <option
                key={categoria.id}
                value={categoria.id}
              >
                {categoria.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* IMAGEM */}
      <div>
        <label
          htmlFor="item-image-url"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          URL da imagem
        </label>

        <input
          id="item-image-url"
          name="imageUrl"
          inputMode="url"
          autoComplete="url"
          aria-describedby="item-image-url-hint"
          value={form.imageUrl}
          onChange={(e) =>
            setForm({
              ...form,
              imageUrl: e.target.value,
            })
          }
          placeholder="https://exemplo.com/imagem.jpg"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-reuse-green focus:ring-2 focus:ring-green-100 transition"
        />

        <p id="item-image-url-hint" className="text-xs text-gray-400 mt-2">
          Opcional. Você pode inserir o endereço de uma imagem hospedada na
          internet.
        </p>
      </div>

      {/* ERRO */}
      {erro && (
        <div
          className="bg-red-50 border border-red-100 rounded-xl p-4"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-700">
            ⚠️ {erro}
          </p>
        </div>
      )}

      {/* BOTÃO */}
      <button
        type="submit"
        disabled={carregando}
        className="reuse-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {carregando
          ? "Publicando anúncio..."
          : "Publicar anúncio ♻️"}
      </button>
    </form>
  );
}