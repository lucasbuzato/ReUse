"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioCadastro() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setCarregando(false);

    if (res.ok) {
      router.push("/perfil");
      router.refresh();
      return;
    }

    const data = await res.json().catch(() => null);
    setErro(data?.error ?? "Não foi possível concluir o cadastro.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">E-mail</label>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Senha</label>
        <input required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2" />
        <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Cidade</label>
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2" />
      </div>

      {erro && <p className="text-red-600 text-sm">{erro}</p>}

      <button type="submit" disabled={carregando} className="bg-reuse-green text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-60">
        {carregando ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
