import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config, isAllowedOrigin } from "./config.js";
import { adminMiddleware } from "./admin/lazy.js";
import { errorHandler, HttpError, notFoundHandler } from "./lib/http.js";
import { assistantRouter } from "./routes/assistant.js";
import { categoriesRouter, statsRouter } from "./routes/catalog.js";
import { healthRouter } from "./routes/health.js";
import { homeHandler } from "./routes/home.js";
import { interestsRouter } from "./routes/interests.js";
import { itemsRouter } from "./routes/items.js";
import { metaRouter } from "./routes/meta.js";
import { usersRouter } from "./routes/users.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("X-Frame-Options", "SAMEORIGIN");
  next();
});

// Arquivos de public/ (bundle do painel AdminJS e marca). Na Vercel eles vão
// junto com a função (includeFiles no vercel.json) e também são servidos aqui.
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
app.use(express.static(publicDir, { maxAge: config.isProduction ? "1h" : 0 }));

// Área administrativa low-code (AdminJS). Precisa vir antes dos parsers de corpo.
app.use("/admin", adminMiddleware);

app.use(cookieParser());

app.get("/", homeHandler);
app.use("/health", healthRouter);

const apiCors = cors({
  origin: (origin, callback) => callback(null, origin && isAllowedOrigin(origin) ? origin : false),
  credentials: true,
  maxAge: 600,
});

/** Bloqueia requisições de escrita vindas de origens desconhecidas (proteção extra contra CSRF). */
function originGuard(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || req.path.startsWith("/assistant/actions/")) {
    next();
    return;
  }

  const origin = req.get("origin");
  if (!origin || isAllowedOrigin(origin)) {
    next();
    return;
  }

  try {
    const host = req.get("x-forwarded-host") ?? req.get("host");
    if (new URL(origin).host === host) {
      next();
      return;
    }
  } catch {
    // origem malformada: cai no bloqueio abaixo
  }

  next(new HttpError(403, "Origem da requisição não permitida.", "forbidden_origin"));
}

app.use("/api", apiCors, express.json({ limit: "100kb" }), originGuard);
app.use("/api", metaRouter);
app.use("/api/items", itemsRouter);
app.use("/api/interests", interestsRouter);
app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/assistant", assistantRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
