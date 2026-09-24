# Validação técnica — ReUse Fase 6

## 1. Escopo validado

A validação cobre a área de **catálogo e detalhes de itens**, com ênfase no envio e no acompanhamento de interesses por meio de Route Handler, SWR, React Hook Form, mutação e revalidação periódica.

Data da consolidação: **23/09/2026**.

## 2. Ambiente

| Componente | Versão validada |
|---|---:|
| Node.js | 22.23.2 |
| npm | 10.9.8 |
| Next.js | 16.3.1 |
| React | 18.3.1 |
| SWR | 2.5.1 |
| React Hook Form | 7.88.0 |
| Prisma / `@prisma/client` | 5.22.0 |
| Tailwind CSS | 3.4.19 |
| ESLint | 9.39.5 |
| PostgreSQL local temporário | 18.6 |
| PostgreSQL de produção | Neon via Vercel Marketplace |

O quality gate principal foi executado em uma cópia Linux limpa da fonte. Nesse ciclo, `DATABASE_URL` apontou somente para o PostgreSQL temporário local e `AUTH_SECRET` foi gerado aleatoriamente, sem persistência em arquivo.

O ambiente público usa PostgreSQL Neon conectado à Vercel. `DATABASE_URL`, `DATABASE_URL_UNPOOLED` e `AUTH_SECRET` estão configuradas como variáveis protegidas; nenhum valor foi incluído no repositório.

## 3. Banco de dados

O comando `prisma migrate status` confirmou o schema atualizado e as duas migrations aplicadas:

- `20260818185000_init`;
- `20260818190000_add_interest_unique_and_cascade`.

No Neon de produção, `prisma migrate deploy` aplicou as duas migrations e `prisma migrate status` confirmou **Database schema is up to date**. O seed idempotente foi executado no mesmo ambiente.

Antes do quality gate final, o estado de demonstração foi restaurado e o seed idempotente foi executado. Estado confirmado depois da limpeza:

| Registro | Quantidade |
|---|---:|
| Usuários de demonstração | 2 |
| Categorias | 5 |
| Itens | 2 |
| Interesses | 0 |
| Itens fora de `DISPONIVEL` | 0 |

## 4. Quality gate final

Comandos executados:

```bash
npm run prisma:seed
npx --no-install prisma migrate status
npm run check
```

Resultado em **23/09/2026**:

- [x] schema do banco atualizado;
- [x] ESLint sem erros;
- [x] TypeScript sem erros;
- [x] build de produção concluído;
- [x] Next.js gerou as 13 páginas esperadas;
- [x] Route Handlers e páginas dinâmicas reconhecidos pelo build;
- [x] processo encerrado com código `0`.

O script `npm run check` executa, em sequência, `npm run lint`, `npm run typecheck` e `npm run build`.

## 5. Validação funcional ponta a ponta

### 5.1 Catálogo e navegação

- [x] navegação principal possui nome acessível;
- [x] link **Explorar** permanece visível no mobile;
- [x] campo de busca possui label, `name="busca"` e acesso por teclado;
- [x] busca por **Campinas** retorna somente **Notebook usado** e informa **1 item encontrado**;
- [x] filtro por categoria preserva o termo de busca na URL;
- [x] detalhe do item funciona em viewport mobile sem rolagem horizontal;
- [x] pessoa anônima vê a contagem e o CTA de login.

### 5.2 Contrato e privacidade do Route Handler

| Papel | Resultado confirmado no `GET /api/items/[id]/interests` |
|---|---|
| Anônimo | `200`, papel `anonymous`, total agregado, lista vazia e nenhuma identidade |
| Visitante autenticado | `200`, papel `visitor`, somente o próprio interesse e nenhum dado de terceiros |
| Proprietário | `200`, papel `owner`, lista privada com nome, e-mail, mensagem e horário |

Todas as respostas desse endpoint foram confirmadas com `Cache-Control: private, no-store`.

Também foram verificados:

- [x] `POST` anônimo retorna `401`;
- [x] mensagem com menos de 10 caracteres retorna `400`;
- [x] interesse no próprio item retorna `400`;
- [x] interesse duplicado retorna `409`;
- [x] item indisponível não apresenta formulário para um novo interesse;
- [x] interesse registrado anteriormente continua visível ao visitante quando o item é reservado.

### 5.3 React Hook Form, mutação e persistência

- [x] botão começa desabilitado com formulário vazio;
- [x] mensagem curta exibe **Use pelo menos 10 caracteres** e mantém o botão desabilitado;
- [x] mensagem válida habilita o envio;
- [x] envio visual retorna `201`;
- [x] confirmação substitui o formulário e preserva a mensagem enviada;
- [x] revalidação posterior confirma o dado persistido;
- [x] interesse continua visível após recarregar a página.

### 5.4 Atualização automática do proprietário

O painel do proprietário usa `refreshInterval: 5000`, portanto o intervalo máximo configurado entre consultas automáticas é de **5 segundos**.

No cenário E2E, o painel de João já estava dentro de um ciclo de polling quando Maria enviou o interesse. A atualização apareceu sem reload em aproximadamente **1,9 segundo**. Esse número é uma observação daquela execução, não a configuração do intervalo nem uma garantia fixa de latência.

Também foram confirmados:

- [x] estado vazio inicial;
- [x] atualização manual;
- [x] entrada automática do novo interesse;
- [x] nome, e-mail e mensagem visíveis apenas ao proprietário;
- [x] ciclo adicional de polling de 5,5 segundos sem erro de console.

### 5.5 Gerenciamento do item

- [x] proprietário alterou o item para **Reservado** com resposta `200`;
- [x] interface refletiu o novo status;
- [x] pessoa anônima recebeu o estado **Item indisponível**;
- [x] restauração para **Disponível** retornou `200` e atualizou a interface.

## 6. Console e hidratação

Na bateria que incluiu chamadas negativas intencionais, as únicas mensagens de erro do navegador foram `Failed to load resource` correspondentes exatamente às respostas esperadas `401`, `409`, `400` e `400`.

Em uma execução direcionada posterior, sem chamadas negativas:

- [x] pessoa anônima abriu e recarregou o detalhe;
- [x] Maria abriu e recarregou o interesse persistido;
- [x] João abriu e recarregou a lista e completou um ciclo de polling;
- [x] zero warnings de console;
- [x] zero erros de console;
- [x] zero `pageerror`;
- [x] erro minificado React `#418` ausente;
- [x] nenhuma divergência de hidratação.

A formatação de horário usa explicitamente `America/Sao_Paulo` para manter servidor e cliente consistentes.

## 7. Responsividade e acessibilidade

Viewports verificadas:

- **390 px** — mobile;
- **768 px** — tablet;
- **1440 px** — desktop.

Resultados:

- [x] nenhuma rolagem horizontal nas três larguras;
- [x] catálogo reorganizado conforme o espaço disponível;
- [x] categorias com rolagem horizontal controlada quando necessário;
- [x] foco visível calculado como outline sólido de 3 px;
- [x] controles prioritários com área mínima de 44 px;
- [x] labels associados aos campos;
- [x] estados e erros em regiões anunciáveis;
- [x] navegação dos fluxos não destrutivos por teclado;
- [x] `prefers-reduced-motion` reconhecido, com animações e transições reduzidas a `0.00001s` e uma iteração.

## 8. Evidências visuais

| Arquivo | Viewport ou recorte | Conteúdo |
|---|---:|---|
| `docs/evidence/catalog-mobile.png` | 390 × 1912 | catálogo mobile |
| `docs/evidence/catalog-tablet.png` | 768 × 1287 | catálogo tablet |
| `docs/evidence/catalog-desktop.png` | 1440 × 1218 | catálogo desktop |
| `docs/evidence/item-anonymous-mobile.png` | 390 × 1565 | detalhe para pessoa anônima |
| `docs/evidence/interest-sent-mobile.png` | 358 × 289 | confirmação de interesse |
| `docs/evidence/owner-empty-desktop.png` | 1104 × 388 | painel vazio do proprietário |
| `docs/evidence/owner-live-update-desktop.png` | 1104 × 372 | atualização automática do painel |

## 9. Validação no ambiente público

- **URL estável:** https://reuse-lucasbuzatos-projects.vercel.app
- [x] deployment de produção com estado `Ready`;
- [x] `/`, `/itens` e `/login` retornam HTTP `200` sem exigir conta Vercel;
- [x] catálogo público leu do Neon os itens **Cadeira de escritório** e **Notebook usado**;
- [x] login da conta de demonstração redirecionou para `/perfil`;
- [x] sessão permaneceu autenticada após reload;
- [x] nenhuma exceção de página foi observada;
- [x] uma execução limpa das rotas públicas terminou sem resposta HTTP `4xx` ou `5xx`;
- [x] `AUTH_SECRET` configurado separadamente para produção e previews.

A validação pública concentrou-se no smoke test, leitura do banco, autenticação e persistência da sessão. Os cenários destrutivos e de mutação detalhados na seção 5 permaneceram no ambiente controlado para não alterar o estado público da demonstração.

## 10. Limites desta validação

- “Tempo real” significa polling/revalidação periódica com SWR, não WebSocket.
- O quality gate e o E2E descritos acima foram executados no ambiente local controlado.
- A bateria funcional completa descrita na seção 5 foi executada no ambiente controlado; em produção foram repetidos smoke test, leitura do Neon, login e persistência da sessão.
- Nenhuma credencial real, `.env`, build, dependência ou dado temporário deve ser incluído no repositório.
