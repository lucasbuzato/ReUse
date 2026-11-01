"use client";

import { useEffect } from "react";
import { UTM_STORAGE_KEY, mergeFirstTouch, parseUtm } from "@/lib/utm";

/** Guarda as UTMs da primeira visita para atribuir o cadastro à campanha certa. */
export default function UtmCapture() {
  useEffect(() => {
    try {
      const incoming = parseUtm(window.location.search);
      const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : null;
      const next = mergeFirstTouch(stored, incoming);
      if (next && next !== stored) window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Armazenamento indisponível (modo privado): seguimos sem atribuição.
    }
  }, []);

  return null;
}
