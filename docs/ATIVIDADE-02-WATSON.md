# Atividade 02 — ReUse com IBM watsonx Assistant

- **Projeto:** ReUse
- **Repositório:** https://github.com/lucasbuzato/ReUse
- **Aplicação:** https://reuse-lucasbuzatos-projects.vercel.app
- **Pull request:** https://github.com/lucasbuzato/ReUse/pull/3

## Visão geral

O ReUse possui um chatbot com IBM watsonx Assistant. Ele executa tarefas na conta conectada, responde dúvidas sobre a plataforma e aceita entrada por texto ou voz em português.

## Tarefas automatizadas

### Consultar meus anúncios

O assistente consulta os anúncios da conta conectada e informa quantos itens estão disponíveis, pausados, reservados e doados.

- Operação: `getMyItemsSummary`
- Endpoint: `GET /api/assistant/actions/items/summary`

### Pausar anúncios disponíveis

O assistente consulta os itens disponíveis, informa a quantidade e pede confirmação. Depois do aceite, altera somente os anúncios da conta conectada para o estado `PAUSADO`.

- Operação: `pauseMyAvailableItems`
- Endpoint: `POST /api/assistant/actions/items/pause`

### Reativar anúncios pausados

O assistente pede confirmação e altera somente os anúncios pausados da conta conectada para o estado `DISPONIVEL`.

- Operação: `reactivateMyPausedItems`
- Endpoint: `POST /api/assistant/actions/items/reactivate`

## Segurança das ações

A conta é identificada pela sessão do ReUse. O servidor emite um token curto para o Web Chat, e a IBM o mantém em contexto privado. As APIs conferem a chave da extensão, a assinatura, a validade e a permissão do token. Toda consulta ou alteração usa o proprietário obtido desse token.

## Orientações disponíveis

O chatbot possui respostas para:

1. como anunciar um item;
2. como encontrar itens;
3. como demonstrar interesse;
4. como gerenciar anúncios;
5. como entender os status disponível, pausado, reservado e doado;
6. cuidados de privacidade e segurança.

## Entrada por voz

O botão de microfone usa reconhecimento em português do Brasil. O primeiro clique inicia a escuta. O segundo encerra a captura e envia a mensagem ao chatbot. A sessão de voz possui limite de 60 segundos.

## Desenvolvimento e configuração

Os principais arquivos da integração são:

- `components/WatsonAssistantChat.tsx` — carregamento do Web Chat e entrada por voz;
- `app/api/assistant/session/route.ts` — criação da sessão do assistente;
- `app/api/assistant/actions/items/*` — consulta, pausa e reativação;
- `lib/assistant-action-token.ts` — token das ações;
- `watson/reuse-assistant-extension.openapi.json` — extensão OpenAPI;
- `watson/actions/action-catalog.json` — conteúdo das Actions;
- `docs/IBM-WATSON-SETUP.md` — configuração do IBM watsonx Assistant.
