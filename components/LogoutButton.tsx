"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function sair() {
    setCarregando(true);

    try {
      await fetch("/api/users/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={carregando}
      className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {carregando ? "Saindo..." : "Sair"}
    </button>
  );
}
