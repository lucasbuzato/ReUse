import assert from "node:assert/strict";
import test from "node:test";
import { plural, safeNextPath, timeAgo } from "../lib/format.ts";

test("safeNextPath aceita apenas caminhos internos", () => {
  assert.equal(safeNextPath("/itens/novo"), "/itens/novo");
  assert.equal(safeNextPath("/itens?categoria=Livros"), "/itens?categoria=Livros");
  for (const unsafe of ["https://exemplo.com", "//exemplo.com", "/\\exemplo.com", "/api/users/logout", "", undefined, 42]) {
    assert.equal(safeNextPath(unsafe), "/perfil");
  }
});

test("timeAgo e plural geram textos curtos em português", () => {
  const now = Date.UTC(2026, 7, 20, 12);
  const daysAgo = (days) => new Date(now - days * 86_400_000).toISOString();

  assert.equal(timeAgo(daysAgo(0), now), "hoje");
  assert.equal(timeAgo(daysAgo(1), now), "ontem");
  assert.equal(timeAgo(daysAgo(12), now), "há 12 dias");
  assert.equal(timeAgo(daysAgo(65), now), "há 2 meses");
  assert.equal(timeAgo(daysAgo(800), now), "há 2 anos");
  assert.equal(plural(1, "item", "itens"), "1 item");
  assert.equal(plural(1200, "item", "itens"), "1.200 itens");
});
