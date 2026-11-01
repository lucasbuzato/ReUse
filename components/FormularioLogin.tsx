"use client";

import { useState } from "react";

export default function FormularioLogin({ next = "/perfil" }: { next?: string }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        window.location.assign(next);
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
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={carregando}>
      <div>
        <label htmlFor="login-email" className="field-label">
          E-mail
        </label>
        <input
          id="login-email"
          name="email"
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="field-label">
          Senha
        </label>
        <input
          id="login-password"
          name="password"
          required
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          className="field"
        />
      </div>

      {erro ? (
        <p className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
          {erro}
        </p>
      ) : null}

      <button type="submit" disabled={carregando} className="btn-primary w-full !min-h-12">
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
