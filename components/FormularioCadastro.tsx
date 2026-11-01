"use client";

import { useState } from "react";
import { readStoredUtm } from "@/lib/utm";

type Errors = Partial<Record<"name" | "email" | "password", string>>;

function validate(form: { name: string; email: string; password: string }): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = "Informe seu nome (mínimo de 2 letras).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Informe um e-mail válido.";
  if (form.password.length < 6) errors.password = "A senha precisa ter pelo menos 6 caracteres.";
  return errors;
}

export default function FormularioCadastro({ next = "/perfil" }: { next?: string }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field as keyof Errors]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro("");

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setCarregando(true);
    try {
      const utm = readStoredUtm(typeof window === "undefined" ? undefined : window.localStorage);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, utm }),
      });

      if (res.ok) {
        window.location.assign(next);
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

  const fieldProps = (field: keyof Errors) => ({
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `signup-${field}-error` : field === "password" ? "signup-password-hint" : undefined,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={carregando} noValidate>
      <div>
        <label htmlFor="signup-name" className="field-label">
          Nome
        </label>
        <input
          id="signup-name"
          name="name"
          required
          maxLength={80}
          autoComplete="name"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          className="field"
          {...fieldProps("name")}
        />
        {errors.name ? (
          <p id="signup-name-error" className="field-error">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="signup-email" className="field-label">
          E-mail
        </label>
        <input
          id="signup-email"
          name="email"
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          className="field"
          {...fieldProps("email")}
        />
        {errors.email ? (
          <p id="signup-email-error" className="field-error">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="signup-password" className="field-label">
          Senha
        </label>
        <input
          id="signup-password"
          name="password"
          required
          minLength={6}
          maxLength={128}
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          className="field"
          {...fieldProps("password")}
        />
        {errors.password ? (
          <p id="signup-password-error" className="field-error">
            {errors.password}
          </p>
        ) : (
          <p id="signup-password-hint" className="field-hint">
            Mínimo de 6 caracteres.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="signup-city" className="field-label">
          Cidade <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="signup-city"
          name="city"
          maxLength={80}
          autoComplete="address-level2"
          placeholder="Ex.: São Paulo"
          value={form.city}
          onChange={(event) => update("city", event.target.value)}
          className="field"
        />
        <p className="field-hint">Ajuda quem procura a encontrar itens perto de casa.</p>
      </div>

      {erro ? (
        <p className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
          {erro}
        </p>
      ) : null}

      <button type="submit" disabled={carregando} className="btn-primary w-full !min-h-12">
        {carregando ? "Criando conta..." : "Criar conta grátis"}
      </button>
      <p className="text-center text-xs text-muted">Ao criar a conta você concorda em anunciar apenas itens próprios e em bom estado.</p>
    </form>
  );
}
