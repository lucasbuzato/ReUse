# Atividade 02 — ReUse com voz: assistente virtual com IBM Watson

- **Projeto:** ReUse
- **Tecnologia principal:** IBM watsonx Assistant — Actions, Web Chat e extensão OpenAPI
- **Repositório:** https://github.com/lucasbuzato/ReUse
- **Aplicação:** https://reuse-lucasbuzatos-projects.vercel.app
- **Branch da atividade:** `feat/watson-assistant-voice`

## Resumo executivo

A solução acrescenta ao ReUse um assistente virtual baseado em fluxos conversacionais estruturados. O desenho prioriza o conteúdo **short-tail**, frequente e determinístico: ações previsíveis para executar tarefas reais e orientar pessoas durante o uso da plataforma.

A integração usa:

- **Actions** para reconhecer frases e conduzir cada conversa;
- **variáveis de sessão** para transportar o estado autenticado;
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
2. `POST /api/assistant/session` gera um token HMAC com:
   - identificador interno do usuário (`sub`);
   - audiência exclusiva do Assistant;
   - escopos permitidos;
   - emissão e expiração;
   - identificador aleatório da emissão.
3. O token vale no máximo 10 minutos.
4. A extensão envia também uma API key estática, armazenada na IBM e na Vercel.
5. A API valida as duas credenciais em tempo constante.
6. Toda consulta e atualização do Prisma contém `ownerId` derivado do token.

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

## 6. Privacidade e segurança

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
        │ token HMAC de 10 min + ID pseudônimo
        ▼
IBM Web Chat ── pre:send ──► variáveis da Actions skill
        │
        ▼
watsonx Assistant Action
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
| Autenticação das requests | `lib/assistant-request-auth.ts` |
| Regras de automação | `lib/assistant-item-actions.ts` |
| Adaptador seguro do Prisma | `lib/prisma-assistant-item-store.ts` |
| APIs do Assistant | `app/api/assistant/**` |
| Testes | `tests/*assistant*.test.ts` e `tests/watson-artifacts.test.ts` |

# Validação automatizada

A suíte cobre:

- token válido;
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

# Configuração e evidência na IBM

As etapas que exigem conta pessoal estão detalhadas em `docs/IBM-WATSON-SETUP.md`:

- criar/abrir o Assistant;
- importar a extensão;
- cadastrar a API key;
- montar as Actions com o catálogo;
- testar no Preview e no Inspector;
- publicar uma versão;
- copiar os três identificadores públicos do Web Chat para a Vercel.

## Evidências a anexar após o acesso IBM

- extensão com três operações importadas;
- Preview da orientação “Como cadastrar um novo item?”;
- confirmação e resultado da pausa;
- Inspector com HTTP 200 e resposta da API, sem exibir tokens;
- Web Chat incorporado na aplicação;
- versão publicada e, se disponível, link compartilhável.

# Critérios de pronto

- [x] APIs reais para consulta, pausa e reativação.
- [x] Autorização por proprietário, escopo e expiração.
- [x] Confirmação prevista nos fluxos de mutação.
- [x] Estado `PAUSADO` incorporado à interface.
- [x] OpenAPI 3.0 JSON importável.
- [x] Catálogo com automações e orientações.
- [x] Loader do Web Chat condicionado às variáveis públicas.
- [x] Testes automatizados de segurança e domínio.
- [ ] Extensão importada na conta IBM.
- [ ] Actions montadas e aprovadas no Preview.
- [ ] Identificadores do Web Chat configurados na Vercel.
- [ ] Evidências IBM anexadas.
- [ ] Versão Live publicada.

# Referências

- Repositório: https://github.com/lucasbuzato/ReUse
- Aplicação: https://reuse-lucasbuzatos-projects.vercel.app
- Extensões IBM: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-build-custom-extension
- Chamada de extensão: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-call-extension
- Contexto no Web Chat: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-web-chat-develop-set-context
- Incorporação do Web Chat: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-deploy-web-chat
