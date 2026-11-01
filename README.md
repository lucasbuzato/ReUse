# ReUse! — troca e doação de itens

Projeto acadêmico da **FIAP ON**. O ReUse! liga quem quer doar um objeto a quem pode reutilizá-lo.
A pessoa anuncia o item, outras pessoas demonstram interesse e o dono escolhe para quem entregar.

## Links da entrega (fase final)

| O quê | Link |
| --- | --- |
| Site (frontend Next.js) | https://reuse-alpha.vercel.app |
| API (backend Node.js) | https://reuse-alpha.vercel.app/api |
| Documentação da API (OpenAPI) | https://reuse-alpha.vercel.app/api/docs |
| Área administrativa low-code (AdminJS) | https://reuse-alpha.vercel.app/admin |
| Saúde da API | https://reuse-alpha.vercel.app/health |

As contas de demonstração e de avaliação estão no PDF de entrega. Elas não ficam no repositório.

## O que cada fase entregou

| Fase | Entrega | Onde está |
| --- | --- | --- |
| 4 — Marketing digital | Rastreamento de campanhas com UTM (primeiro toque). A origem fica salva no cadastro e aparece no painel. | `lib/utm.ts`, `POST /api/users`, painel `/admin` |
| 5 — Full Stack | Frontend Next.js separado do backend Node.js com Prisma e PostgreSQL. | raiz do repositório e `backend/` |
| 6 — ChatBot e low code | Assistente IBM watsonx com ações seguras e área administrativa feita com AdminJS. | `watson/`, `backend/src/routes/assistant.ts`, `backend/src/admin/` |

## Arquitetura

```text
Navegador
   │
   ▼
reuse-alpha.vercel.app ─ um projeto na Vercel com dois serviços (vercel.json)
   │
   ├─ /api, /admin, /health ──► serviço "api" (pasta backend/)
   └─ todo o resto ───────────► serviço "web" (raiz, Next.js 16, SSR)
                                   o servidor do Next chama a API pelo binding
                                   interno e repassa só o cookie de sessão
   ▼
serviço "api" ─ Node.js + Express + TypeScript
   ├─ /api/*     API REST (itens, interesses, contas, categorias, estatísticas, assistente)
   ├─ /api/docs  documentação OpenAPI
   └─ /admin     AdminJS (low code) com perfis ADMIN e VIEWER
   │
   ▼
PostgreSQL (Neon) via Prisma ORM

IBM watsonx Assistant ──► /api/assistant/actions/* (chave de API + token assinado)
```

Por que separar frontend e backend (mesmo no mesmo projeto da Vercel):

- cada serviço tem build, dependências e logs próprios;
- a API pode atender outros clientes (assistente IBM, painel, app móvel no futuro);
- o painel AdminJS fica no backend, perto do banco, sem pesar no site;
- um só domínio: os cookies de sessão são first-party e não há CORS entre site e API.

## Tecnologias

- **Frontend:** Next.js 16, React 18, Tailwind CSS 3, SWR, React Hook Form.
- **Backend:** Node.js 24, Express 4, TypeScript (ESM), Prisma 5, PostgreSQL.
- **Low code:** AdminJS 7 com adaptador Prisma, tema e textos em português.
- **ChatBot:** IBM watsonx Assistant (Web Chat + extensão OpenAPI).
- **Hospedagem gratuita:** Vercel (um projeto com Vercel Services) e Neon (PostgreSQL).

## Estrutura de pastas

```text
app/                 páginas do site (Next.js App Router)
components/          componentes do site (site/, ui/ e formulários)
lib/                 cliente da API, UTM, formatação e metadados
tests/               testes do frontend (node:test)
backend/
├── src/app.ts       app Express (a Vercel usa este arquivo como função)
├── src/local.ts     servidor HTTP para rodar localmente
├── src/routes/      rotas da API
├── src/admin/       AdminJS: recursos, ações, painel e componentes
├── src/docs/        especificação OpenAPI
├── prisma/          schema, migrations e seed de demonstração
├── scripts/         bundle do AdminJS e criação de contas do painel
└── tests/           testes da API (node:test, com banco real)
watson/              ações e OpenAPI da extensão do IBM watsonx Assistant
```

## API REST

| Método e rota | Uso |
| --- | --- |
| `GET /api/items` | Lista itens (busca `q`, `category`, `status`, `limit`). |
| `GET /api/items/:id` | Detalhe do item. |
| `POST /api/items` | Publica item (precisa de sessão). |
| `PATCH /api/items/:id` · `DELETE /api/items/:id` | Dono altera status ou remove. |
| `GET /api/items/:id/interests` · `POST /api/items/:id/interests` | Painel de interessados e envio de interesse. |
| `POST /api/users` · `POST /api/users/login` · `POST /api/users/logout` | Cadastro (com UTM), login e saída. |
| `GET /api/users/me` · `/me/items` · `/me/interests` | Dados da pessoa logada. |
| `GET /api/categories` · `GET /api/stats` | Categorias e números da plataforma. |
| `POST /api/assistant/session` · `/api/assistant/actions/*` | Sessão do Web Chat e ações do assistente. |
| `GET /api/openapi.json` · `GET /api/docs` · `GET /health` | Contrato, documentação e saúde. |

A sessão usa o cookie `reuse_session` (HTTP-only, assinado com `AUTH_SECRET`).
Requisições de escrita de origens desconhecidas são bloqueadas.

## Área administrativa (AdminJS)

- **Painel inicial:** pessoas, itens por status, taxa de doação, categorias, cadastros por origem (UTM) e itens recentes.
- **Recursos:** Itens, Categorias, Interesses e Pessoas.
- **Ações próprias:** marcar como doado, pausar e reativar anúncio.
- **Perfis:** `ADMIN` altera dados. `VIEWER` só consulta e vê e-mails mascarados (conta da banca).

Criar uma conta do painel (o comando pede os dados por variável de ambiente):

```bash
cd backend
ADMIN_EMAIL="pessoa@exemplo.com" ADMIN_PASSWORD="senha-forte" ADMIN_NAME="Nome" ADMIN_ROLE="ADMIN" npm run admin:create
```

## Rastreamento de campanhas (UTM)

1. Um anúncio (Google Ads, Instagram, e-mail) aponta para o site com `utm_source`, `utm_medium` e `utm_campaign`.
2. O site guarda a **primeira origem** no navegador por 30 dias (`lib/utm.ts`).
3. No cadastro, a origem vai junto e fica salva na conta.
4. O painel `/admin` mostra quantos cadastros vieram de cada fonte e campanha.

Exemplo: `https://reuse-alpha.vercel.app/?utm_source=google&utm_medium=cpc&utm_campaign=lancamento_reuse`

## Como rodar localmente

Pré-requisitos: Node.js 20 ou mais novo, npm e um PostgreSQL.

### 1. Backend (porta 4000)

```bash
cd backend
npm ci
cp .env.example .env        # preencha DATABASE_URL e AUTH_SECRET
npm run prisma:deploy       # cria as tabelas
npm run prisma:seed         # dados de demonstração
npm run dev                 # http://localhost:4000 (docs em /api/docs, painel em /admin)
```

No banco local, o seed usa a senha `reuse-demo-local` em todas as contas `@reuse.example`.
Fora do banco local, defina `SEED_PASSWORD`.

### 2. Frontend (porta 3000)

```bash
npm ci
npm run dev                 # http://localhost:3000, usa a API em http://localhost:4000
```

## Variáveis de ambiente

### Backend (`backend/.env` ou variáveis do projeto na Vercel)

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão PostgreSQL (Neon em produção). |
| `AUTH_SECRET` | sim | Assina o cookie de sessão. Use o mesmo valor do frontend antigo para manter as sessões. |
| `FRONTEND_URL` | opcional | URL do site (links do painel). Padrão em produção: `https://reuse-alpha.vercel.app`. |
| `PUBLIC_API_URL` | opcional | URL pública da API (assets do painel). Padrão na Vercel: URL do deploy. |
| `CORS_ORIGINS` | opcional | Outras origens permitidas, separadas por vírgula. |
| `ASSISTANT_ACTION_SECRET`, `ASSISTANT_EXTENSION_API_KEY` | assistente | Protegem as ações do IBM watsonx Assistant. |
| `ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64`, `ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64` | assistente | Segurança do Web Chat (JWT). |
| `SEED_PASSWORD` | seed fora do local | Senha das contas de demonstração. |

### Frontend (raiz)

| Variável | Uso |
| --- | --- |
| `BACKEND_URL` | Só fora da Vercel: URL da API local (padrão `http://localhost:4000`). Na Vercel o binding do `vercel.json` injeta este valor. |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (metadados e sitemap). Opcional. |
| `NEXT_PUBLIC_IBM_ASSISTANT_*` | Dados públicos do Web Chat do IBM watsonx Assistant. |

Nunca publique arquivos `.env` nem credenciais reais.

## Deploy na Vercel (plano gratuito)

Um só projeto (`reuse`), ligado ao repositório do GitHub, com **Vercel Services**.
O `vercel.json` define os dois serviços e as rotas públicas:

| Serviço | Pasta | Build | Rotas públicas |
| --- | --- | --- | --- |
| `web` | raiz | `npm run build` (Next.js) | todas as outras |
| `api` | `backend` | `npm run build` (Prisma Client, tipos e bundle do AdminJS) | `/api`, `/admin`, `/admin-assets`, `/brand`, `/health` |

- Cada push gera um deploy de preview; o merge na `main` publica em produção.
- O serviço `web` chama o serviço `api` pelo binding interno (`BACKEND_URL`), sem passar pela internet.
- As variáveis do projeto (banco Neon, `AUTH_SECRET`, chaves do assistente) valem para os dois serviços.

Banco de produção (uma vez por mudança de schema), com as variáveis do projeto em um arquivo local:

1. `cd backend && npm run prisma:deploy` — aplica as migrations.
2. `SEED_PASSWORD=... npm run prisma:seed` — dados de demonstração (só faz upsert, não apaga dados).
3. `npm run admin:create` — cria as contas do painel (perfis `ADMIN` e `VIEWER`).
4. Conferir `/health`, `/api/docs` e `/admin` no domínio do site.

## Qualidade

```bash
# frontend (raiz)
npm run check               # testes + lint + tipos + build

# backend
cd backend
npm run typecheck
RUN_DATABASE_TESTS=1 npm test   # inclui testes com banco real
```

O GitHub Actions (`.github/workflows/ci.yml`) roda os dois conjuntos em cada push e pull request:
o backend com um PostgreSQL de teste e o frontend com testes, lint, tipos e build.

## Documentos das fases anteriores

- Atividade 02 — IBM watsonx Assistant: [`docs/ATIVIDADE-02-WATSON.md`](./docs/ATIVIDADE-02-WATSON.md)
- Configuração da conta IBM: [`docs/IBM-WATSON-SETUP.md`](./docs/IBM-WATSON-SETUP.md)
- OpenAPI da extensão: [`watson/reuse-assistant-extension.openapi.json`](./watson/reuse-assistant-extension.openapi.json)
