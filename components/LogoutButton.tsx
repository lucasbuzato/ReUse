"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function sair() {
    await fetch("/api/users/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return <button onClick={sair} className="text-sm text-red-600 font-medium">Sair</button>;
}
