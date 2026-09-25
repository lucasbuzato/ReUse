# ReUse! — catálogo e interesses em Next.js

Aplicação acadêmica da **FIAP ON** para a Fase 6. A área escolhida da plataforma ReUse foi o **catálogo e os detalhes de itens**, com foco no fluxo de manifestação e acompanhamento de interesses entre visitantes e doadores.

## Links da entrega

- **Repositório público:** https://github.com/lucasbuzato/ReUse
- **Aplicação hospedada:** https://reuse-lucasbuzatos-projects.vercel.app
- **Decisões de UX e arquitetura:** [`DESIGN.md`](./DESIGN.md)
- **Evidências de validação:** [`VALIDATION.md`](./VALIDATION.md)
- **Atividade 02 — IBM watsonx Assistant:** [`docs/ATIVIDADE-02-WATSON.md`](./docs/ATIVIDADE-02-WATSON.md)
- **PDF final da Atividade 02:** [`docs/Atividade-02-ReUse-Watson.pdf`](./docs/Atividade-02-ReUse-Watson.pdf)
- **Configuração da conta IBM:** [`docs/IBM-WATSON-SETUP.md`](./docs/IBM-WATSON-SETUP.md)
- **OpenAPI importável:** [`watson/reuse-assistant-extension.openapi.json`](./watson/reuse-assistant-extension.openapi.json)

> Ambiente público validado na Vercel, com PostgreSQL Neon, migrations aplicadas e variáveis de produção configuradas.

## Área desenvolvida

A entrega potencializa o caminho principal da ReUse:

1. explorar itens disponíveis;
2. buscar por título, descrição ou cidade;
3. consultar detalhes do item e do doador;
4. autenticar-se e enviar uma mensagem de interesse;
5. receber confirmação imediata após o envio;
6. permitir que o proprietário acompanhe novos interessados sem recarregar a página.

O objetivo é reduzir o atrito entre quem deseja doar e quem pode reutilizar um objeto, preservando a privacidade dos participantes.

## Conteúdos do Capítulo 4 aplicados

### Route Handler contextual

O endpoint `app/api/items/[id]/interests/route.ts` oferece:

- `GET`: retorna dados diferentes para proprietário, visitante autenticado e pessoa anônima;
- `POST`: valida autenticação, disponibilidade do item, autoria, tamanho da mensagem e duplicidade;
- respostas privadas sem cache compartilhado (`Cache-Control: private, no-store`).

### SWR

O componente `ItemInterestPanel` usa SWR para:

- aproveitar os dados iniciais renderizados no servidor;
- revalidar ao recuperar foco;
- preservar o último resultado durante uma falha temporária;
- atualizar o painel do proprietário a cada **5 segundos**;
- disparar atualização manual quando necessário.

A experiência chamada de “tempo real” nesta entrega é implementada por **polling/revalidação periódica**, não por WebSocket.

### React Hook Form

O formulário de interesse utiliza React Hook Form para:

- validação reativa de preenchimento;
- mínimo de 10 e máximo de 500 caracteres;
- contador da mensagem;
- estados de envio, sucesso, falha de API e falha de conexão;
- bloqueio do botão enquanto os dados são inválidos ou estão sendo enviados.

### Mutação e revalidação

Depois do `POST`, o retorno da API atualiza imediatamente o cache do visitante com `mutate(payload, { revalidate: false })`. Em seguida, uma revalidação em segundo plano confirma o estado persistido no PostgreSQL. O proprietário recebe o novo interesse no próximo ciclo de 5 segundos, sem reload da página.

## Funcionalidades

| Área | Funcionalidades principais |
|---|---|
| Catálogo | listagem de itens disponíveis, filtro por categoria, busca textual e estado vazio contextual |
| Detalhes | imagem ou fallback, categoria, conservação, localização, status e informações do doador |
| Interesse | formulário validado, feedback imediato, prevenção de duplicidade e confirmação persistida |
| Painel do proprietário | contagem, nome, e-mail, mensagem, horário, atualização manual e atualização automática |
| Autenticação | cadastro, login, sessão assinada em cookie HTTP-only e logout |
| Anúncio | criação de item e gerenciamento de status pelo proprietário |
| Resiliência | loading skeleton, error boundary, preservação de dados no erro de revalidação e mensagens de conexão |
| Assistente IBM | Web Chat, orientações determinísticas e automações seguras para consultar, pausar e reativar anúncios |

## Privacidade e regras por papel

- **Pessoa anônima:** recebe somente a contagem total e um convite para login.
- **Visitante autenticado:** recebe apenas o próprio interesse, nunca os dados de outros interessados.
- **Proprietário:** recebe a lista completa de interessados do próprio item, incluindo o e-mail necessário para contato.
- O proprietário não pode demonstrar interesse no próprio item.
- Um usuário não pode registrar dois interesses no mesmo item.
- Itens pausados, reservados ou doados não aceitam novos interesses.
- Alteração de status e exclusão exigem que a sessão pertença ao proprietário.

## UX e acessibilidade

- layout responsivo validado em 390 px, 768 px e desktop;
- navegação principal identificada semanticamente;
- labels associados aos campos, autocomplete e nomes de controles;
- foco visível e áreas de toque com pelo menos 44 px nos principais controles;
- regiões de status e erro anunciadas por tecnologias assistivas;
- suporte a `prefers-reduced-motion`;
- estados de loading, vazio, erro, sucesso, anônimo e indisponível;
- nenhuma rolagem horizontal nas larguras testadas.

## Tecnologias

- **Next.js 16.3** — App Router, Server Components e Route Handlers;
- **React 18.3**;
- **TypeScript**;
- **SWR 2.5**;
- **React Hook Form 7.88**;
- **Prisma ORM 5.22**;
- **PostgreSQL (Neon)** — banco gerenciado conectado pela Vercel;
- **Tailwind CSS 3.4**;
- **ESLint 9** com regras do Next.js;
- **IBM watsonx Assistant** — Actions, Web Chat e extensão customizada OpenAPI 3.0.

## Rotas principais

| Rota | Responsabilidade |
|---|---|
| `/` | apresentação da plataforma e indicadores |
| `/itens` | catálogo, categorias e busca |
| `/itens/[id]` | detalhes, interesse e painel do proprietário |
| `/itens/novo` | criação de anúncio autenticada |
| `/cadastro` | criação de conta |
| `/login` | autenticação |
| `/perfil` | dados da conta e anúncios do usuário |
| `/api/items/[id]/interests` | leitura por papel e criação de interesse |
| `/api/assistant/session` | token curto da conta conectada para o Web Chat |
| `/api/assistant/actions/items/summary` | resumo dos anúncios do proprietário |
| `/api/assistant/actions/items/pause` | pausa em lote dos anúncios disponíveis do proprietário |
| `/api/assistant/actions/items/reactivate` | reativação em lote dos anúncios pausados do proprietário |

As rotas legadas `/api/interests` e o componente `FormularioInteresse` foram mantidos para preservar compatibilidade com a versão anterior.

## Arquitetura resumida

```text
Server Component de detalhes
        │
        ├── Prisma/PostgreSQL: item + dados iniciais permitidos para o papel
        │
        └── ItemInterestPanel (Client Component)
                │
                ├── SWR GET /api/items/[id]/interests
                ├── React Hook Form
                └── POST + mutate local + revalidação
```

## Como executar localmente

### Pré-requisitos

- Node.js 20.9 ou superior;
- PostgreSQL acessível pela aplicação;
- npm.

### 1. Instalar dependências

```bash
npm ci
```

### 2. Configurar o ambiente

```bash
cp .env.example .env
```

Preencha somente no arquivo local:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/reuse?schema=public"
AUTH_SECRET="gere-uma-chave-longa-e-aleatoria"
ASSISTANT_ACTION_SECRET="outro-segredo-com-pelo-menos-32-caracteres"
ASSISTANT_EXTENSION_API_KEY="chave-configurada-tambem-na-extensao-IBM"

# Públicos, copiados do snippet de Embed do Web Chat
NEXT_PUBLIC_IBM_ASSISTANT_INTEGRATION_ID=""
NEXT_PUBLIC_IBM_ASSISTANT_REGION=""
NEXT_PUBLIC_IBM_ASSISTANT_SERVICE_INSTANCE_ID=""
```

Não publique `.env` nem credenciais reais.

### 3. Preparar o banco

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

O seed cria duas contas exclusivamente para demonstração local:

```text
maria@exemplo.com / 123456
joao@exemplo.com  / 123456
```

### 4. Iniciar

```bash
npm run dev
```

Acesse http://localhost:3000.

## Qualidade

```bash
npm test           # testes de segurança, domínio e artefatos Watson
npm run lint       # ESLint
npm run typecheck  # TypeScript sem emissão
npm run build      # build de produção
npm run check      # testes + lint + tipos + build
```

A validação funcional completa e os resultados observados estão em [`VALIDATION.md`](./VALIDATION.md).

## Estrutura relevante

```text
app/
├── api/
│   ├── interests/                    # compatibilidade legada
│   ├── items/
│   │   └── [id]/interests/route.ts   # GET e POST da entrega
│   └── users/
├── itens/
│   ├── [id]/page.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   └── page.tsx
└── providers.tsx                     # SWRConfig
components/
└── ItemInterestPanel.tsx
lib/
├── auth.ts
├── interest-types.ts
└── prisma.ts
prisma/
├── migrations/
├── schema.prisma
└── seed.js
```

## Banco de dados

O modelo mantém quatro entidades principais:

- `users` — contas de doadores e interessados;
- `categories` — categorias dos anúncios;
- `items` — itens publicados;
- `interests` — mensagens de interesse.

A chave única composta `interests(userId, itemId)` garante a regra de uma manifestação por usuário e item. A exclusão de um item remove seus interesses em cascata.
