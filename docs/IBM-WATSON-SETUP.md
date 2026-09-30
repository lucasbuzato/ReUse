# Configuração do IBM watsonx Assistant — ReUse com voz

Este guia fecha somente as etapas que dependem da conta IBM. Todo o código, a API, o loader do Web Chat, a especificação OpenAPI e o catálogo das Actions já ficam versionados no repositório.

## Artefatos prontos

| Artefato | Caminho | Uso |
|---|---|---|
| OpenAPI 3.0 JSON | `watson/reuse-assistant-extension.openapi.json` | importar como extensão customizada |
| Catálogo de Actions | `watson/actions/action-catalog.json` | copiar frases, condições, passos e respostas |
| Loader do Web Chat | `components/WatsonAssistantChat.tsx` | carregar o widget, fornecer JWT RS256 e renovar a identidade |
| Sessão segura | `app/api/assistant/session/route.ts` | emitir JWT do Web Chat com token curto no `user_payload` privado |
| Assinatura do Web Chat | `lib/assistant-web-chat-token.ts` | assinar e validar a configuração RSA sem expor a chave privada |
| APIs de automação | `app/api/assistant/actions/items/*` | consultar, pausar e reativar anúncios |

## O que depende de Lucas

- login com IBMid e eventual 2FA;
- aceite de termos e escolha de plano/região;
- criação ou seleção da instância watsonx Assistant;
- criação das Actions na interface;
- login e MFA na IBM para cadastrar a chave pública e publicar o Assistant;
- Preview, Publish e captura das evidências da conta.

Não envie chaves em mensagens, issues, commits, screenshots ou no PDF.

## 1. Preparar os segredos do ReUse

A integração usa dois segredos simétricos e um par RSA independente:

| Variável | Onde também é usada | Regra |
|---|---|---|
| `ASSISTANT_ACTION_SECRET` | somente no servidor ReUse | assina tokens HMAC de 10 minutos; nunca copiar para a IBM |
| `ASSISTANT_EXTENSION_API_KEY` | autenticação da extensão IBM | cadastrar o mesmo valor no campo da API key da extensão |
| `ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64` | somente no servidor ReUse | chave RSA privada em base64; somente o PEM **público** correspondente vai para a IBM |
| `ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64` | somente no servidor ReUse | chave pública gerada pela IBM; criptografa o `user_payload` antes da assinatura |

O par RSA de assinatura deve ter no mínimo 2048 bits; a implementação usa 4096 bits. A chave privada não deve ser enviada ao navegador, à IBM, ao GitHub, a mensagens ou a capturas. A IBM fornece um segundo PEM **público**, usado somente para criptografar o `user_payload` com RSA-OAEP antes de assinar o JWT. Depois de cadastrar as duas chaves na Vercel, faça um novo deployment antes de finalizar a ativação da segurança do Web Chat. O código falha fechado se a configuração estiver ausente ou inválida.

## 2. Criar ou abrir o Assistant

1. Entre no IBM Cloud com sua conta.
2. Abra a instância **watsonx Assistant**.
3. Crie ou selecione um assistant chamado **ReUse com voz**.
4. Defina o idioma como **Português (Brasil)** quando essa opção estiver disponível.
5. Trabalhe primeiro no ambiente **Draft**.

A baseline da atividade usa **Actions estruturadas**, sem depender de watsonx.ai, modelo generativo ou Runtime. Isso reduz custo e atende diretamente aos dois blocos da rubrica.

## 3. Importar a extensão customizada

1. Abra **Integrations**.
2. Na seção **Extensions**, selecione **Build custom extension**.
3. Importe `watson/reuse-assistant-extension.openapi.json`.
4. Confirme as três operações detectadas:
   - `getMyItemsSummary`;
   - `pauseMyAvailableItems`;
   - `reactivateMyPausedItems`.
5. Em autenticação, selecione/configure **API key**.
6. Use o cabeçalho definido pelo OpenAPI: `X-ReUse-Extension-Key`.
7. Cole como valor a chave cadastrada na Vercel em `ASSISTANT_EXTENSION_API_KEY`.
8. Salve a extensão no ambiente Draft.

O arquivo já atende às restrições atuais documentadas pela IBM: OpenAPI 3.0, JSON, servidor absoluto, `application/json`, sem `oneOf`, `anyOf` ou `allOf`.

## 4. Configurar estado público e entrada privada

O loader envia somente estado não sensível pelo contexto público:

| Variável | Tipo | Origem | Finalidade |
|---|---|---|---|
| `reuse_authenticated` | boolean | Web Chat `pre:send` | saber se há conta ReUse conectada |
| `reuse_token_expires_at` | string | Web Chat `pre:send` | diagnóstico da expiração |
| `reuse_user_name` | string | Web Chat `pre:send` | personalização sem enviar e-mail |

O token de ação **não** é copiado para variável de sessão. O servidor o criptografa com a chave pública fornecida pela IBM, inclui o resultado no JWT assinado e a IBM o disponibiliza no `user_payload` privado, que não volta ao navegador nem aparece nos logs da conversa.

Em **cada** chamada da extensão, configure o parâmetro `X-ReUse-Action-Token` com **Use expression** e informe exatamente:

```text
${system_integrations.chat.private.user_payload}.reuse_action_token
```

São quatro associações: consulta e mutação na Action de pausa; consulta e mutação na Action de reativação. A variável antiga **Token curto da ação ReUse** pode permanecer protegida e vazia, mas não deve mais ser usada pelos callouts. Ler o contexto privado diretamente garante que a renovação automática do JWT também renove o token usado pela extensão.

Nunca crie uma variável `userId` para selecionar o proprietário. A API obtém o proprietário exclusivamente do token HMAC assinado e validado.

## 5. Criar as Actions de automação

Use `watson/actions/action-catalog.json` como fonte literal das frases e passos.

### Action: Pausar meus anúncios disponíveis

1. Cadastre as oito frases de exemplo do catálogo.
2. Se `reuse_authenticated != true`, oriente o login e encerre.
3. Em **And then → Use an extension**, chame `getMyItemsSummary`.
4. Em **Use expression**, associe `X-ReUse-Action-Token` a `${system_integrations.chat.private.user_payload}.reuse_action_token`.
5. Se `body.counts.available == 0`, informe que não há anúncios elegíveis.
6. Peça confirmação: pausar todos os anúncios disponíveis.
7. Somente após resposta afirmativa, chame `pauseMyAvailableItems` com o mesmo token.
8. Mostre `body.message` da resposta.

### Action: Reativar meus anúncios pausados

Repita o fluxo anterior usando `body.counts.paused` e a operação `reactivateMyPausedItems`.

### Critérios das automações

- confirmação antes de mudança em lote;
- `affectedCount = 0` é sucesso idempotente, não erro;
- HTTP 401: pedir novo login/reabertura do chat;
- HTTP 403: informar que a sessão não possui permissão;
- HTTP 503: integração ainda não configurada;
- nunca tentar solicitar senha no chat.

## 6. Criar as Actions de orientação

Crie as seis Actions determinísticas do catálogo:

1. **Como anunciar um item**;
2. **Como encontrar itens**;
3. **Como demonstrar interesse**;
4. **Como gerenciar anúncios**;
5. **Entender os status dos anúncios**;
6. **Privacidade e segurança**.

Copie as frases de exemplo e as respostas do arquivo JSON. As respostas refletem as rotas e validações reais do ReUse, não procedimentos inventados.

## 7. Configurar e proteger o Web Chat

1. Em **Integrations**, abra **Web chat**.
2. Selecione o ambiente Draft e confirme.
3. Abra a aba **Embed**.
4. Copie do snippet gerado:
   - `integrationID`;
   - `region`;
   - `serviceInstanceID`.
5. Cadastre na Vercel:

```env
NEXT_PUBLIC_IBM_ASSISTANT_INTEGRATION_ID="..."
NEXT_PUBLIC_IBM_ASSISTANT_REGION="..."
NEXT_PUBLIC_IBM_ASSISTANT_SERVICE_INSTANCE_ID="..."
NEXT_PUBLIC_IBM_ASSISTANT_WEB_CHAT_VERSION="latest"
ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64="..."
ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64="..."
```

6. Na aba **Security**, prepare **Secure your web chat** e cole em **Your public key** o PEM público correspondente à chave privada da Vercel.
7. Use **Generate key** para criar a chave pública de criptografia fornecida pela IBM e cadastre-a, em base64, como `ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64` na Vercel.
8. Faça o deployment do código que envia `identityToken`, criptografa o `user_payload` e renova o JWT no evento `identityTokenExpired`.
9. Volte à IBM, finalize/salve a ativação de **Secure your web chat** e valide pelo ReUse incorporado.

Os três identificadores da integração são públicos no próprio script do navegador. A chave RSA privada, `ASSISTANT_ACTION_SECRET` e `ASSISTANT_EXTENSION_API_KEY` continuam restritas ao servidor/integração; as duas chaves públicas podem ser copiadas entre IBM e Vercel. Com a segurança ativada, mensagens sem JWT assinado são rejeitadas e o link compartilhável simples pode deixar de funcionar; valide pelo Web Chat incorporado no ReUse.

## 8. Preview e evidências obrigatórias

No Preview da página de Actions, execute e registre:

| Cenário | Resultado esperado |
|---|---|
| “Como cadastrar um novo item?” | passo a passo de cinco etapas |
| “Quero pausar minhas ofertas ativas” sem login | orientação para entrar na conta |
| mesma frase com login e confirmação negativa | nenhum item alterado |
| mesma frase com login e confirmação positiva | somente itens do proprietário mudam para `PAUSADO` |
| repetir a pausa | `affectedCount = 0`, sem erro |
| “Reative meus anúncios” | itens `PAUSADO` voltam a `DISPONIVEL` |
| token adulterado/expirado | HTTP 401 no Inspector |

Para chamadas de extensão, use **Inspect** no Preview da página de Actions e capture status, parâmetros e propriedades de resposta. Oculte tokens e chaves nas imagens.

## 9. Publicar

1. Corrija qualquer falha encontrada no Preview.
2. Abra **Publish** e crie uma versão do conteúdo Draft.
3. Associe a versão ao ambiente Live.
4. Abra o Web Chat do ambiente Live e confirme os identificadores usados pela Vercel.
5. Gere o link compartilhável, se o plano/interface disponibilizar essa opção.
6. Registre data, versão e evidências em `docs/ATIVIDADE-02-WATSON.md`.

## Referências oficiais verificadas

- Extensões customizadas e restrições OpenAPI: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-build-custom-extension
- Chamar extensões e usar o Inspector: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-call-extension
- Variáveis de contexto no Web Chat: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-web-chat-develop-set-context
- Segurança e JWT do Web Chat: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-web-chat-security-enable
- `user_payload` privado: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-web-chat-develop-security
- Embed do Web Chat: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-deploy-web-chat
- Preview e Publish: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-publish-overview
