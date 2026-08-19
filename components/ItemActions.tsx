"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ItemActions({
  itemId,
  status,
}: {
  itemId: string;
  status: string;
}) {
  const router = useRouter();

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function atualizarStatus(novoStatus: string) {
    setCarregando(true);
    setErro("");

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: novoStatus,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(
          data?.error ?? "Não foi possível atualizar o status."
        );
        return;
      }

      router.refresh();
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function remover() {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este anúncio? Essa ação não pode ser desfeita."
    );

    if (!confirmou) return;

    setCarregando(true);
    setErro("");

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(
          data?.error ?? "Não foi possível remover o item."
        );
        return;
      }

      router.push("/perfil");
      router.refresh();
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚙️</span>

        <p className="font-bold text-gray-800">
          Gerenciar anúncio
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {status !== "DISPONIVEL" && (
          <button
            disabled={carregando}
            onClick={() =>
              atualizarStatus("DISPONIVEL")
            }
            className="px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition disabled:opacity-50"
          >
            ✓ Disponível
          </button>
        )}

        {status !== "RESERVADO" && (
          <button
            disabled={carregando}
            onClick={() =>
              atualizarStatus("RESERVADO")
            }
            className="px-4 py-2.5 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700 text-sm font-semibold hover:bg-yellow-100 transition disabled:opacity-50"
          >
            ◷ Reservar
          </button>
        )}

        {status !== "DOADO" && (
          <button
            disabled={carregando}
            onClick={() =>
              atualizarStatus("DOADO")
            }
            className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition disabled:opacity-50"
          >
            ♻️ Marcar como doado
          </button>
        )}

        <button
          disabled={carregando}
          onClick={remover}
          className="px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50"
        >
          🗑 Excluir
        </button>
      </div>

      {carregando && (
        <p className="text-xs text-gray-400 mt-3">
          Atualizando anúncio...
        </p>
      )}

      {erro && (
        <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-sm text-red-700">
            ⚠️ {erro}
          </p>
        </div>
      )}
    </div>
  );
}