import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");

function sourceFiles(dir) {
  return readdirSync(path.join(root, dir)).flatMap((entry) => {
    const relative = path.join(dir, entry);
    if (statSync(path.join(root, relative)).isDirectory()) return sourceFiles(relative);
    return /\.(ts|tsx)$/.test(entry) ? [relative] : [];
  });
}

test("o frontend não acessa o banco: todo dado vem da API do backend", () => {
  const offenders = ["app", "components", "lib"]
    .flatMap(sourceFiles)
    .filter((file) => /@prisma\/client|@\/lib\/prisma|from "\.\.?\/.*prisma"/.test(read(file)));

  assert.deepEqual(offenders, []);
  assert.equal(existsSync(path.join(root, "app/api")), false, "rotas de API ficam só em backend/");

  const pkg = JSON.parse(read("package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal("prisma" in deps || "@prisma/client" in deps, false);
});

test("um só projeto na Vercel: vercel.json envia /api, /admin e /health para o serviço da API", () => {
  const vercel = JSON.parse(read("vercel.json"));
  assert.equal(vercel.services.web.framework, "nextjs");
  assert.equal(vercel.services.api.root, "backend");
  assert.equal(vercel.services.api.framework, "express");
  assert.ok(existsSync(path.join(root, "backend", vercel.services.api.entrypoint)));

  const destinationOf = (source) => vercel.rewrites.find((rule) => rule.source === source)?.destination?.service;
  for (const source of ["/api", "/api/(.*)", "/admin", "/admin/(.*)", "/admin-assets/(.*)", "/health"]) {
    assert.equal(destinationOf(source), "api", source);
  }
  assert.equal(vercel.rewrites.at(-1).source, "/(.*)");
  assert.equal(vercel.rewrites.at(-1).destination.service, "web");

  const binding = vercel.services.web.bindings.find((entry) => entry.service === "api");
  assert.equal(binding.env, "BACKEND_URL");
});

test("fora da Vercel o Next.js encaminha /api e /admin para a API local", () => {
  const config = read("next.config.js");
  assert.match(config, /"\/api\/:path\*"/);
  assert.match(config, /"\/admin\/:path\*"/);
  assert.match(config, /BACKEND_URL/);
  assert.match(config, /process\.env\.VERCEL/);
});

test("o backend é um projeto separado com Prisma e painel AdminJS", () => {
  const pkg = JSON.parse(read("backend/package.json"));
  assert.ok(pkg.dependencies["@prisma/client"]);
  assert.ok(pkg.dependencies.adminjs);
  assert.ok(pkg.dependencies.express);
  assert.equal(existsSync(path.join(root, "backend/prisma/schema.prisma")), true);
});
