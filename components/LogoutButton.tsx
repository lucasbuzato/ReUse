"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [carregando, setCarregando] = useState(false);

  async function sair() {
    setCarregando(true);

    try {
      await fetch("/api/users/logout", { method: "POST" });
    } finally {
      // Recarga completa (não router.push): renova a identidade do Assistant e o cabeçalho.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    }
  }

  return (
    <button type="button" onClick={sair} disabled={carregando} className="btn-secondary">
      {carregando ? "Saindo..." : "Sair da conta"}
    </button>
  );
}
