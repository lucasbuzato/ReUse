import type { Metadata } from "next";
import FormularioNovoItem from "@/components/FormularioNovoItem";
import SignInPrompt from "@/components/site/SignInPrompt";
import { getCategories, getCurrentUser } from "@/lib/api";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Anunciar item",
  description: "Publique de graça um objeto que você não usa mais para doação ou troca.",
  robots: { index: false },
};

export default async function NovoItemPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SignInPrompt
        title="Entre para anunciar"
        text="Com uma conta você publica itens, acompanha quem se interessou e decide para quem doar."
        next="/itens/novo"
      />
    );
  }

  const categorias = await getCategories().catch(() => [] as Category[]);

  return (
    <div className="page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Novo anúncio</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Dê uma nova vida a um objeto</h1>
        <p className="mt-2 text-muted">
          Leva menos de dois minutos. O anúncio entra no catálogo assim que você publicar, e você pode pausar quando
          quiser.
        </p>
      </header>

      <div className="mt-8">
        <FormularioNovoItem
          categorias={categorias.map(({ id, name }) => ({ id, name }))}
          owner={{ name: user.name, city: user.city }}
        />
      </div>
    </div>
  );
}
