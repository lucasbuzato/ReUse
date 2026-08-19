# ReUse! — Plataforma Web

Projeto acadêmico da FIAP ON desenvolvido para a fase de desenvolvimento web da plataforma **ReUse!**, uma solução voltada à reutilização e doação de objetos.

A aplicação não replica todo o aplicativo mobile. Ela concentra as áreas principais para acesso via navegador e demonstra a integração entre **Next.js, Prisma ORM e PostgreSQL**.

## Tecnologias

- **Next.js 14** — App Router, Server Components e API Routes
- **React 18**
- **Prisma ORM 5**
- **PostgreSQL**
- **Tailwind CSS**

## Funcionalidades desenvolvidas

| Rota | Tela | Objetivo |
|---|---|---|
| `/` | Home | Apresentar a proposta da ReUse! e exibir estatísticas consultadas no banco |
| `/itens` | Catálogo | Listar itens disponíveis e filtrar por categoria |
| `/itens/[id]` | Detalhes | Exibir um item, permitir manifestação de interesse e, para o dono, visualizar interessados |
| `/itens/novo` | Anunciar item | Criar um anúncio vinculado automaticamente ao usuário autenticado |
| `/cadastro` | Cadastro | Criar uma conta e iniciar uma sessão |
| `/login` | Login | Validar credenciais e criar uma sessão por cookie HTTP-only |
| `/perfil` | Perfil | Exibir dados da conta, anúncios, quantidade de interessados e ações de gerenciamento |

## Integração com Prisma

O Prisma é utilizado tanto nos **Server Components** quanto nas **API Routes**.

- Home: `count()` para estatísticas.
- Catálogo: `findMany()` com filtros, `include` e relacionamentos.
- Detalhes: `findUnique()` e `findMany()` para dados do item e interessados do proprietário.
- Cadastro: `user.create()`.
- Login: `user.findUnique()` e validação do hash da senha.
- Anúncio: `category.findMany()` e `item.create()`.
- Interesse: `item.findUnique()`, `interest.findUnique()` e `interest.create()`.
- Perfil: `user.findUnique()` com itens, categorias e `_count` de interesses.
- Gerenciamento: `item.update()` e `item.delete()` com verificação de proprietário.

## Banco de dados

O PostgreSQL possui quatro tabelas principais:

- `users` — contas dos usuários.
- `categories` — categorias dos anúncios.
- `items` — itens anunciados.
- `interests` — manifestações de interesse em itens.

Os relacionamentos são:

- `users 1:N items`
- `categories 1:N items`
- `users 1:N interests`
- `items 1:N interests`
- `users N:N items`, mediado por `interests`.

O relacionamento `interests(userId, itemId)` possui uma restrição única para impedir que a mesma conta manifeste interesse duas vezes no mesmo item.

## Como executar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o ambiente

Copie `.env.example` para `.env` e informe sua conexão PostgreSQL:

```bash
cp .env.example .env
```

No Windows, também é possível criar o arquivo `.env` manualmente.

Exemplo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reuse?schema=public"
AUTH_SECRET="uma-chave-secreta-para-a-aplicacao"
```

### 3. Gerar o Prisma Client

```bash
npx prisma generate
```

### 4. Aplicar as migrations

Para desenvolvimento:

```bash
npx prisma migrate dev
```

Ou para aplicar migrations já existentes:

```bash
npm run prisma:deploy
```

### 5. Popular o banco com dados de demonstração

```bash
npm run prisma:seed
```

Contas criadas pelo seed:

```text
maria@exemplo.com / 123456
joao@exemplo.com  / 123456
```

### 6. Executar

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Segurança e regras implementadas

- Senhas não são armazenadas em texto puro; são protegidas com `scrypt` e salt aleatório.
- A sessão é armazenada em cookie `HTTP-only`, com assinatura HMAC e expiração.
- Criar anúncios exige usuário autenticado.
- O `ownerId` de um anúncio vem da sessão, não do formulário.
- Manifestar interesse exige login e impede interesse no próprio anúncio.
- O mesmo usuário não pode manifestar interesse duas vezes no mesmo item.
- Alterar status ou excluir anúncio exige que o usuário seja o proprietário.
- A lista de interessados é exibida apenas ao proprietário do item.

## Estrutura principal

```text
app/
├── api/
│   ├── interests/
│   ├── items/
│   └── users/
├── cadastro/
├── itens/
├── login/
├── perfil/
└── page.tsx
components/
lib/
prisma/
├── migrations/
├── schema.prisma
└── seed.js
```

## Repositório

**GitHub:** `COLE_AQUI_O_LINK_DO_REPOSITORIO`

Substitua o texto acima pelo link real do repositório antes da entrega.
