# Configuração do IBM watsonx Assistant — ReUse com voz

Este guia fecha somente as etapas que dependem da conta IBM. Todo o código, a API, o loader do Web Chat, a especificação OpenAPI e o catálogo das Actions já ficam versionados no repositório.

## Artefatos prontos

| Artefato | Caminho | Uso |
|---|---|---|
| OpenAPI 3.0 JSON | `watson/reuse-assistant-extension.openapi.json` | importar como extensão customizada |
| Catálogo de Actions | `watson/actions/action-catalog.json` | copiar frases, condições, passos e respostas |
| Loader do Web Chat | `components/WatsonAssistantChat.tsx` | carregar o widget e enviar variáveis de sessão |
| Sessão segura | `app/api/assistant/session/route.ts` | emitir token curto para a conta logada |
| APIs de automação | `app/api/assistant/actions/items/*` | consultar, pausar e reativar anúncios |

## O que depende de Lucas

- login com IBMid e eventual 2FA;
- aceite de termos e escolha de plano/região;
- criação ou seleção da instância watsonx Assistant;
- criação das Actions na interface;
- geração e cadastro dos segredos na IBM e na Vercel;
- Preview, Publish e captura das evidências da conta.

Não envie chaves em mensagens, issues, commits, screenshots ou no PDF.

## 1. Preparar os segredos do ReUse

Gere dois valores diferentes, cada um com 64 caracteres hexadecimais:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Configure diretamente no projeto da Vercel:

| Variável | Onde também é usada | Regra |
|---|---|---|
| `ASSISTANT_ACTION_SECRET` | somente no servidor ReUse | não copiar para a IBM; assina tokens de 10 minutos |
| `ASSISTANT_EXTENSION_API_KEY` | autenticação da extensão IBM | cadastrar o mesmo valor no campo da API key da extensão |

Depois de cadastrar, faça um novo deployment. O código falha fechado se os segredos estiverem ausentes ou tiverem menos de 32 caracteres.

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

## 4. Criar as variáveis de sessão

O loader adiciona estas variáveis em `context.skills["actions skill"].skill_variables` antes de cada mensagem:

| Variável | Tipo | Finalidade |
|---|---|---|
| `reuse_authenticated` | boolean | saber se há conta ReUse conectada |
| `reuse_action_token` | string | autorizar somente ações da conta conectada |
| `reuse_token_expires_at` | string | diagnóstico da expiração |
| `reuse_user_name` | string | personalização sem enviar e-mail |

Ao configurar uma chamada de extensão, associe o parâmetro obrigatório `X-ReUse-Action-Token` à variável de sessão `reuse_action_token`.

Nunca crie uma variável `userId` para selecionar o proprietário. A API ignora identidade declarada pelo chat e obtém o proprietário exclusivamente do token assinado.

## 5. Criar as Actions de automação

Use `watson/actions/action-catalog.json` como fonte literal das frases e passos.

### Action: Pausar meus anúncios disponíveis

1. Cadastre as oito frases de exemplo do catálogo.
2. Se `reuse_authenticated != true`, oriente o login e encerre.
3. Em **And then → Use an extension**, chame `getMyItemsSummary`.
4. Associe `X-ReUse-Action-Token` a `reuse_action_token`.
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

## 7. Configurar o Web Chat

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
```

Esses três identificadores de integração são públicos no próprio script do navegador; não são segredos. As duas chaves de servidor continuam privadas.

Faça novo deployment. O widget é carregado uma única vez no layout e não aparece quando os três identificadores não estão configurados.

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
- Embed do Web Chat: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-deploy-web-chat
- Preview e Publish: https://cloud.ibm.com/docs/watson-assistant?topic=watson-assistant-publish-overview
