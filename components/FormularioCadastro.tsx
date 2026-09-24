"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioCadastro() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
  });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/perfil");
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => null);
      setErro(data?.error ?? "Não foi possível concluir o cadastro.");
    } catch {
      setErro("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4"
      aria-busy={carregando}
    >
      <div>
        <label
          htmlFor="signup-name"
          className="mb-1 block text-sm font-medium"
        >
          Nome
        </label>
        <input
          id="signup-name"
          name="name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="min-h-11 w-full rounded-lg border border-gray-300 p-2"
        />
      </div>

      <div>
        <label
          htmlFor="signup-email"
          className="mb-1 block text-sm font-medium"
        >
          E-mail
        </label>
        <input
          id="signup-email"
          name="email"
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="min-h-11 w-full rounded-lg border border-gray-300 p-2"
        />
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="mb-1 block text-sm font-medium"
        >
          Senha
        </label>
        <input
          id="signup-password"
          name="password"
          required
          minLength={6}
          type="password"
          autoComplete="new-password"
          aria-describedby="signup-password-hint"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="min-h-11 w-full rounded-lg border border-gray-300 p-2"
        />
        <p id="signup-password-hint" className="mt-1 text-xs text-gray-500">
          Mínimo de 6 caracteres.
        </p>
      </div>

      <div>
        <label
          htmlFor="signup-city"
          className="mb-1 block text-sm font-medium"
        >
          Cidade
        </label>
        <input
          id="signup-city"
          name="city"
          autoComplete="address-level2"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="min-h-11 w-full rounded-lg border border-gray-300 p-2"
        />
      </div>

      {erro && (
        <p className="text-sm text-red-600" role="alert" aria-live="assertive">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={carregando}
        className="reuse-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {carregando ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
