import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function readJson(relativePath: string) {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), relativePath), "utf8")
  ) as Record<string, unknown>;
}

test("OpenAPI da extensão segue as restrições principais do watsonx Assistant", () => {
  const document = readJson("watson/reuse-assistant-extension.openapi.json");
  const serialized = JSON.stringify(document);
  const paths = document.paths as Record<
    string,
    Record<string, { operationId?: string }>
  >;

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
    [
      "getMyItemsSummary",
      "pauseMyAvailableItems",
      "reactivateMyPausedItems",
    ]
  );
});

test("catálogo cobre automação e orientação em português", () => {
  const catalog = readJson("watson/actions/action-catalog.json");
  const actions = catalog.actions as Array<{
    category: string;
    examples: string[];
  }>;

  const automation = actions.filter((action) => action.category === "automation");
  const guidance = actions.filter((action) => action.category === "guidance");

  assert.equal(automation.length >= 2, true);
  assert.equal(guidance.length >= 5, true);
  assert.equal(
    actions.every((action) => action.examples.length >= 4),
    true
  );
});
