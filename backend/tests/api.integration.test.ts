import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";

// Requer banco PostgreSQL com migrations aplicadas (RUN_DATABASE_TESTS=1).
const shouldRun = process.env.RUN_DATABASE_TESTS === "1";

type Session = { cookie: string };

async function startServer() {
  const { default: app } = await import("../src/app.js");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  return { server, base: `http://127.0.0.1:${port}` };
}

async function call(base: string, path: string, init: RequestInit & { session?: Session } = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (init.session?.cookie) headers.set("cookie", init.session.cookie);
  const response = await fetch(`${base}${path}`, { ...init, headers, redirect: "manual" });
  const setCookie = response.headers.getSetCookie().find((value) => value.startsWith("reuse_session="));
  if (init.session && setCookie) init.session.cookie = setCookie.split(";")[0];
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // resposta não JSON (HTML)
  }
  return { status: response.status, body: body as Record<string, unknown> & unknown[] };
}

test("API: fluxo completo de cadastro, anúncio, interesse e permissões", { skip: !shouldRun }, async () => {
  const { server, base } = await startServer();
  const { prisma } = await import("../src/lib/prisma.js");
  const suffix = `${Date.now()}${Math.random().toString(16).slice(2, 6)}`;
  const owner: Session = { cookie: "" };
  const visitor: Session = { cookie: "" };
  const createdUserEmails = [`owner-${suffix}@reuse.test`, `visitor-${suffix}@reuse.test`];

  try {
    assert.equal((await call(base, "/health")).body.status, "ok");

    const signup = await call(base, "/api/users", {
      method: "POST",
      session: owner,
      body: JSON.stringify({
        name: "Dona do Item",
        email: createdUserEmails[0],
        password: "segredo-123",
        city: "São Paulo",
        utm: { utmSource: "Google", utmMedium: "cpc", utmCampaign: "lancamento_reuse" },
      }),
    });
    assert.equal(signup.status, 201);
    assert.ok(owner.cookie, "cadastro deve criar o cookie de sessão");

    const stored = await prisma.user.findUnique({ where: { email: createdUserEmails[0] } });
    assert.equal(stored?.utmSource, "google");
    assert.equal(stored?.utmCampaign, "lancamento_reuse");
    assert.equal(stored?.role, "USER");

    const duplicate = await call(base, "/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "Xavier", email: createdUserEmails[0], password: "segredo-123" }),
    });
    assert.equal(duplicate.status, 409);

    const me = await call(base, "/api/users/me", { session: owner });
    assert.equal((me.body.user as { email: string }).email, createdUserEmails[0]);

    const anonymousMe = await call(base, "/api/users/me");
    assert.equal(anonymousMe.body.user, null);

    const category = await prisma.category.upsert({
      where: { name: `Teste ${suffix}` },
      update: {},
      create: { name: `Teste ${suffix}` },
    });

    const unauthorized = await call(base, "/api/items", { method: "POST", body: JSON.stringify({}) });
    assert.equal(unauthorized.status, 401);

    const invalid = await call(base, "/api/items", {
      method: "POST",
      session: owner,
      body: JSON.stringify({ title: "ab", description: "curta", condition: "Novo", categoryId: category.id }),
    });
    assert.equal(invalid.status, 400);

    const created = await call(base, "/api/items", {
      method: "POST",
      session: owner,
      body: JSON.stringify({
        title: "Mesa de estudos",
        description: "Mesa firme com gaveta, ótima para estudar.",
        condition: "Usado",
        categoryId: category.id,
        imageUrl: "/seed/mesa-cabeceira.webp",
      }),
    });
    assert.equal(created.status, 201);
    const itemId = (created.body as unknown as { id: string }).id;

    const list = await call(base, `/api/items?q=${encodeURIComponent("mesa de estudos")}`);
    assert.ok((list.body as unknown as Array<{ id: string }>).some((item) => item.id === itemId));

    const ownInterest = await call(base, `/api/items/${itemId}/interests`, {
      method: "POST",
      session: owner,
      body: JSON.stringify({ message: "Quero o meu próprio item" }),
    });
    assert.equal(ownInterest.status, 400);

    await call(base, "/api/users", {
      method: "POST",
      session: visitor,
      body: JSON.stringify({ name: "Visitante", email: createdUserEmails[1], password: "segredo-123" }),
    });

    const interest = await call(base, `/api/items/${itemId}/interests`, {
      method: "POST",
      session: visitor,
      body: JSON.stringify({ message: "Tenho muito interesse nesta mesa!" }),
    });
    assert.equal(interest.status, 201);
    assert.equal(interest.body.role, "visitor");

    const duplicateInterest = await call(base, `/api/items/${itemId}/interests`, {
      method: "POST",
      session: visitor,
      body: JSON.stringify({ message: "Tenho muito interesse nesta mesa!" }),
    });
    assert.equal(duplicateInterest.status, 409);

    const ownerPanel = await call(base, `/api/items/${itemId}/interests`, { session: owner });
    assert.equal(ownerPanel.body.role, "owner");
    assert.equal(ownerPanel.body.total, 1);

    const forbiddenPatch = await call(base, `/api/items/${itemId}`, {
      method: "PATCH",
      session: visitor,
      body: JSON.stringify({ status: "PAUSADO" }),
    });
    assert.equal(forbiddenPatch.status, 403);

    const patched = await call(base, `/api/items/${itemId}`, {
      method: "PATCH",
      session: owner,
      body: JSON.stringify({ status: "DOADO" }),
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.status, "DOADO");

    const blockedOrigin = await call(base, `/api/items/${itemId}`, {
      method: "DELETE",
      session: owner,
      headers: { origin: "https://site-malicioso.example" },
    });
    assert.equal(blockedOrigin.status, 403);

    const removed = await call(base, `/api/items/${itemId}`, { method: "DELETE", session: owner });
    assert.equal(removed.status, 200);

    const logout = await call(base, "/api/users/logout", { method: "POST", session: owner });
    assert.equal(logout.status, 200);

    await prisma.category.delete({ where: { id: category.id } });
  } finally {
    await prisma.interest.deleteMany({ where: { user: { email: { in: createdUserEmails } } } });
    await prisma.item.deleteMany({ where: { owner: { email: { in: createdUserEmails } } } });
    await prisma.user.deleteMany({ where: { email: { in: createdUserEmails } } });
    await prisma.$disconnect();
    server.close();
  }
});
