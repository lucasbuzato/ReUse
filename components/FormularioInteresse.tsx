"use client";

import Link from "next/link";
import { useState } from "react";

export default function FormularioInteresse({ itemId }: { itemId: string }) {
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const res = await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, message: mensagem }),
    });

    if (res.ok) {
      setEnviado(true);
      setMensagem("");
      return;
    }

    const data = await res.json().catch(() => null);
    setErro(data?.error ?? "Não foi possível enviar seu interesse.");
  }

  if (enviado) {
    return <p className="text-reuse-green font-medium">Interesse enviado! O doador poderá ver sua mensagem.</p>;
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        Você precisa estar conectado à sua conta para demonstrar interesse.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          required
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Escreva uma mensagem para o doador (ex: posso retirar amanhã)."
          className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          rows={3}
        />
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" className="bg-reuse-green text-white px-5 py-2 rounded-lg text-sm font-semibold">
            Tenho interesse
          </button>
          <Link href="/login" className="text-sm text-reuse-green font-medium">Entrar</Link>
        </div>
      </form>
    </div>
  );
}
