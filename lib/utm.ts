/**
 * Atribuição de campanhas (Fase 4 — plano de marketing digital).
 * Guardamos o primeiro toque (first-touch) das UTMs por 30 dias e enviamos
 * no cadastro. O painel administrativo mostra os cadastros por origem.
 */
export const UTM_STORAGE_KEY = "reuse_utm";
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmData = Partial<Record<UtmKey, string>>;
type StoredUtm = UtmData & { capturedAt: number };

const SAFE_VALUE = /^[a-z0-9._\-+ ]{1,120}$/;

/** Lê as UTMs válidas de uma query string. Valores fora do padrão são ignorados. */
export function parseUtm(search: string): UtmData {
  const params = new URLSearchParams(search);
  const result: UtmData = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().toLowerCase();
    if (value && SAFE_VALUE.test(value)) result[key] = value;
  }
  return result;
}

export function hasUtm(data: UtmData) {
  return UTM_KEYS.some((key) => Boolean(data[key]));
}

/** Mantém o primeiro toque enquanto ele estiver dentro da validade. */
export function mergeFirstTouch(stored: StoredUtm | null, incoming: UtmData, now = Date.now()): StoredUtm | null {
  const storedIsValid = stored && hasUtm(stored) && now - stored.capturedAt < MAX_AGE_MS;
  if (storedIsValid) return stored;
  if (hasUtm(incoming)) return { ...incoming, capturedAt: now };
  return null;
}

export function readStoredUtm(storage: Pick<Storage, "getItem"> | undefined, now = Date.now()): UtmData {
  try {
    const raw = storage?.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredUtm;
    if (!parsed?.capturedAt || now - parsed.capturedAt >= MAX_AGE_MS) return {};
    const result: UtmData = {};
    for (const key of UTM_KEYS) {
      const value = parsed[key];
      if (typeof value === "string" && SAFE_VALUE.test(value)) result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}
