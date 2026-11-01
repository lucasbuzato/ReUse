import Link from "next/link";
import { UserIcon } from "@/components/ui/Icons";

/** Aviso exibido nas páginas que exigem login (perfil, novo anúncio). */
export default function SignInPrompt({ title, text, next }: { title: string; text: string; next: string }) {
  const query = `?next=${encodeURIComponent(next)}`;

  return (
    <div className="page py-16 sm:py-24">
      <section className="card mx-auto max-w-lg px-6 py-10 text-center sm:px-10" aria-labelledby="login-necessario">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <UserIcon className="h-7 w-7" />
        </span>
        <h1 id="login-necessario" className="mt-5 text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">{text}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/login${query}`} className="btn-primary">
            Entrar
          </Link>
          <Link href={`/cadastro${query}`} className="btn-secondary">
            Criar conta grátis
          </Link>
        </div>
      </section>
    </div>
  );
}
