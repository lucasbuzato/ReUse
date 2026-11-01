"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = { status: string; label: string; className: string };

export default function ItemActions({ itemId, status, compact = false }: { itemId: string; status: string; compact?: boolean }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  async function atualizarStatus(novoStatus: string, mensagem: string) {
    setCarregando(true);
    setErro("");
    setAviso("");

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível atualizar o status.");
        return;
      }

      setAviso(mensagem);
      router.refresh();
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function remover() {
    if (!window.confirm("Excluir este anúncio? Essa ação não pode ser desfeita.")) return;

    setCarregando(true);
    setErro("");

    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível remover o item.");
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

  const neutral = "border border-line bg-surface text-ink hover:border-brand/60";
  const actions: Array<Action & { message: string }> = [
    status === "DISPONIVEL"
      ? { status: "PAUSADO", label: "Pausar", className: neutral, message: "Anúncio pausado. Ele saiu do catálogo." }
      : { status: "DISPONIVEL", label: "Reativar", className: neutral, message: "Anúncio reativado no catálogo." },
    ...(status !== "RESERVADO"
      ? [{ status: "RESERVADO", label: "Reservar", className: neutral, message: "Item marcado como reservado." }]
      : []),
    ...(status !== "DOADO"
      ? [{ status: "DOADO", label: "Marcar como doado", className: "bg-brand text-brand-on hover:bg-brand-strong", message: "Parabéns! Item marcado como doado." }]
      : []),
  ];

  return (
    <div className={compact ? "" : "mt-4"}>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={carregando}
            onClick={() => atualizarStatus(action.status, action.message)}
            className={`btn !px-3.5 text-sm ${action.className}`}
          >
            {action.label}
          </button>
        ))}
        <button type="button" disabled={carregando} onClick={remover} className="btn-danger !px-3.5 text-sm">
          Excluir
        </button>
      </div>

      <div className="mt-2 min-h-5 text-sm" aria-live="polite" aria-atomic="true">
        {carregando ? <p className="text-muted">Atualizando anúncio...</p> : null}
        {!carregando && aviso ? <p className="text-brand-text">{aviso}</p> : null}
        {erro ? (
          <p className="text-danger" role="alert">
            {erro}
          </p>
        ) : null}
      </div>
    </div>
  );
}
