# Configuração do IBM watsonx Assistant — ReUse

Este guia descreve como ligar o assistente IBM ao projeto ReUse.

## Arquivos utilizados

- `watson/reuse-assistant-extension.openapi.json` — extensão customizada;
- `watson/actions/action-catalog.json` — frases e respostas das Actions;
- `components/WatsonAssistantChat.tsx` — Web Chat e entrada por voz;
- `app/api/assistant/session/route.ts` — sessão do assistente;
- `app/api/assistant/actions/items/*` — APIs de consulta, pausa e reativação.

## 1. Configurar as variáveis

Na Vercel, configure:

```env
ASSISTANT_ACTION_SECRET="..."
ASSISTANT_EXTENSION_API_KEY="..."
ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64="..."
ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64="..."
NEXT_PUBLIC_IBM_ASSISTANT_INTEGRATION_ID="..."
NEXT_PUBLIC_IBM_ASSISTANT_REGION="..."
NEXT_PUBLIC_IBM_ASSISTANT_SERVICE_INSTANCE_ID="..."
NEXT_PUBLIC_IBM_ASSISTANT_WEB_CHAT_VERSION="latest"
```

Os valores reais devem ficar somente na Vercel e na configuração privada da IBM. Eles não devem ser publicados no repositório.

## 2. Criar o Assistant

1. Entre no IBM Cloud e abra o watsonx Assistant.
2. Crie um Assistant para o ReUse.
3. Selecione Português (Brasil).
4. Faça a configuração inicial no ambiente Draft.

## 3. Importar a extensão

1. Abra **Integrations**.
2. Em **Extensions**, selecione **Build custom extension**.
3. Importe `watson/reuse-assistant-extension.openapi.json`.
4. Confirme as operações `getMyItemsSummary`, `pauseMyAvailableItems` e `reactivateMyPausedItems`.
5. Configure a autenticação por API key com o cabeçalho `X-ReUse-Extension-Key`.
6. Use o mesmo valor de `ASSISTANT_EXTENSION_API_KEY` configurado na Vercel.

## 4. Configurar o token privado

Em cada chamada da extensão, associe o cabeçalho `X-ReUse-Action-Token` à expressão:

```text
${system_integrations.chat.private.user_payload}.reuse_action_token
```

O proprietário não é informado manualmente. A API identifica a conta pelo token emitido a partir da sessão do ReUse.

## 5. Criar as Actions de automação

Use `watson/actions/action-catalog.json` para criar as Actions.

### Pausar anúncios disponíveis

1. Verifique se o usuário está autenticado.
2. Chame `getMyItemsSummary`.
3. Informe a quantidade de itens disponíveis.
4. Peça confirmação.
5. Após a confirmação, chame `pauseMyAvailableItems`.
6. Mostre a mensagem retornada pela API.

### Reativar anúncios pausados

Repita o fluxo usando a quantidade de itens pausados e a operação `reactivateMyPausedItems`.

## 6. Criar as Actions de orientação

Crie as Actions abaixo com as frases e respostas do catálogo:

1. Como anunciar um item;
2. Como encontrar itens;
3. Como demonstrar interesse;
4. Como gerenciar anúncios;
5. Entender os status dos anúncios;
6. Privacidade e segurança.

## 7. Configurar o Web Chat

1. Em **Integrations**, abra **Web chat**.
2. Copie `integrationID`, `region` e `serviceInstanceID` para as variáveis públicas da Vercel.
3. Na aba **Security**, ative a proteção do Web Chat.
4. Cadastre na IBM a chave pública correspondente à chave privada da Vercel.
5. Cadastre na Vercel a chave pública de criptografia fornecida pela IBM.
6. Faça um novo deployment da aplicação.

## 8. Publicar

1. Abra **Publish** no watsonx Assistant.
2. Crie uma versão do conteúdo.
3. Associe a versão ao ambiente Live.
4. Confirme que a Vercel utiliza os identificadores do Web Chat Live.
5. Acesse a aplicação e teste o assistente incorporado.
