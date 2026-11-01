import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// Artefatos da IBM ficam na raiz do repositório (pasta watson/).
const repoRoot = path.resolve(process.cwd(), "..");

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as Record<string, unknown>;
}

test("OpenAPI da extensão segue as restrições principais do watsonx Assistant", () => {
  const document = readJson("watson/reuse-assistant-extension.openapi.json");
  const serialized = JSON.stringify(document);
  const paths = document.paths as Record<string, Record<string, { operationId?: string }>>;

  assert.match(String(document.openapi), /^3\.0\./);
  assert.equal(Buffer.byteLength(serialized) < 4 * 1024 * 1024, true);
  assert.equal(serialized.includes('"anyOf"'), false);
  assert.equal(serialized.includes('"oneOf"'), false);
  assert.equal(serialized.includes('"allOf"'), false);
  assert.deepEqual(
    Object.values(paths)
      .flatMap((pathItem) => Object.values(pathItem))
      .map((operation) => operation.operationId)
      .sort(),
    ["getMyItemsSummary", "pauseMyAvailableItems", "reactivateMyPausedItems"]
  );
  for (const route of Object.keys(paths)) {
    assert.match(route, /^\/api\/assistant\/actions\/items\//);
  }
});

test("catálogo cobre automação e orientação em português", () => {
  const catalog = readJson("watson/actions/action-catalog.json");
  const actions = catalog.actions as Array<{
    category: string;
    examples: string[];
    steps?: Array<{ type: string; inputs?: Record<string, string> }>;
  }>;

  assert.equal(actions.filter((action) => action.category === "automation").length >= 2, true);
  assert.equal(actions.filter((action) => action.category === "guidance").length >= 5, true);
  assert.equal(actions.every((action) => action.examples.length >= 4), true);

  const extensionInputs = actions
    .flatMap((action) => action.steps ?? [])
    .filter((step) => step.type === "extension")
    .map((step) => step.inputs?.["X-ReUse-Action-Token"]);

  assert.equal(extensionInputs.length, 4);
  assert.equal(
    extensionInputs.every((value) => value === "${system_integrations.chat.private.user_payload}.reuse_action_token"),
    true
  );
});

test("sessão do Web Chat preserva o usuário IBM anônimo e não expõe o id interno", () => {
  const source = readFileSync(path.join(process.cwd(), "src/routes/assistant.ts"), "utf8");

  assert.match(source, /const subject = anonymous\.subject;/);
  assert.match(source, /if \(anonymous\.shouldSetCookie\)/);
  assert.doesNotMatch(source, /createAssistantUserId/);
});
