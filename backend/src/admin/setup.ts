import { createHmac } from "node:crypto";
import AdminJS, {
  NotFoundError,
  ValidationError,
  type ActionContext,
  type ActionRequest,
  type ActionResponse,
  type After,
  type Before,
  type CurrentAdmin,
  type ResourceWithOptions,
} from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { Database, Resource, getModelByName } from "@adminjs/prisma";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { config, resolvePublicBaseUrl } from "../config.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";
import { ITEM_CONDITIONS, ITEM_STATUS_LABELS, ITEM_STATUS_VALUES, type ItemStatus } from "../lib/item-status.js";
import { prisma } from "../lib/prisma.js";
import { Components, componentLoader } from "./components.js";
import { buildDashboardData } from "./dashboard.js";
import { adminTranslations } from "./locale.js";

AdminJS.registerAdapter({ Database, Resource });

type AdminUser = CurrentAdmin & { role?: "ADMIN" | "VIEWER" };
type AccessContext = { currentAdmin?: CurrentAdmin };

/** Somente ADMIN altera dados; VIEWER navega em modo leitura. */
const canEdit = ({ currentAdmin }: AccessContext) => (currentAdmin as AdminUser | undefined)?.role === "ADMIN";

const plataforma = { name: "Plataforma", icon: "Package" };
const pessoas = { name: "Pessoas", icon: "Users" };

function maskEmail(email: unknown) {
  if (typeof email !== "string" || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  return `${user.slice(0, 1)}•••@${domain}`;
}

/** Visitantes do painel (VIEWER) não veem e-mails completos. */
const maskEmailsForViewer: After<ActionResponse> = async (response, _request, context) => {
  if (canEdit(context)) return response;
  const records = (response.records ?? (response.record ? [response.record] : [])) as Array<{ params: Record<string, unknown> }>;
  for (const record of records) {
    if (record?.params?.email) record.params.email = maskEmail(record.params.email);
  }
  return response;
};

/** Converte o campo virtual "newPassword" em hash scrypt antes de salvar. */
function hashNewPassword(required: boolean): Before {
  return async (request: ActionRequest) => {
    if (request.method !== "post" || !request.payload) return request;
    const { newPassword, ...payload } = request.payload as Record<string, unknown>;

    if (typeof newPassword === "string" && newPassword.length > 0) {
      if (newPassword.length < 8) {
        throw new ValidationError({ newPassword: { message: "Use pelo menos 8 caracteres." } });
      }
      payload.password = hashPassword(newPassword);
    } else if (required) {
      throw new ValidationError({ newPassword: { message: "Informe uma senha para a nova conta." } });
    }

    return { ...request, payload };
  };
}

/** Ação de registro que muda o status do item com um clique (com confirmação). */
function statusAction(status: ItemStatus, icon: string, guard: string) {
  return {
    actionType: "record" as const,
    icon,
    guard,
    component: false as const,
    isAccessible: canEdit,
    isVisible: (context: ActionContext) => context.record?.params?.status !== status,
    handler: async (_request: ActionRequest, _response: unknown, context: ActionContext) => {
      const { record, resource, currentAdmin, h } = context;
      if (!record) throw new NotFoundError("Item não encontrado.", "statusAction");

      await record.update({ status });

      return {
        record: record.toJSON(currentAdmin),
        redirectUrl: h.resourceUrl({ resourceId: resource._decorated?.id() ?? resource.id() }),
        notice: { message: `Status alterado para "${ITEM_STATUS_LABELS[status]}".`, type: "success" as const },
      };
    },
  };
}

/** Imagens com caminho relativo (/seed/...) ficam no site; o painel monta a URL completa. */
const withImageSrc: After<ActionResponse> = async (response) => {
  const records = (response.records ?? (response.record ? [response.record] : [])) as Array<{ params: Record<string, unknown> }>;
  for (const record of records) {
    const url = record?.params?.imageUrl;
    if (typeof url === "string" && url.startsWith("/")) {
      record.params.imageSrc = `${config.frontendUrl.replace(/\/$/, "")}${url}`;
    }
  }
  return response;
};

const readOnlyCrud = {
  new: { isAccessible: canEdit },
  edit: { isAccessible: canEdit },
  delete: { isAccessible: canEdit },
  bulkDelete: { isAccessible: canEdit },
};

function buildResources(): ResourceWithOptions[] {
  return [
    {
      resource: { model: getModelByName("Item"), client: prisma },
      options: {
        navigation: plataforma,
        sort: { sortBy: "createdAt", direction: "desc" },
        listProperties: ["imageUrl", "title", "category", "status", "condition", "owner", "createdAt"],
        filterProperties: ["title", "status", "category", "condition", "owner", "createdAt"],
        showProperties: ["title", "description", "imageUrl", "status", "condition", "category", "owner", "createdAt", "id"],
        editProperties: ["title", "description", "condition", "imageUrl", "status", "category", "owner"],
        properties: {
          title: { isTitle: true },
          description: { type: "textarea", props: { rows: 5 } },
          imageUrl: { components: { list: Components.ImagePreview, show: Components.ImagePreview } },
          status: {
            availableValues: ITEM_STATUS_VALUES.map((value) => ({ value, label: ITEM_STATUS_LABELS[value] })),
            components: { list: Components.StatusBadge, show: Components.StatusBadge },
          },
          condition: { availableValues: ITEM_CONDITIONS.map((value) => ({ value, label: value })) },
        },
        actions: {
          ...readOnlyCrud,
          list: { after: withImageSrc },
          show: { after: withImageSrc },
          markDonated: statusAction("DOADO", "CheckCircle", "Confirmar que este item foi doado?"),
          pauseItem: statusAction("PAUSADO", "Pause", "Pausar este anúncio? Ele sai do catálogo público."),
          reactivateItem: statusAction("DISPONIVEL", "Play", "Reativar este anúncio no catálogo público?"),
        },
      },
    },
    {
      resource: { model: getModelByName("Category"), client: prisma },
      options: {
        navigation: plataforma,
        sort: { sortBy: "name", direction: "asc" },
        listProperties: ["name"],
        showProperties: ["name", "id"],
        editProperties: ["name"],
        actions: readOnlyCrud,
      },
    },
    {
      resource: { model: getModelByName("Interest"), client: prisma },
      options: {
        navigation: plataforma,
        sort: { sortBy: "createdAt", direction: "desc" },
        listProperties: ["item", "user", "message", "createdAt"],
        filterProperties: ["item", "user", "createdAt"],
        showProperties: ["item", "user", "message", "createdAt", "id"],
        properties: { message: { type: "textarea", isTitle: true } },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
          delete: { isAccessible: canEdit },
          bulkDelete: { isAccessible: canEdit },
        },
      },
    },
    {
      resource: { model: getModelByName("User"), client: prisma },
      options: {
        navigation: pessoas,
        sort: { sortBy: "createdAt", direction: "desc" },
        listProperties: ["name", "email", "city", "role", "utmSource", "createdAt"],
        filterProperties: ["name", "email", "city", "role", "utmSource", "utmMedium", "utmCampaign", "createdAt"],
        showProperties: ["name", "email", "city", "role", "utmSource", "utmMedium", "utmCampaign", "createdAt", "id"],
        editProperties: ["name", "email", "city", "role", "newPassword"],
        properties: {
          name: { isTitle: true },
          password: { isVisible: false },
          newPassword: {
            type: "password",
            isVisible: { list: false, filter: false, show: false, edit: true },
            description: "Deixe em branco para manter a senha atual (mínimo de 8 caracteres).",
          },
        },
        actions: {
          new: { isAccessible: canEdit, before: hashNewPassword(true) },
          edit: { isAccessible: canEdit, before: hashNewPassword(false) },
          delete: { isAccessible: canEdit },
          bulkDelete: { isAccessible: canEdit },
          list: { after: maskEmailsForViewer },
          show: { after: maskEmailsForViewer },
        },
      },
    },
  ];
}

function cookieSecret() {
  const base = process.env.ADMIN_COOKIE_SECRET ?? process.env.AUTH_SECRET;
  if (!base) {
    if (config.isProduction) throw new Error("AUTH_SECRET (ou ADMIN_COOKIE_SECRET) é obrigatório em produção.");
    return "reuse-admin-local-development-only";
  }
  return createHmac("sha256", base).update("reuse-adminjs-session").digest("hex");
}

async function authenticate(email: string, password: string): Promise<AdminUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || (user.role !== "ADMIN" && user.role !== "VIEWER")) return null;
  if (!verifyPassword(password, user.password)) return null;
  return { id: user.id, email: user.email, title: user.name, role: user.role };
}

export async function buildAdminRouter() {
  if (config.isProduction) {
    // Bundle do painel gerado no build (npm run admin:bundle) e servido como arquivo estático.
    process.env.ADMIN_JS_SKIP_BUNDLE = "true";
  }

  const assetsCDN =
    process.env.ADMIN_ASSETS_URL ?? (config.isProduction ? `${resolvePublicBaseUrl()}/admin-assets/` : undefined);

  const admin = new AdminJS({
    rootPath: "/admin",
    loginPath: "/admin/login",
    logoutPath: "/admin/logout",
    componentLoader,
    assetsCDN,
    resources: buildResources(),
    dashboard: {
      component: Components.Dashboard,
      handler: async () => ({
        ...(await buildDashboardData()),
        links: { frontend: config.frontendUrl, docs: "/api/docs", health: "/health" },
      }),
    },
    branding: {
      companyName: "ReUse! · Painel",
      logo: "/brand/admin-logo.svg",
      favicon: "/brand/favicon.svg",
      withMadeWithLove: false,
      theme: {
        colors: {
          primary100: "#1d5c45",
          primary80: "#2b6e55",
          primary60: "#4a8a72",
          primary40: "#8db8a6",
          primary20: "#dcebe4",
          accent: "#c9d94f",
          love: "#1d5c45",
          filterBg: "#13201a",
          hoverBg: "#2b6e55",
        },
      },
    },
    locale: {
      language: "pt-BR",
      availableLanguages: ["pt-BR"],
      localeDetection: false,
      translations: { "pt-BR": adminTranslations },
    },
  });

  if (!config.isProduction) {
    await admin.watch();
  }

  const PgStore = connectPgSimple(session);
  const store = new PgStore({
    pool: new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 }),
    tableName: "admin_sessions",
    createTableIfMissing: false,
    pruneSessionInterval: false,
  });

  const secret = cookieSecret();

  return AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: "reuse_admin",
      cookiePassword: secret,
      maxRetries: { count: 8, duration: 60 },
    },
    null,
    {
      store,
      secret,
      name: "reuse_admin",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.isProduction,
        maxAge: 8 * 60 * 60 * 1000,
      },
    }
  );
}
