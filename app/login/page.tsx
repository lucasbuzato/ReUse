import Link from "next/link";
import FormularioLogin from "@/components/FormularioLogin";

export default function LoginPage() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-reuse-green flex items-center justify-center text-white text-2xl font-bold shadow-sm">
            R
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mt-5">
            Bem-vindo de volta!
          </h1>

          <p className="text-gray-500 mt-2">
            Entre na sua conta para continuar.
          </p>
        </div>

        <div className="reuse-card p-6 sm:p-8">
          <FormularioLogin />

          <div className="border-t border-gray-100 mt-6 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Ainda não tem uma conta?
            </p>

            <Link
              href="/cadastro"
              className="inline-block mt-2 text-reuse-green font-semibold hover:text-reuse-greenDark transition"
            >
              Criar minha conta →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}