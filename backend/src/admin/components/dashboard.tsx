import React, { useEffect, useState } from "react";
import { ApiClient } from "adminjs";

type Entry = { label: string; count: number };
type DashboardData = {
  kpis: {
    users: number;
    newUsers30d: number;
    totalItems: number;
    available: number;
    donated: number;
    donationRate: number;
    interests: number;
    interests30d: number;
  };
  statusCounts: Array<{ status: string; label: string; count: number }>;
  topCategories: Array<{ name: string; count: number }>;
  utmSources: Entry[];
  utmCampaigns: Entry[];
  recentItems: Array<{
    id: string;
    title: string;
    status: string;
    statusLabel: string;
    category: string;
    owner: string;
    city: string | null;
    interests: number;
    createdAt: string;
  }>;
  generatedAt: string;
  links: { frontend: string; docs: string; health: string };
};

const C = {
  ink: "#13201a",
  muted: "#5b6b62",
  line: "#e3e9e5",
  card: "#ffffff",
  bg: "#f6f4ee",
  brand: "#1d5c45",
  accent: "#c9d94f",
};

const STATUS_COLORS: Record<string, string> = {
  DISPONIVEL: "#1d5c45",
  RESERVADO: "#d9a520",
  DOADO: "#8db8a6",
  PAUSADO: "#b8c0bb",
};

const api = new ApiClient();
const fmt = new Intl.NumberFormat("pt-BR");

const cardStyle: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 16,
  padding: 20,
};

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, lineHeight: 1.3, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 700, color: C.ink, margin: "10px 0 6px", letterSpacing: "-.02em" }}>{value}</div>
      <div style={{ fontSize: 13, lineHeight: 1.4, color: C.muted }}>{hint}</div>
    </div>
  );
}

function BarList({ entries, color = C.brand, empty }: { entries: Entry[]; color?: string; empty: string }) {
  const max = Math.max(1, ...entries.map((entry) => entry.count));
  if (entries.length === 0) return <div style={{ color: C.muted, fontSize: 14 }}>{empty}</div>;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {entries.map((entry) => (
        <div key={entry.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.ink, marginBottom: 4 }}>
            <span>{entry.label}</span>
            <strong>{fmt.format(entry.count)}</strong>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: "#eef2ef" }}>
            <div style={{ width: `${(entry.count / max) * 100}%`, height: 8, borderRadius: 99, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3, fontWeight: 700, color: C.ink }}>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .getDashboard()
      .then((response) => setData(response.data as DashboardData))
      .catch(() => setError(true));
  }, []);

  if (error) return <div style={{ padding: 32, color: C.ink }}>Não foi possível carregar o painel. Recarregue a página.</div>;
  if (!data) return <div style={{ padding: 32, color: C.muted }}>Carregando indicadores…</div>;

  const { kpis } = data;
  const totalStatus = Math.max(1, data.statusCounts.reduce((sum, entry) => sum + entry.count, 0));
  const linkStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    color: C.ink,
    background: C.card,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  };

  return (
    <div style={{ padding: "28px 32px 48px", background: C.bg, minHeight: "100%", lineHeight: 1.45, fontFamily: "Roboto, system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: C.brand, fontWeight: 700 }}>
            ReUse! · Área administrativa
          </div>
          <h1 style={{ margin: "8px 0 8px", fontSize: 30, lineHeight: 1.15, fontWeight: 700, color: C.ink, letterSpacing: "-.02em" }}>Visão geral da comunidade</h1>
          <div style={{ color: C.muted, fontSize: 14 }}>
            Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a style={{ ...linkStyle, background: C.brand, color: "#fff", borderColor: C.brand }} href={data.links.frontend} target="_blank" rel="noreferrer">
            Abrir site
          </a>
          <a style={linkStyle} href={data.links.docs} target="_blank" rel="noreferrer">
            Documentação da API
          </a>
          <a style={linkStyle} href="/admin/resources/Item">
            Gerenciar itens
          </a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
        <Kpi label="Pessoas" value={fmt.format(kpis.users)} hint={`+${fmt.format(kpis.newUsers30d)} nos últimos 30 dias`} />
        <Kpi label="Itens publicados" value={fmt.format(kpis.totalItems)} hint={`${fmt.format(kpis.available)} disponíveis agora`} />
        <Kpi label="Itens doados" value={fmt.format(kpis.donated)} hint={`${kpis.donationRate}% dos itens publicados`} />
        <Kpi label="Interesses" value={fmt.format(kpis.interests)} hint={`+${fmt.format(kpis.interests30d)} nos últimos 30 dias`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "start", gap: 16, marginBottom: 16 }}>
        <Section title="Itens por status">
          <div style={{ display: "flex", height: 14, borderRadius: 99, overflow: "hidden", background: "#eef2ef", marginBottom: 16 }}>
            {data.statusCounts.map((entry) => (
              <div
                key={entry.status}
                title={`${entry.label}: ${entry.count}`}
                style={{ width: `${(entry.count / totalStatus) * 100}%`, background: STATUS_COLORS[entry.status] ?? C.muted }}
              />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {data.statusCounts.map((entry) => (
              <div key={entry.status} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.ink }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_COLORS[entry.status] ?? C.muted }} />
                <span style={{ flex: 1 }}>{entry.label}</span>
                <strong>{fmt.format(entry.count)}</strong>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Categorias com mais itens">
          <BarList entries={data.topCategories.map((entry) => ({ label: entry.name, count: entry.count }))} empty="Nenhuma categoria cadastrada." />
        </Section>

        <Section title="Origem dos cadastros" aside={<span style={{ fontSize: 12, color: C.muted }}>utm_source</span>}>
          <BarList entries={data.utmSources} color="#7a9a2e" empty="Ainda não há cadastros." />
          {data.utmCampaigns.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Campanhas (utm_campaign)</div>
              {data.utmCampaigns.map((entry) => (
                <div key={entry.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.ink, padding: "3px 0" }}>
                  <code style={{ fontSize: 13 }}>{entry.label}</code>
                  <strong>{fmt.format(entry.count)}</strong>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Últimos itens publicados" aside={<a href="/admin/resources/Item" style={{ fontSize: 13, color: C.brand }}>Ver todos</a>}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, color: C.ink }}>
            <thead>
              <tr style={{ textAlign: "left", color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>
                <th style={{ padding: "8px 8px 8px 0" }}>Item</th>
                <th style={{ padding: 8 }}>Categoria</th>
                <th style={{ padding: 8 }}>Doador(a)</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8, textAlign: "right" }}>Interesses</th>
              </tr>
            </thead>
            <tbody>
              {data.recentItems.map((item) => (
                <tr key={item.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ padding: "10px 8px 10px 0" }}>
                    <a href={`/admin/resources/Item/records/${item.id}/show`} style={{ color: C.ink, fontWeight: 600, textDecoration: "none" }}>
                      {item.title}
                    </a>
                  </td>
                  <td style={{ padding: 8 }}>{item.category}</td>
                  <td style={{ padding: 8 }}>
                    {item.owner}
                    {item.city ? <span style={{ color: C.muted }}> · {item.city}</span> : null}
                  </td>
                  <td style={{ padding: 8 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 600,
                        color: item.status === "DOADO" || item.status === "PAUSADO" ? C.ink : "#fff",
                        background: STATUS_COLORS[item.status] ?? C.muted,
                      }}
                    >
                      {item.statusLabel}
                    </span>
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>{fmt.format(item.interests)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};

export default Dashboard;
