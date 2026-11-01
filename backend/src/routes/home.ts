import type { Request, Response } from "express";
import { config, resolvePublicBaseUrl } from "../config.js";
import { API_ENDPOINTS } from "./meta.js";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

/** Página inicial do backend: links para documentação, saúde, painel e frontend. */
export function homeHandler(req: Request, res: Response) {
  const base = resolvePublicBaseUrl(req.get("x-forwarded-host") ?? req.get("host"));
  const rows = API_ENDPOINTS.map(
    ([method, path, description]) =>
      `<tr><td><span class="m m-${method.toLowerCase()}">${method}</span></td><td><code>${escapeHtml(path)}</code></td><td>${escapeHtml(description)}</td></tr>`
  ).join("");

  res.set("Cache-Control", "public, max-age=0, s-maxage=300");
  res.type("html").send(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ReUse! API</title>
<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml" />
<style>
  :root { --ink:#13201a; --muted:#5b6b62; --line:#dfe6e1; --bg:#f6f4ee; --brand:#1d5c45; --accent:#e8f067; }
  * { box-sizing: border-box; }
  body { margin:0; font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color:var(--ink); background:var(--bg); }
  main { max-width: 960px; margin: 0 auto; padding: 56px 24px 72px; }
  .tag { display:inline-flex; gap:8px; align-items:center; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--brand); font-weight:600; }
  .dot { width:8px; height:8px; border-radius:50%; background:#22a06b; box-shadow:0 0 0 4px #22a06b22; }
  h1 { font-size: clamp(36px, 6vw, 56px); line-height:1.02; margin:14px 0 12px; letter-spacing:-.03em; }
  p.lead { color:var(--muted); max-width: 640px; font-size:17px; margin:0 0 28px; }
  .cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:40px; }
  .card { display:block; padding:18px; border-radius:16px; background:#fff; border:1px solid var(--line); color:inherit; text-decoration:none; transition: transform .15s, border-color .15s; }
  .card:hover { transform: translateY(-2px); border-color: var(--brand); }
  .card b { display:block; font-size:16px; margin-bottom:4px; }
  .card span { color:var(--muted); font-size:13px; }
  .card.primary { background: var(--brand); color:#fff; border-color: var(--brand); }
  .card.primary span { color:#d6e7df; }
  table { width:100%; border-collapse: collapse; background:#fff; border:1px solid var(--line); border-radius:16px; overflow:hidden; }
  td { padding:10px 14px; border-top:1px solid var(--line); vertical-align: top; }
  tr:first-child td { border-top:0; }
  code { font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; }
  .m { display:inline-block; min-width:62px; text-align:center; font: 600 11px ui-monospace, monospace; padding:3px 6px; border-radius:6px; background:#eef2ef; }
  .m-get { background:#e3f4ea; color:#14663f; } .m-post { background:#e6eefc; color:#1f4fb4; } .m-patch { background:#fdf2dc; color:#8a5a00; } .m-delete { background:#fce7e7; color:#a42828; }
  footer { margin-top:28px; color:var(--muted); font-size:13px; }
</style>
</head>
<body>
<main>
  <span class="tag"><span class="dot"></span> Online · v${config.version}</span>
  <h1>ReUse! API</h1>
  <p class="lead">Backend Node.js (Express + Prisma + PostgreSQL) da plataforma colaborativa de troca e doação de itens. Inclui a área administrativa low-code e a integração com o IBM watsonx Assistant.</p>
  <div class="cards">
    <a class="card primary" href="/api/docs"><b>Documentação</b><span>Referência interativa (OpenAPI)</span></a>
    <a class="card" href="/admin"><b>Painel administrativo</b><span>Área low-code (AdminJS)</span></a>
    <a class="card" href="/health"><b>Saúde</b><span>Status da API e do banco</span></a>
    <a class="card" href="${escapeHtml(config.frontendUrl)}"><b>Frontend</b><span>Aplicação Next.js</span></a>
  </div>
  <table>${rows}</table>
  <footer>Base URL: <code>${escapeHtml(base)}</code> · Projeto acadêmico FIAP</footer>
</main>
</body>
</html>`);
}
