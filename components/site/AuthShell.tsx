import { CheckIcon } from "@/components/ui/Icons";

/** Layout das telas de entrada e cadastro: formulário + painel com a proposta de valor. */
export default function AuthShell({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page py-10 sm:py-14">
      <div className="grid overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-[1fr_1fr]">
        <div className="px-5 py-10 sm:px-12 sm:py-14">
          <div className="mx-auto max-w-md">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-2 text-muted">{text}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <aside className="relative hidden bg-night lg:block" aria-label="Por que participar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seed/estante.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b110d] via-[#0b110d]/70 to-[#0b110d]/20" />
          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <p className="text-3xl font-bold leading-tight tracking-tight">
              Cada objeto reutilizado é
              <br />
              uma compra nova a menos.
            </p>
            <ul className="mt-6 space-y-3 text-[#d5ded8]">
              {[
                "Anuncie de graça em poucos minutos",
                "Veja quem se interessou em tempo real",
                "Você escolhe para quem doar ou com quem trocar",
              ].map((entry) => (
                <li key={entry} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime text-[#13201a]">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
