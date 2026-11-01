import { config } from "../config.js";

const json = (schema: Record<string, unknown>) => ({ "application/json": { schema } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const errorResponse = (description: string) => ({ description, content: json(ref("Error")) });
const idParam = { name: "id", in: "path", required: true, schema: { type: "string" }, description: "ID do item (cuid)" };

/** Documento OpenAPI 3.1 da API do ReUse! (renderizado em /api/docs). */
export function buildOpenApiDocument(serverUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "ReUse! API",
      version: config.version,
      description:
        "API REST da plataforma colaborativa ReUse! (troca e doação de itens). Node.js + Express + Prisma + PostgreSQL.\n\n" +
        "A autenticação usa o cookie httpOnly `reuse_session`, criado no cadastro ou no login. " +
        "O frontend Next.js consome esta API pelo mesmo domínio (proxy `/api/*`).",
    },
    servers: [{ url: serverUrl, description: "Servidor atual" }],
    tags: [
      { name: "Itens", description: "Catálogo, anúncios e status" },
      { name: "Interesses", description: "Manifestações de interesse em itens" },
      { name: "Usuários", description: "Cadastro, login e sessão" },
      { name: "Catálogo", description: "Categorias e números de impacto" },
      { name: "Assistente", description: "Integração IBM watsonx Assistant (Web Chat e extensão)" },
      { name: "Sistema", description: "Saúde do serviço" },
    ],
    components: {
      securitySchemes: {
        sessionCookie: { type: "apiKey", in: "cookie", name: "reuse_session" },
        extensionKey: { type: "apiKey", in: "header", name: "X-ReUse-Extension-Key" },
        actionToken: { type: "apiKey", in: "header", name: "X-ReUse-Action-Token" },
      },
      schemas: {
        Error: { type: "object", properties: { error: { type: "string" }, code: { type: "string" } }, required: ["error"] },
        Category: {
          type: "object",
          properties: { id: { type: "string" }, name: { type: "string" }, availableItems: { type: "integer" } },
        },
        Item: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            condition: { type: "string", enum: ["Novo", "Seminovo", "Usado"] },
            imageUrl: { type: ["string", "null"] },
            status: { type: "string", enum: ["DISPONIVEL", "PAUSADO", "RESERVADO", "DOADO"] },
            createdAt: { type: "string", format: "date-time" },
            category: ref("Category"),
            owner: { type: "object", properties: { name: { type: "string" }, city: { type: ["string", "null"] } } },
            _count: { type: "object", properties: { interests: { type: "integer" } } },
          },
        },
        NewItem: {
          type: "object",
          required: ["title", "description", "condition", "categoryId"],
          properties: {
            title: { type: "string", minLength: 3, maxLength: 120, example: "Bicicleta aro 26" },
            description: { type: "string", minLength: 10, maxLength: 2000, example: "Revisada, com pneus novos." },
            condition: { type: "string", enum: ["Novo", "Seminovo", "Usado"] },
            imageUrl: { type: "string", format: "uri" },
            categoryId: { type: "string" },
          },
        },
        InterestPanel: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["owner", "visitor", "anonymous"] },
            total: { type: "integer" },
            interests: { type: "array", items: { type: "object" } },
            ownInterest: { type: ["object", "null"] },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            city: { type: ["string", "null"] },
            role: { type: "string", enum: ["USER", "ADMIN", "VIEWER"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Stats: {
          type: "object",
          properties: {
            items: {
              type: "object",
              properties: {
                total: { type: "integer" },
                available: { type: "integer" },
                reserved: { type: "integer" },
                donated: { type: "integer" },
                paused: { type: "integer" },
              },
            },
            users: { type: "integer" },
            interests: { type: "integer" },
            categories: { type: "integer" },
            cities: { type: "integer" },
          },
        },
      },
    },
    paths: {
      "/api/items": {
        get: {
          tags: ["Itens"],
          summary: "Lista itens (padrão: disponíveis)",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" }, description: "Busca em título, descrição e cidade" },
            { name: "category", in: "query", schema: { type: "string" }, description: "Nome da categoria" },
            { name: "categoryId", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string", enum: ["DISPONIVEL", "PAUSADO", "RESERVADO", "DOADO"] } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 60 } },
          ],
          responses: { 200: { description: "Lista de itens", content: json({ type: "array", items: ref("Item") }) } },
        },
        post: {
          tags: ["Itens"],
          summary: "Publica um item (usuário autenticado)",
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: json(ref("NewItem")) },
          responses: {
            201: { description: "Item criado", content: json(ref("Item")) },
            400: errorResponse("Dados inválidos"),
            401: errorResponse("Não autenticado"),
          },
        },
      },
      "/api/items/{id}": {
        get: {
          tags: ["Itens"],
          summary: "Detalhe de um item",
          parameters: [idParam],
          responses: { 200: { description: "Item", content: json(ref("Item")) }, 404: errorResponse("Não encontrado") },
        },
        patch: {
          tags: ["Itens"],
          summary: "Atualiza status ou dados de um item próprio",
          security: [{ sessionCookie: [] }],
          parameters: [idParam],
          requestBody: {
            required: true,
            content: json({
              type: "object",
              properties: { status: { type: "string", enum: ["DISPONIVEL", "PAUSADO", "RESERVADO", "DOADO"] } },
            }),
          },
          responses: {
            200: { description: "Item atualizado", content: json(ref("Item")) },
            403: errorResponse("O item pertence a outra pessoa"),
          },
        },
        delete: {
          tags: ["Itens"],
          summary: "Remove um item próprio",
          security: [{ sessionCookie: [] }],
          parameters: [idParam],
          responses: { 200: { description: "Removido" }, 403: errorResponse("Acesso negado") },
        },
      },
      "/api/items/{id}/interests": {
        get: {
          tags: ["Interesses"],
          summary: "Painel de interesses (dono vê a lista; visitante vê o próprio interesse)",
          parameters: [idParam],
          responses: { 200: { description: "Painel", content: json(ref("InterestPanel")) } },
        },
        post: {
          tags: ["Interesses"],
          summary: "Manifesta interesse em um item",
          security: [{ sessionCookie: [] }],
          parameters: [idParam],
          requestBody: {
            required: true,
            content: json({
              type: "object",
              required: ["message"],
              properties: { message: { type: "string", minLength: 10, maxLength: 500 } },
            }),
          },
          responses: {
            201: { description: "Interesse registrado", content: json(ref("InterestPanel")) },
            409: errorResponse("Interesse duplicado ou item indisponível"),
          },
        },
      },
      "/api/categories": {
        get: {
          tags: ["Catálogo"],
          summary: "Lista categorias com a quantidade de itens disponíveis",
          responses: { 200: { description: "Categorias", content: json({ type: "array", items: ref("Category") }) } },
        },
      },
      "/api/stats": {
        get: {
          tags: ["Catálogo"],
          summary: "Números de impacto da comunidade",
          responses: { 200: { description: "Estatísticas", content: json(ref("Stats")) } },
        },
      },
      "/api/users": {
        post: {
          tags: ["Usuários"],
          summary: "Cria conta e inicia sessão (aceita parâmetros UTM da campanha)",
          requestBody: {
            required: true,
            content: json({
              type: "object",
              required: ["name", "email", "password"],
              properties: {
                name: { type: "string" },
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 6 },
                city: { type: "string" },
                utm: {
                  type: "object",
                  properties: { utmSource: { type: "string" }, utmMedium: { type: "string" }, utmCampaign: { type: "string" } },
                },
              },
            }),
          },
          responses: { 201: { description: "Conta criada" }, 409: errorResponse("E-mail já cadastrado") },
        },
      },
      "/api/users/login": {
        post: {
          tags: ["Usuários"],
          summary: "Login (define o cookie de sessão)",
          requestBody: {
            required: true,
            content: json({
              type: "object",
              required: ["email", "password"],
              properties: { email: { type: "string" }, password: { type: "string" } },
            }),
          },
          responses: { 200: { description: "Sessão iniciada" }, 401: errorResponse("Credenciais inválidas") },
        },
      },
      "/api/users/logout": {
        post: { tags: ["Usuários"], summary: "Encerra a sessão", responses: { 200: { description: "Sessão encerrada" } } },
      },
      "/api/users/me": {
        get: {
          tags: ["Usuários"],
          summary: "Usuário da sessão atual (ou null)",
          responses: {
            200: {
              description: "Usuário",
              content: json({ type: "object", properties: { user: { oneOf: [ref("User"), { type: "null" }] } } }),
            },
          },
        },
      },
      "/api/users/me/items": {
        get: {
          tags: ["Usuários"],
          summary: "Itens publicados pelo usuário autenticado",
          security: [{ sessionCookie: [] }],
          responses: { 200: { description: "Itens", content: json({ type: "array", items: ref("Item") }) } },
        },
      },
      "/api/users/me/interests": {
        get: {
          tags: ["Usuários"],
          summary: "Interesses enviados pelo usuário autenticado",
          security: [{ sessionCookie: [] }],
          responses: { 200: { description: "Interesses" } },
        },
      },
      "/api/assistant/session": {
        post: {
          tags: ["Assistente"],
          summary: "Gera o JWT de identidade do IBM Web Chat",
          responses: { 200: { description: "Token de identidade" }, 503: errorResponse("Assistente não configurado") },
        },
      },
      "/api/assistant/actions/items/summary": {
        get: {
          tags: ["Assistente"],
          summary: "Resumo dos anúncios do usuário (extensão IBM)",
          security: [{ extensionKey: [], actionToken: [] }],
          responses: { 200: { description: "Resumo" }, 401: errorResponse("Token inválido ou expirado") },
        },
      },
      "/api/assistant/actions/items/pause": {
        post: {
          tags: ["Assistente"],
          summary: "Pausa os anúncios disponíveis do usuário (extensão IBM)",
          security: [{ extensionKey: [], actionToken: [] }],
          responses: { 200: { description: "Resultado" } },
        },
      },
      "/api/assistant/actions/items/reactivate": {
        post: {
          tags: ["Assistente"],
          summary: "Reativa os anúncios pausados do usuário (extensão IBM)",
          security: [{ extensionKey: [], actionToken: [] }],
          responses: { 200: { description: "Resultado" } },
        },
      },
      "/health": {
        get: {
          tags: ["Sistema"],
          summary: "Saúde da API e do banco",
          responses: { 200: { description: "OK" }, 503: { description: "Banco indisponível" } },
        },
      },
    },
  };
}
