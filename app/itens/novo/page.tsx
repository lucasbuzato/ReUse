import { prisma } from "@/lib/prisma";
import FormularioNovoItem from "@/components/FormularioNovoItem";

export default async function NovoItemPage() {
  const categorias = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-reuse-green uppercase tracking-wide">
          Novo anúncio
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold text-reuse-greenDark mt-1">
          Dê uma nova vida a um objeto
        </h1>

        <p className="text-gray-500 mt-2">
          Preencha as informações abaixo para disponibilizar seu item
          para outras pessoas.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
        <FormularioNovoItem categorias={categorias} />
      </div>
    </div>
  );
}