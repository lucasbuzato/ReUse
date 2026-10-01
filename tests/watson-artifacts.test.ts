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

  const extensionInputs = actions
    .flatMap(
      (action) =>
        (
          action as unknown as {
            steps?: Array<{
              type: string;
              inputs?: Record<string, string>;
            }>;
          }
        ).steps ?? []
    )
    .filter((step) => step.type === "extension")
    .map((step) => step.inputs?.["X-ReUse-Action-Token"]);

  assert.equal(extensionInputs.length, 4);
  assert.equal(
    extensionInputs.every(
      (value) => value === "${system_integrations.chat.private.user_payload}.reuse_action_token"
    ),
    true
  );
});

test("Web Chat usa JWT assinado e mantém token sensível fora do contexto público", () => {
  const source = readFileSync(
    path.join(process.cwd(), "components/WatsonAssistantChat.tsx"),
    "utf8"
  );

  assert.match(
    source,
    /const ACTION_SKILLS = \["actions skill", "action skill"\] as const;/
  );
  assert.match(source, /identityToken: initialIdentity\.identityToken/);
  assert.match(source, /type: "identityTokenExpired"/);
  assert.match(source, /setPublicActionSkillVariables\(event, identity\);/);
  assert.doesNotMatch(source, /variables\.reuse_action_token\s*=/);
  assert.doesNotMatch(source, /updateUserID/);
});

test("mudanças de autenticação preservam o usuário IBM e renovam a página", () => {
  const sessionSource = readFileSync(
    path.join(process.cwd(), "app/api/assistant/session/route.ts"),
    "utf8"
  );
  const authComponents = [
    "components/FormularioLogin.tsx",
    "components/FormularioCadastro.tsx",
    "components/LogoutButton.tsx",
  ].map((relativePath) =>
    readFileSync(path.join(process.cwd(), relativePath), "utf8")
  );

  assert.match(sessionSource, /const subject = anonymous\.subject;/);
  assert.match(sessionSource, /if \(anonymous\.shouldSetCookie\)/);
  assert.doesNotMatch(sessionSource, /createAssistantUserId/);
  assert.equal(
    authComponents.every((source) => /window\.location\.assign\(/.test(source)),
    true
  );
});

test("entrada por voz valida o microfone, prioriza pt-BR local e limita esperas", () => {
  const source = readFileSync(
    path.join(process.cwd(), "components/WatsonAssistantChat.tsx"),
    "utf8"
  );

  assert.match(source, /function toggleVoiceInput\(\) \{/);
  assert.match(source, /recognition\.start\(audioTrack\);/);
  assert.match(source, /microphoneStream\.getAudioTracks\(\)\[0\]/);
  assert.match(source, /start\(audioTrack\?: MediaStreamTrack\): void/);
  assert.match(source, /startTimeout = window\.setTimeout/);
  assert.match(source, /listenTimeout = window\.setTimeout/);
  assert.match(source, /VOICE_LISTEN_TIMEOUT_MS/);
  assert.match(source, /VOICE_SEND_TIMEOUT_MS/);
  assert.match(source, /voice_send_timeout/);
  assert.match(source, /navigator\.mediaDevices\.getUserMedia\(\{ audio: true \}\)/);
  assert.match(source, /SpeechRecognition\.available\(options\)/);
  assert.match(source, /SpeechRecognition\.install\(options\)/);
  assert.match(source, /recognition\.processLocally = recognitionMode === "local"/);
  assert.match(source, /const VOICE_LANGUAGE = "pt-BR"/);
  assert.match(source, /O Chrome não iniciou o reconhecimento de voz/);
  assert.match(source, /O Chrome não concluiu o reconhecimento da fala/);
  assert.match(source, /getVoiceErrorMessage\(event\.error\)/);
});
