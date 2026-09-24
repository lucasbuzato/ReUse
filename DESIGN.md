# Design e arquitetura — ReUse Fase 6

## 1. Recorte da entrega

A área escolhida é o **catálogo e os detalhes de itens**, com ênfase no fluxo de manifestação e acompanhamento de interesses.

Esse recorte foi selecionado porque concentra, em uma experiência coerente, os principais conteúdos do Capítulo 4:

- Route Handlers com parâmetro dinâmico;
- leitura e cache no cliente com SWR;
- formulário com React Hook Form;
- mutação, atualização imediata e revalidação;
- persistência relacional com Prisma e PostgreSQL.

A entrega não reescreve toda a plataforma. Cadastro, login, perfil, anúncio e gerenciamento existentes foram preservados e receberam somente ajustes necessários de integração, responsividade e acessibilidade.

## 2. Objetivos de experiência

1. **Descoberta rápida:** permitir que o visitante encontre um item por categoria, título, descrição ou cidade.
2. **Decisão informada:** apresentar condição, localização, status, descrição e identidade do doador em uma hierarquia simples.
3. **Manifestação segura:** orientar uma mensagem útil, limitar o conteúdo e explicar como os dados pessoais são utilizados.
4. **Feedback imediato:** confirmar o envio sem recarregar a tela.
5. **Acompanhamento do doador:** mostrar novos interessados automaticamente e permitir atualização manual.
6. **Privacidade por padrão:** retornar da API somente o conjunto de dados permitido para cada papel.

## 3. Fluxos principais

### 3.1 Pessoa anônima

```text
Catálogo → detalhes → contagem de interesses → CTA para login
```

A pessoa anônima não recebe nomes, mensagens ou e-mails. O painel explica que os dados de contato serão vistos somente pelo doador.

### 3.2 Visitante autenticado

```text
Detalhes → mensagem válida → POST → confirmação imediata → revalidação
```

O formulário começa desabilitado enquanto inválido. Após a persistência, a resposta da API alimenta o cache SWR e substitui o formulário pela confirmação. A revalidação posterior verifica o estado do servidor.

### 3.3 Proprietário

```text
Detalhes do próprio item → gerenciamento + painel → polling a cada 5 s
```

O proprietário vê a quantidade e os dados necessários para contato. O painel mantém os últimos dados visíveis se uma atualização temporária falhar.

## 4. Arquitetura de interação

### 4.1 Renderização inicial

`app/itens/[id]/page.tsx` é um Server Component. Ele lê a sessão, consulta o item e monta um `initialData` discriminado pelo papel:

- `owner`;
- `visitor`;
- `anonymous`.

Essa abordagem entrega HTML útil desde a primeira renderização e evita que dados privados sejam enviados a papéis não autorizados.

### 4.2 Route Handler

`app/api/items/[id]/interests/route.ts` implementa:

#### GET

- confirma a existência do item;
- identifica o papel pela sessão;
- proprietário: retorna lista com nome e e-mail;
- visitante: retorna somente o próprio interesse;
- anônimo: retorna somente o total;
- impede cache compartilhado da resposta.

#### POST

- exige sessão autenticada;
- normaliza a mensagem com `trim()`;
- valida de 10 a 500 caracteres;
- bloqueia interesse no próprio item;
- bloqueia item indisponível;
- trata a restrição única do Prisma (`P2002`);
- retorna o novo estado permitido para o visitante.

### 4.3 Estado no cliente

O `SWRConfig` global define fetcher JSON, deduplicação de 2 segundos, revalidação ao focar e ausência de tentativas automáticas em loop.

No `ItemInterestPanel`:

- `fallbackData` reutiliza o resultado do servidor;
- `keepPreviousData` evita apagar dados durante uma revalidação;
- `refreshInterval` retorna 5.000 ms somente para o proprietário;
- `mutate(payload, { revalidate: false })` atualiza imediatamente o visitante;
- `mutate()` confirma o dado persistido em segundo plano.

### 4.4 Significado de “tempo real”

A sincronização desta entrega usa **polling de 5 segundos via SWR**. Isso oferece atualização automática com implementação adequada ao escopo acadêmico e ao backend existente. Não há WebSocket, Server-Sent Events ou promessa de entrega instantânea.

## 5. Estados projetados

| Estado | Tratamento |
|---|---|
| Carregamento do catálogo | skeleton responsivo e `aria-busy` |
| Catálogo sem resultado | mensagem contextual, limpar filtros e anunciar item |
| Falha do catálogo | error boundary com retry e retorno à home |
| Formulário inválido | botão desabilitado e mensagem junto ao campo |
| Envio em andamento | rótulo de progresso e bloqueio de reenvio |
| Interesse enviado | confirmação persistente com a mensagem e horário |
| Duplicidade | resposta 409 e orientação clara |
| Usuário anônimo | CTA para autenticação e explicação de privacidade |
| Item indisponível | bloqueio de novo interesse; interesse anterior continua consultável |
| Painel sem interessados | estado vazio explicativo |
| Erro de revalidação | aviso sem apagar os últimos dados válidos |

## 6. Linguagem visual

A interface existente foi preservada e refinada:

- verde ReUse como cor de ação e confiança;
- superfícies brancas sobre fundo verde muito claro;
- cartões com cantos arredondados e sombras discretas;
- baixa densidade visual;
- textos em português simples e tom comunitário;
- status diferenciados por texto, cor e indicador, sem depender apenas de cor.

Não foi introduzido um novo design system que descaracterizasse a entrega anterior.

## 7. Responsividade

Breakpoints e decisões verificadas:

- **390 px:** navegação essencial visível, formulários em coluna e sem overflow horizontal;
- **768 px:** catálogo em duas colunas e filtros com espaço equilibrado;
- **desktop/1440 px:** detalhes em duas colunas e painel de interessados em grade;
- chips de categoria usam rolagem horizontal controlada quando necessário;
- ações principais ocupam a largura disponível no mobile.

## 8. Acessibilidade

- idioma do documento definido como `pt-BR`;
- navegação principal com nome acessível;
- hierarquia de títulos por tela e seções rotuladas;
- labels associados por `htmlFor`/`id`;
- `name` e `autocomplete` nos campos de autenticação;
- estados de erro com `role="alert"`;
- atualizações com regiões `aria-live`;
- foco visível global e reforçado nos componentes principais;
- controles prioritários com altura mínima de 44 px;
- ícones decorativos ocultos de tecnologias assistivas;
- suporte a `prefers-reduced-motion` para animações e transições;
- teclado suficiente para navegar, preencher e acionar todos os fluxos não destrutivos.

## 9. Segurança e privacidade

- cookie de sessão HTTP-only, `SameSite=Lax` e `Secure` em produção;
- assinatura HMAC da sessão;
- `AUTH_SECRET` obrigatório em produção;
- senhas derivadas com `scrypt` e salt aleatório;
- autorização aplicada no servidor, não apenas na interface;
- respostas do endpoint variam por papel;
- `ownerId` de novos anúncios vem da sessão;
- nenhuma credencial real é versionada;
- `.env` permanece ignorado pelo Git.

## 10. Inovação dentro do escopo

A inovação está na combinação de:

- renderização inicial no servidor com hidratação de cache no cliente;
- contrato de resposta discriminado por papel;
- privacidade aplicada no próprio payload;
- mutação percebida como instantânea pelo visitante;
- sincronização automática para o proprietário;
- degradação segura quando a revalidação falha.

Isso transforma um formulário estático em um pequeno fluxo colaborativo e responsivo, sem exigir a substituição da arquitetura original.

## 11. Limites assumidos

- não há chat, notificação push ou WebSocket;
- imagens continuam sendo informadas por URL;
- não há recuperação de senha ou verificação de e-mail;
- o ambiente precisa de PostgreSQL e de duas variáveis obrigatórias em produção;
- as áreas fora do catálogo receberam somente mudanças suficientes para consistência e acessibilidade.
