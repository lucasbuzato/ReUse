import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => readFileSync(path.join(process.cwd(), file), "utf8");
const source = read("components/WatsonAssistantChat.tsx");

test("Web Chat usa JWT assinado e mantém token sensível fora do contexto público", () => {
  assert.match(source, /const ACTION_SKILLS = \["actions skill", "action skill"\] as const;/);
  assert.match(source, /identityToken: initialIdentity\.identityToken/);
  assert.match(source, /type: "identityTokenExpired"/);
  assert.match(source, /setPublicActionSkillVariables\(event, identity\);/);
  assert.doesNotMatch(source, /variables\.reuse_action_token\s*=/);
  assert.doesNotMatch(source, /updateUserID/);
  assert.match(source, /fetch\("\/api\/assistant\/session"/);
});

test("login, cadastro e logout recarregam a página para renovar a identidade do Assistant", () => {
  for (const file of ["components/FormularioLogin.tsx", "components/FormularioCadastro.tsx", "components/LogoutButton.tsx"]) {
    assert.match(read(file), /window\.location\.assign\(/, file);
  }
});

test("botão de voz acompanha a janela do chat e mantém os seletores de teste", () => {
  assert.match(source, /type: "window:open"/);
  assert.match(source, /type: "window:close"/);
  assert.match(source, /data-testid="watson-assistant-voice"/);
  assert.match(source, /data-testid="watson-assistant-status"/);
});

test("entrada por voz mantém escuta contínua e envia somente após o segundo clique", () => {
  assert.match(source, /function toggleVoiceInput\(\) \{/);
  assert.match(source, /recognition\.start\(audioTrack\);/);
  assert.match(source, /microphoneStream\.getAudioTracks\(\)\[0\]/);
  assert.match(source, /start\(audioTrack\?: MediaStreamTrack\): void/);
  assert.match(source, /recognition\.continuous = true;/);
  assert.match(source, /recognition\.interimResults = true;/);
  assert.match(source, /let finalTranscript = "";/);
  assert.match(source, /let interimTranscript = "";/);
  assert.match(source, /let index = event\.resultIndex;/);
  assert.match(source, /result\?\.isFinal/);
  assert.match(source, /finalTranscript = mergeTranscripts/);
  assert.match(source, /interimTranscript = mergeTranscripts/);
  assert.match(source, /stopVoiceInputRef\.current\?\.\(\);/);
  assert.match(source, /recognition\.stop\(\);/);
  assert.match(source, /if \(stopRequested\) \{[\s\S]*void sendTranscript\(\);/);
  assert.match(source, /VOICE_MAX_LISTEN_MS/);
  assert.doesNotMatch(source, /VOICE_LISTEN_TIMEOUT_MS/);
  assert.match(source, /Ouvindo… clique novamente no botão para enviar\./);
  assert.match(source, /VOICE_SEND_TIMEOUT_MS/);
  assert.match(source, /voice_send_timeout/);
  assert.match(source, /navigator\.mediaDevices\.getUserMedia\(\{ audio: true \}\)/);
  assert.match(source, /SpeechRecognition\.available\(options\)/);
  assert.match(source, /SpeechRecognition\.install\(options\)/);
  assert.match(source, /recognition\.processLocally = recognitionMode === "local"/);
  assert.match(source, /const VOICE_LANGUAGE = "pt-BR"/);
  assert.match(source, /O Chrome não iniciou o reconhecimento de voz/);
  assert.match(source, /getVoiceErrorMessage\(event\.error\)/);
});
