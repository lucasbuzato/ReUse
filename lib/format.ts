const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" });
const numberFormat = new Intl.NumberFormat("pt-BR");

export function formatDate(value: string) {
  return dateFormat.format(new Date(value));
}

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

export function plural(count: number, singular: string, pluralForm: string) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}

/** Tempo relativo curto: "hoje", "há 3 dias", "há 2 meses". */
export function timeAgo(value: string, now = Date.now()) {
  const days = Math.floor((now - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "há 1 mês" : `há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "há 1 ano" : `há ${years} anos`;
}

/** Aceita só caminhos internos para redirecionar depois do login. */
export function safeNextPath(value: unknown, fallback = "/perfil") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.startsWith("/api")) return fallback;
  return value;
}

const monthYearFormat = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

/** "agosto de 2026" */
export function formatMonthYear(value: string) {
  return monthYearFormat.format(new Date(value));
}
