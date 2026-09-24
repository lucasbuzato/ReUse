"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/users/login", {
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
      setErro(data?.error ?? "E-mail ou senha inválidos.");
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
          htmlFor="login-email"
          className="mb-1 block text-sm font-medium"
        >
          E-mail
        </label>
        <input
          id="login-email"
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
          htmlFor="login-password"
          className="mb-1 block text-sm font-medium"
        >
          Senha
        </label>
        <input
          id="login-password"
          name="password"
          required
          type="password"
          minLength={6}
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
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
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
