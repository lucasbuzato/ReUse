import Link from "next/link";
import FormularioCadastro from "@/components/FormularioCadastro";

export default function CadastroPage() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-reuse-green flex items-center justify-center text-white text-2xl font-bold shadow-sm">
            R
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mt-5">
            Crie sua conta
          </h1>

          <p className="text-gray-500 mt-2">
            Faça parte da comunidade ReUse!
          </p>
        </div>

        <div className="reuse-card p-6 sm:p-8">
          <FormularioCadastro />

          <div className="border-t border-gray-100 mt-6 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Já possui uma conta?
            </p>

            <Link
              href="/login"
              className="inline-block mt-2 text-reuse-green font-semibold hover:text-reuse-greenDark transition"
            >
              Entrar na minha conta →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}