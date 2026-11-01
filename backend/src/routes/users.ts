import { Router } from "express";
import { clearSessionCookie, getSessionUserId, hashPassword, requireUser, setSessionCookie, verifyPassword } from "../lib/auth.js";
import { asyncHandler, HttpError, noStore } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import { readEmail, readOptionalString, readString, readUtm, requireLength } from "../lib/validation.js";
import { itemInclude } from "./items.js";

export const usersRouter = Router();

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  city: true,
  role: true,
  createdAt: true,
} as const;

/** Cadastro de usuário. Também registra a origem da campanha (UTM), quando houver. */
usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    noStore(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = requireLength(readString(body.name, { max: 120 }), "O nome", 2, 80);
    const email = readEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 6) throw new HttpError(400, "A senha deve possuir pelo menos 6 caracteres.", "validation_error");
    if (password.length > 128) throw new HttpError(400, "A senha deve ter no máximo 128 caracteres.", "validation_error");
    const city = readOptionalString(body.city, { max: 80 });

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new HttpError(409, "E-mail já cadastrado.", "email_taken");

    const user = await prisma.user.create({
      data: { name, email, password: hashPassword(password), city, ...readUtm(body.utm ?? body) },
      select: { id: true, name: true, email: true },
    });

    setSessionCookie(res, user.id);
    res.status(201).json(user);
  })
);

usersRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    noStore(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = readString(body.email, { max: 254 }).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) throw new HttpError(400, "E-mail e senha são obrigatórios.", "validation_error");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      throw new HttpError(401, "E-mail ou senha inválidos.", "invalid_credentials");
    }

    setSessionCookie(res, user.id);
    res.json({ id: user.id, name: user.name });
  })
);

usersRouter.post("/logout", (_req, res) => {
  noStore(res);
  clearSessionCookie(res);
  res.json({ ok: true });
});

/** Usuário da sessão atual (ou null para visitantes). */
usersRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    noStore(res);
    const userId = getSessionUserId(req);
    const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect }) : null;
    res.json({ user });
  })
);

usersRouter.get(
  "/me/items",
  requireUser(),
  asyncHandler(async (_req, res) => {
    noStore(res);
    const items = await prisma.item.findMany({
      where: { ownerId: res.locals.userId as string },
      include: itemInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  })
);

usersRouter.get(
  "/me/interests",
  requireUser(),
  asyncHandler(async (_req, res) => {
    noStore(res);
    const interests = await prisma.interest.findMany({
      where: { userId: res.locals.userId as string },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            status: true,
            imageUrl: true,
            category: { select: { name: true } },
            owner: { select: { name: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(interests);
  })
);
