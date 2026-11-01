import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import FormularioCadastro from "@/components/FormularioCadastro";
import AuthShell from "@/components/site/AuthShell";
import { getCurrentUser } from "@/lib/api";
import { safeNextPath } from "@/lib/format";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta gratuita no ReUse! e comece a doar e trocar objetos perto de você.",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function CadastroPage({ searchParams }: Props) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell eyebrow="Conta gratuita" title="Crie sua conta" text="Leva menos de um minuto. Depois é só anunciar ou procurar itens.">
      <FormularioCadastro next={next} />
      <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
        Já tem conta?{" "}
        <Link href={`/login${next !== "/perfil" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-text hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
