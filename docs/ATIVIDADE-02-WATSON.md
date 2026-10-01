# Atividade 02 — ReUse com voz: assistente virtual com IBM Watson

- **Projeto:** ReUse
- **Tecnologia principal:** IBM watsonx Assistant — Actions, Web Chat e extensão OpenAPI
- **Repositório:** https://github.com/lucasbuzato/ReUse
- **Pull request da atividade:** https://github.com/lucasbuzato/ReUse/pull/3
- **Código da branch:** https://github.com/lucasbuzato/ReUse/tree/feat/watson-assistant-voice
- **Aplicação:** https://reuse-lucasbuzatos-projects.vercel.app
- **Branch da atividade:** `feat/watson-assistant-voice`
- **Commit validado em Production:** [`2523d50`](https://github.com/lucasbuzato/ReUse/commit/2523d5040ba4e88777c55351329890c575471ae3)
- **Ambiente IBM:** Live, publicado e validado em 01/10/2026

## Resumo executivo

A solução acrescenta ao ReUse um assistente virtual baseado em fluxos conversacionais estruturados. O desenho prioriza o conteúdo **short-tail**, frequente e determinístico: ações previsíveis para executar tarefas reais e orientar pessoas durante o uso da plataforma.

A integração usa:

- **Actions** para reconhecer frases e conduzir cada conversa;
- **contexto público e `user_payload` privado** para transportar o estado autenticado sem registrar o token;
- **Web Chat** incorporado ao layout React/Next.js;
- **extensão customizada OpenAPI 3.0** para chamar APIs reais do ReUse;
- **tokens assinados de curta duração** para impedir que o chat escolha arbitrariamente outro usuário;
- **confirmação explícita** antes de alterações em lote.

IA generativa e watsonx.ai não são dependências da entrega. Podem ser acrescentados depois como fallback long-tail, sem interferir nas funcionalidades avaliadas.

# Bloco 1 — Realização de tarefas na plataforma (50%)

## Tarefas automatizadas

### 1. Consultar meus anúncios

O Assistant consulta o resumo da conta conectada e recebe:

- total de anúncios;
- quantos estão disponíveis;
- quantos estão pausados;
- quantos estão reservados;
- quantos foram doados;
- lista resumida dos itens disponíveis e pausados.

- **Operação da extensão:** `getMyItemsSummary`
- **Endpoint:** `GET /api/assistant/actions/items/summary`

### 2. Pausar todos os meus anúncios disponíveis

Exemplo de frase: **“Quero pausar minhas ofertas ativas.”**

Fluxo:

1. confirma que a pessoa está autenticada;
2. consulta quantos anúncios estão disponíveis;
3. informa a quantidade encontrada;
4. pede confirmação;
5. após o aceite, altera somente itens `DISPONIVEL` da conta conectada para `PAUSADO`;
6. informa quantos anúncios foram alterados.

- **Operação da extensão:** `pauseMyAvailableItems`
- **Endpoint:** `POST /api/assistant/actions/items/pause`

A operação é idempotente: repetir o pedido quando não houver item disponível retorna sucesso com zero alterações.

### 3. Reativar todos os meus anúncios pausados

Exemplo de frase: **“Reative meus anúncios.”**

O fluxo pede confirmação e altera somente itens `PAUSADO` da conta conectada para `DISPONIVEL`.

- **Operação da extensão:** `reactivateMyPausedItems`
- **Endpoint:** `POST /api/assistant/actions/items/reactivate`

## Segurança das tarefas

O navegador nunca envia um `userId` confiável para a API de automação.

1. A sessão HTTP-only existente identifica a conta no servidor.
2. `POST /api/assistant/session` gera um token HMAC com identificador interno, audiência, escopos, emissão, expiração e identificador aleatório.
3. O servidor criptografa o token com a chave pública fornecida pela IBM e inclui o resultado no `user_payload` de um JWT RS256 de até 10 minutos, assinado com uma chave RSA privada que permanece somente na Vercel.
4. O Web Chat envia o JWT; a IBM valida a assinatura, descriptografa o `user_payload` e o mantém como contexto privado, fora dos logs da conversa.
5. Cada callout lê `reuse_action_token` diretamente do contexto privado e o fornece ao cabeçalho da extensão.
6. A extensão envia também uma API key estática, armazenada na IBM e na Vercel.
7. A API valida chave, assinatura, expiração e escopo em tempo constante.
8. Toda consulta e atualização do Prisma contém `ownerId` derivado do token.

Assim, alterar o texto da conversa, o contexto do navegador ou um ID no request não permite modificar anúncios de outra conta.

## Estado PAUSADO

O modelo já armazenava o status como texto, portanto não foi necessária migração. O novo estado foi incorporado às validações e à interface:

- `DISPONIVEL`: aparece no catálogo e aceita interesses;
- `PAUSADO`: fica temporariamente oculto e pode ser reativado;
- `RESERVADO`: negociação/entrega em andamento;
- `DOADO`: processo concluído.

# Bloco 2 — Orientação e ajuda ao usuário (50%)

Foram definidos fluxos determinísticos para dúvidas recorrentes:

## 1. Como anunciar um item

1. Entrar na conta.
2. Selecionar **Anunciar** ou **Novo anúncio**.
3. Informar título, descrição, conservação e categoria.
4. Adicionar opcionalmente a URL de uma imagem.
5. Selecionar **Publicar anúncio**.

## 2. Como encontrar itens

- abrir **Explorar**;
- buscar por nome, descrição ou cidade;
- filtrar por categoria;
- limpar filtros quando necessário;
- observar que o catálogo mostra somente itens disponíveis.

## 3. Como demonstrar interesse

- entrar na conta;
- abrir um item disponível;
- escrever uma mensagem de 10 a 500 caracteres;
- enviar um único interesse por item;
- não é permitido demonstrar interesse no próprio anúncio.

## 4. Como gerenciar anúncios

- abrir **Perfil**;
- localizar **Meus anúncios**;
- pausar, reativar, reservar, marcar como doado ou excluir;
- abrir o anúncio para acompanhar interessados e mensagens.

## 5. Entender os status

O Assistant explica a diferença entre disponível, pausado, reservado e doado e informa quando um item aparece no catálogo.

## 6. Entrada por voz em português

O botão de microfone do ReUse usa reconhecimento `pt-BR`, mantém a escuta até o segundo clique e acumula resultados parciais e finais antes do envio. A sessão possui limite de segurança de 60 segundos e tenta retomar a mesma faixa autorizada se o Chrome encerrar a escuta durante uma pausa. O teste real foi aprovado no Google Chrome; o Opera não é o navegador de referência porque pode expor a API e ainda falhar no serviço de reconhecimento.

## 7. Privacidade e segurança

O Assistant orienta a:

- nunca informar senha no chat;
- combinar entrega em local seguro;
- não compartilhar documentos ou dados bancários;
- entender que mudanças em lote exigem confirmação;
- saber que o assistente atua apenas sobre a conta conectada.

# Arquitetura

```text
Pessoa autenticada no ReUse
        │ cookie HTTP-only
        ▼
POST /api/assistant/session
        │ JWT RS256 de 10 min
        │ user_payload criptografado: token HMAC + estado autenticado
        ▼
IBM Web Chat ── identityToken ──► validação pela chave pública
        │
        ▼
watsonx Assistant Action
        │ expressão do callout lê o user_payload privado
        │ confirmação + chamada da extensão
        ▼
Extensão OpenAPI
        │ X-ReUse-Extension-Key
        │ X-ReUse-Action-Token
        ▼
Route Handler do ReUse
        │ valida chave, assinatura, expiração e escopo
        ▼
Prisma/PostgreSQL
        └── where: { ownerId: claims.sub, status: ... }
```

# Artefatos versionados

| Item | Caminho |
|---|---|
| Especificação importável da extensão | `watson/reuse-assistant-extension.openapi.json` |
| Catálogo completo das Actions | `watson/actions/action-catalog.json` |
| Guia de configuração IBM | `docs/IBM-WATSON-SETUP.md` |
| Loader React do Web Chat | `components/WatsonAssistantChat.tsx` |
| Token e escopos | `lib/assistant-action-token.ts` |
| JWT RS256 do Web Chat | `lib/assistant-web-chat-token.ts` |
| Autenticação das requests | `lib/assistant-request-auth.ts` |
| Regras de automação | `lib/assistant-item-actions.ts` |
| Adaptador seguro do Prisma | `lib/prisma-assistant-item-store.ts` |
| APIs do Assistant | `app/api/assistant/**` |
| Testes | `tests/*assistant*.test.ts` e `tests/watson-artifacts.test.ts` |

# Validação automatizada

A suíte cobre:

- token HMAC válido;
- JWT RS256 válido, payload privado e chave RSA mínima;
- assinatura adulterada;
- segredo incorreto;
- expiração;
- escopo insuficiente;
- API key incorreta;
- token ausente;
- resumo por status;
- transições `DISPONIVEL → PAUSADO` e `PAUSADO → DISPONIVEL`;
- presença obrigatória de `ownerId` nas consultas e atualizações do Prisma;
- OpenAPI 3.0 em JSON sem construções não suportadas pela IBM;
- cobertura dos dois eixos da atividade no catálogo de Actions.

Comandos:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Resultado local em 24/09/2026

- 16 testes descobertos, 15 aprovados, zero falhas e uma integração PostgreSQL pulada por ausência de banco local;
- lint e TypeScript concluídos com código `0`;
- build Webpack concluído com código `0` e as quatro rotas do Assistant reconhecidas;
- contratos HTTP confirmados: `401` sem autenticação/chave e `403` para escopo insuficiente;
- respostas privadas confirmadas com `Cache-Control: private, no-store`;
- loader sem IDs IBM confirmado como desabilitado, sem carregar script externo;
- zero erros de console e zero `pageerror` no smoke test Playwright;
- nenhum segredo real encontrado na varredura dos 34 arquivos do commit.

As validações locais e suas limitações estão detalhadas em `VALIDATION.md`.

## Resultado final da CI do PR #3

A [execução 36799320094](https://github.com/lucasbuzato/ReUse/actions/runs/36799320094), no commit [`2523d50`](https://github.com/lucasbuzato/ReUse/commit/2523d5040ba4e88777c55351329890c575471ae3), terminou com `success` no job [“Lint, tipos e build”](https://github.com/lucasbuzato/ReUse/actions/runs/36799320094/job/110169876904). O deployment da Vercel também concluiu com sucesso.

## Resultado final em Production Live — 01/10/2026

O E2E foi executado contra `https://reuse-lucasbuzatos-projects.vercel.app`, usando o Web Chat e a chave pública do ambiente IBM Live:

- orientação “Como cadastrar um novo item?” respondeu corretamente;
- sessão anônima e sessão autenticada emitiram JWT RS256 válido;
- uma conta descartável publicou um anúncio real;
- cancelamento manteve o anúncio como `DISPONIVEL`;
- confirmação positiva pausou exatamente um anúncio da proprietária;
- repetição da pausa retornou que não havia anúncios disponíveis;
- reativação devolveu o anúncio para `DISPONIVEL`;
- repetição da reativação retornou que não havia anúncios pausados;
- uma segunda conta não enxergou nem alterou o anúncio da primeira;
- o item descartável foi removido e o estado temporário do navegador foi sanitizado;
- entrada por voz real `pt-BR`, com parada no segundo clique, foi aceita no Google Chrome.

# Configuração e evidência na IBM

Concluído em 01/10/2026:

- extensão com três operações configurada;
- oito Actions disponíveis;
- quatro callouts usando o `user_payload` privado;
- segurança do Web Chat ativada;
- conteúdo publicado no ambiente Live;
- identificadores Live e chave pública IBM Live aplicados somente em Production;
- Production reimplantada e validada sem expor tokens, cookies ou chaves;
- repositório e configuração documentados neste arquivo e em `docs/IBM-WATSON-SETUP.md`.

# Critérios de pronto

- [x] APIs reais para consulta, pausa e reativação.
- [x] Autorização por proprietário, escopo e expiração.
- [x] Confirmação prevista nos fluxos de mutação.
- [x] Estado `PAUSADO` incorporado à interface.
- [x] OpenAPI 3.0 JSON importável.
- [x] Catálogo com automações e orientações.
- [x] Loader do Web Chat condicionado às variáveis públicas.
- [x] Testes automatizados de segurança e domínio.
- [x] Integração PostgreSQL real aprovada na CI, sem testes pulados.
- [x] Build padrão Turbopack aprovado na CI.
- [x] Branch e pull request próprios para a Atividade 02.
- [x] Extensão importada na conta IBM.
- [x] Actions montadas e aprovadas no Preview e no Live.
- [x] Identificadores Live do Web Chat configurados em Production na Vercel.
- [x] Evidências e relatório E2E consolidados sem segredos.
- [x] Versão Live publicada e validada em Production.

# Referências

- Repositório: https://github.com/lucasbuzato/ReUse
- Pull request: https://github.com/lucasbuzato/ReUse/pull/3
- Código da branch: https://github.com/lucasbuzato/ReUse/tree/feat/watson-assistant-voice
- Aplicação: https://reuse-lucasbuzatos-projects.vercel.app
- Extensões IBM: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-build-custom-extension
- Chamada de extensão: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-call-extension
- Contexto no Web Chat: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-web-chat-develop-set-context
- Incorporação do Web Chat: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-deploy-web-chat
