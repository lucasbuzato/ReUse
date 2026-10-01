import { chromium } from "playwright";
import { strict as assert } from "node:assert";
import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.BASE_URL;
const voiceURL = process.env.VOICE_URL;
const evidenceDir = process.env.EVIDENCE_DIR ?? "docs/evidence/watson";
const runId = process.env.GITHUB_RUN_ID ?? Date.now().toString();

if (!baseURL || !voiceURL) {
  throw new Error("BASE_URL e VOICE_URL são obrigatórias.");
}

await rm(evidenceDir, { recursive: true, force: true });
await mkdir(evidenceDir, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  baseURL,
  voiceURL,
  commit: process.env.GITHUB_SHA ?? null,
  runId,
  checks: {},
  pageErrors: [],
  consoleErrors: [],
};

const normalizeBaseURL = baseURL.replace(/\/$/, "");
const normalizeVoiceURL = voiceURL.replace(/\/$/, "");
const suffix = `${runId}-${Date.now()}`;
const password = `${randomBytes(18).toString("base64url")}Aa1!`;
const accounts = {
  a: {
    name: `Teste Watson A ${runId}`,
    email: `watson-a-${suffix}@example.invalid`,
    city: "São Paulo",
  },
  b: {
    name: `Teste Watson B ${runId}`,
    email: `watson-b-${suffix}@example.invalid`,
    city: "Campinas",
  },
};

function trackPage(page, label) {
  page.on("pageerror", (error) => {
    report.pageErrors.push({ page: label, message: error.message });
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      report.consoleErrors.push({ page: label, message: message.text() });
    }
  });
}

async function waitForDeployment(request, targetURL) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await request.get(targetURL, {
        timeout: 15_000,
      });
      lastStatus = response.status();
      if (response.ok()) return;
    } catch {
      lastStatus = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error(`Preview indisponível; último status: ${lastStatus || "sem resposta"}.`);
}

async function installBrowserHooks(context) {
  await context.addInitScript(() => {
    window.__reuseVoiceSends = [];

    class MockSpeechRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onstart = null;
      onresult = null;
      onerror = null;
      onend = null;
      timer = null;

      start() {
        window.__reuseRecognitionLocale = this.lang;
        this.onstart?.();
        this.timer = window.setTimeout(() => {
          this.onresult?.({
            results: [[{ transcript: "Como cadastrar um novo item?" }]],
          });
          this.onend?.();
        }, 1_200);
      }

      stop() {
        if (this.timer) window.clearTimeout(this.timer);
        this.onend?.();
      }

      abort() {
        if (this.timer) window.clearTimeout(this.timer);
        this.onerror?.({ error: "aborted" });
        this.onend?.();
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: MockSpeechRecognition,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: MockSpeechRecognition,
    });

    let chatOptions;
    Object.defineProperty(window, "watsonAssistantChatOptions", {
      configurable: true,
      get() {
        return chatOptions;
      },
      set(nextOptions) {
        chatOptions = nextOptions;
        const originalOnLoad = nextOptions?.onLoad;
        if (typeof originalOnLoad !== "function") return;

        nextOptions.onLoad = async (instance) => {
          window.__reuseWatsonInstance = instance;
          const originalSend = instance.send.bind(instance);
          instance.send = async (message) => {
            const text = message?.input?.text;
            if (typeof text === "string") window.__reuseVoiceSends.push(text);
            return originalSend(message);
          };
          return originalOnLoad(instance);
        };
      },
    });
  });
}

async function registerAndCreateItems(page, account, titles) {
  await page.goto(normalizeBaseURL, { waitUntil: "domcontentloaded" });
  const result = await page.evaluate(
    async ({ account: currentAccount, password: currentPassword, titles: itemTitles }) => {
      const createUser = await fetch("/api/users", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentAccount, password: currentPassword }),
      });
      if (createUser.status !== 201) {
        throw new Error(`Falha ao criar conta sintética: ${createUser.status}`);
      }

      const catalogResponse = await fetch("/api/items", { cache: "no-store" });
      if (!catalogResponse.ok) {
        throw new Error(`Falha ao consultar catálogo: ${catalogResponse.status}`);
      }
      const catalog = await catalogResponse.json();
      const categoryId = catalog[0]?.category?.id;
      if (!categoryId) throw new Error("Nenhuma categoria disponível para o teste.");

      const created = [];
      for (const title of itemTitles) {
        const response = await fetch("/api/items", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: "Anúncio sintético criado para validação da Atividade 02.",
            condition: "USADO",
            imageUrl: "",
            categoryId,
          }),
        });
        if (response.status !== 201) {
          throw new Error(`Falha ao criar item sintético: ${response.status}`);
        }
        const item = await response.json();
        created.push({ id: item.id, title: item.title, status: item.status });
      }
      return created;
    },
    { account, password, titles }
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  return result;
}

async function waitForChat(page) {
  await page.waitForSelector(
    '[data-testid="watson-assistant-status"][data-status="ready"]',
    { timeout: 90_000 }
  );
  await page.waitForFunction(
    () => Boolean(window.__reuseWatsonInstance),
    undefined,
    { timeout: 30_000 }
  );
  await page.evaluate(async () => {
    await window.__reuseWatsonInstance.openWindow?.();
  });
}

async function deepTextInFrame(frame) {
  return frame.evaluate(() => {
    const collect = (root) => {
      let text = "";
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let node = walker.currentNode;
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) text += ` ${node.textContent ?? ""}`;
        if (node.nodeType === Node.ELEMENT_NODE && node.shadowRoot) text += ` ${collect(node.shadowRoot)}`;
        node = walker.nextNode();
      }
      return text.replace(/\s+/g, " ").trim();
    };
    return collect(document.body);
  });
}

async function conversationText(page) {
  const parts = [];
  for (const frame of page.frames()) {
    try {
      parts.push(await deepTextInFrame(frame));
    } catch {
      // O frame pode navegar durante a leitura.
    }
  }
  return parts.join(" ");
}

function countOccurrences(text, expected) {
  return text.split(expected).length - 1;
}

async function waitForConversationTextCount(
  page,
  expected,
  minimumCount = 1,
  timeout = 60_000
) {
  const deadline = Date.now() + timeout;
  let observed = "";
  while (Date.now() < deadline) {
    observed = await conversationText(page);
    if (countOccurrences(observed, expected) >= minimumCount) return observed;
    await page.waitForTimeout(500);
  }
  throw new Error(
    `Texto não encontrado no chat: ${expected}. Último conteúdo: ${observed.slice(-500)}`
  );
}

async function currentConversationCount(page, expected) {
  return countOccurrences(await conversationText(page), expected);
}

async function sendChat(page, text) {
  await page.evaluate(async (message) => {
    await window.__reuseWatsonInstance.send({ input: { text: message } });
  }, text);
}

async function statusCounts(page) {
  await page.goto(`${normalizeBaseURL}/perfil`, { waitUntil: "networkidle" });
  return {
    available: await page.getByText("Disponível", { exact: true }).count(),
    paused: await page.getByText("Pausado", { exact: true }).count(),
  };
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(evidenceDir, name),
    fullPage: false,
  });
}

const browser = await chromium.launch({ headless: true });
const bootstrapContext = await browser.newContext();
await Promise.all([
  waitForDeployment(bootstrapContext.request, normalizeBaseURL),
  waitForDeployment(bootstrapContext.request, normalizeVoiceURL),
]);
await bootstrapContext.close();

const contextA = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
const contextB = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
const contextVoice = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
await Promise.all([
  installBrowserHooks(contextA),
  installBrowserHooks(contextB),
  installBrowserHooks(contextVoice),
]);

const chatPage = await contextA.newPage();
const profileA = await contextA.newPage();
const profileB = await contextB.newPage();
const voicePage = await contextVoice.newPage();
try {
  const [itemsA, itemsB] = await Promise.all([
    registerAndCreateItems(chatPage, accounts.a, [
      `E2E Watson A1 ${runId}`,
      `E2E Watson A2 ${runId}`,
    ]),
    registerAndCreateItems(profileB, accounts.b, [`E2E Watson B1 ${runId}`]),
  ]);
  assert.equal(itemsA.length, 2);
  assert.equal(itemsB.length, 1);
  assert.ok(itemsA.every((item) => item.status === "DISPONIVEL"));
  assert.ok(itemsB.every((item) => item.status === "DISPONIVEL"));
  report.checks.fixture = { ok: true, accountAItems: 2, accountBItems: 1 };

  trackPage(chatPage, "chat-a-producao");
  trackPage(profileA, "perfil-a-producao");
  trackPage(profileB, "perfil-b-producao");
  trackPage(voicePage, "voz-preview");

  await voicePage.goto(normalizeVoiceURL, { waitUntil: "domcontentloaded" });
  await waitForChat(voicePage);

  const guidanceFragment = "Selecione Publicar anúncio";
  const initialGuidanceCount = await currentConversationCount(voicePage, guidanceFragment);
  await sendChat(voicePage, "Como cadastrar um novo item?");
  await waitForConversationTextCount(voicePage, guidanceFragment, initialGuidanceCount + 1);
  await screenshot(voicePage, "01-orientacao-cadastrar-item.png");
  report.checks.guidance = { ok: true };

  const voiceButton = voicePage.locator('[data-testid="watson-assistant-voice"]');
  await voiceButton.waitFor({ state: "visible", timeout: 30_000 });
  const voiceSendCountBefore = await voicePage.evaluate(
    () => window.__reuseVoiceSends.length
  );
  const voiceGuidanceCountBefore = await currentConversationCount(
    voicePage,
    guidanceFragment
  );
  await voiceButton.click();
  await voicePage.waitForSelector('[data-testid="watson-assistant-voice"][data-state="listening"]');
  await screenshot(voicePage, "02-voz-ouvindo.png");
  await voicePage.waitForFunction(
    (previousCount) => window.__reuseVoiceSends.length > previousCount,
    voiceSendCountBefore,
    { timeout: 15_000 }
  );
  await waitForConversationTextCount(
    voicePage,
    guidanceFragment,
    voiceGuidanceCountBefore + 1
  );
  await screenshot(voicePage, "03-voz-transcricao-enviada.png");
  const recognitionLocale = await voicePage.evaluate(
    () => window.__reuseRecognitionLocale
  );
  assert.equal(recognitionLocale, "pt-BR");
  report.checks.voice = { ok: true, locale: recognitionLocale, environment: "preview" };

  await chatPage.goto(normalizeBaseURL, { waitUntil: "domcontentloaded" });
  await waitForChat(chatPage);

  const pausePrompt = "Quer pausar todos agora?";
  const firstPausePromptCount = await currentConversationCount(chatPage, pausePrompt);
  await sendChat(chatPage, "Quero pausar meus anúncios disponíveis");
  await waitForConversationTextCount(chatPage, pausePrompt, firstPausePromptCount + 1);
  await sendChat(chatPage, "Não");
  await waitForConversationTextCount(chatPage, "Nenhum anúncio foi alterado");
  await screenshot(chatPage, "04-pausa-cancelada.png");
  const afterCancel = await statusCounts(profileA);
  assert.deepEqual(afterCancel, { available: 2, paused: 0 });
  report.checks.cancel = { ok: true, ...afterCancel };

  const secondPausePromptCount = await currentConversationCount(chatPage, pausePrompt);
  await sendChat(chatPage, "Quero pausar meus anúncios disponíveis");
  await waitForConversationTextCount(chatPage, pausePrompt, secondPausePromptCount + 1);
  await sendChat(chatPage, "Sim");
  await waitForConversationTextCount(chatPage, "2 anúncios foram pausados com sucesso");
  await screenshot(chatPage, "05-pausa-confirmada.png");

  const afterPauseA = await statusCounts(profileA);
  const afterPauseB = await statusCounts(profileB);
  assert.deepEqual(afterPauseA, { available: 0, paused: 2 });
  assert.deepEqual(afterPauseB, { available: 1, paused: 0 });
  await screenshot(profileA, "06-perfil-a-anuncios-pausados.png");
  await screenshot(profileB, "07-perfil-b-isolamento.png");
  report.checks.pauseAndOwnership = {
    ok: true,
    accountA: afterPauseA,
    accountB: afterPauseB,
  };

  await sendChat(chatPage, "Quero pausar meus anúncios disponíveis");
  await waitForConversationTextCount(chatPage, "Você não tem anúncios disponíveis para pausar");
  await screenshot(chatPage, "08-pausa-idempotente.png");
  const afterIdempotency = await statusCounts(profileA);
  assert.deepEqual(afterIdempotency, { available: 0, paused: 2 });
  report.checks.idempotency = { ok: true, ...afterIdempotency };

  await sendChat(chatPage, "Reative meus anúncios");
  await waitForConversationTextCount(chatPage, "Quer reativar todos agora?");
  await sendChat(chatPage, "Sim");
  await waitForConversationTextCount(chatPage, "2 anúncios foram reativados com sucesso");
  await screenshot(chatPage, "09-reativacao-confirmada.png");

  const afterReactivationA = await statusCounts(profileA);
  const afterReactivationB = await statusCounts(profileB);
  assert.deepEqual(afterReactivationA, { available: 2, paused: 0 });
  assert.deepEqual(afterReactivationB, { available: 1, paused: 0 });
  await screenshot(profileA, "10-perfil-a-anuncios-reativados.png");
  report.checks.reactivation = {
    ok: true,
    accountA: afterReactivationA,
    accountB: afterReactivationB,
  };

  report.ok = true;
} catch (error) {
  report.ok = false;
  report.failure = error instanceof Error ? error.message : String(error);
  await Promise.allSettled([
    screenshot(chatPage, "failure-chat.png"),
    screenshot(voicePage, "failure-voice.png"),
    screenshot(profileA, "failure-perfil-a.png"),
    screenshot(profileB, "failure-perfil-b.png"),
  ]);
  throw error;
} finally {
  await writeFile(
    path.join(evidenceDir, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  await browser.close();
}
