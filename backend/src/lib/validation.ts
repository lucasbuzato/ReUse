import { HttpError } from "./http.js";

export function readString(value: unknown, { max = 2000 }: { max?: number } = {}) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function readOptionalString(value: unknown, { max = 2000 }: { max?: number } = {}) {
  const text = readString(value, { max });
  return text.length > 0 ? text : null;
}

export function requireLength(value: string, field: string, min: number, max: number) {
  if (value.length < min) {
    throw new HttpError(400, `${field} deve ter pelo menos ${min} caracteres.`, "validation_error");
  }
  if (value.length > max) {
    throw new HttpError(400, `${field} deve ter no máximo ${max} caracteres.`, "validation_error");
  }
  return value;
}

export function readHttpUrl(value: unknown) {
  const text = readOptionalString(value, { max: 1000 });
  if (!text) return null;

  // Imagens locais do próprio frontend (ex.: /seed/bicicleta.jpg) também são aceitas.
  if (text.startsWith("/") && !text.startsWith("//")) return text;

  try {
    const url = new URL(text);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocolo");
    return url.toString();
  } catch {
    throw new HttpError(400, "Informe uma URL de imagem válida (http ou https).", "validation_error");
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readEmail(value: unknown) {
  const email = readString(value, { max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new HttpError(400, "Informe um e-mail válido.", "validation_error");
  }
  return email;
}

/** Parâmetros de campanha (UTM) capturados na landing page e enviados no cadastro. */
export function readUtm(value: unknown) {
  const source = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  const clean = (entry: unknown) => {
    const text = readString(entry, { max: 120 }).toLowerCase();
    return /^[a-z0-9._\-+ ]+$/.test(text) ? text : null;
  };
  return {
    utmSource: clean(source.utmSource ?? source.utm_source),
    utmMedium: clean(source.utmMedium ?? source.utm_medium),
    utmCampaign: clean(source.utmCampaign ?? source.utm_campaign),
  };
}
