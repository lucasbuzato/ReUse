import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import FormularioLogin from "@/components/FormularioLogin";
import AuthShell from "@/components/site/AuthShell";
import { getCurrentUser } from "@/lib/api";
import { safeNextPath } from "@/lib/format";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta ReUse! para anunciar itens e demonstrar interesse.",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell eyebrow="Bem-vindo de volta" title="Entre na sua conta" text="Acompanhe seus anúncios e os interesses que você enviou.">
      <FormularioLogin next={next} />
      <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href={`/cadastro${next !== "/perfil" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-text hover:underline">
          Crie a sua grátis
        </Link>
      </p>
    </AuthShell>
  );
}
