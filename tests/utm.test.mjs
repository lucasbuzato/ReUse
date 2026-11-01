import assert from "node:assert/strict";
import test from "node:test";
import { mergeFirstTouch, parseUtm, readStoredUtm, UTM_STORAGE_KEY } from "../lib/utm.ts";

const DAY = 24 * 60 * 60 * 1000;

test("parseUtm normaliza valores e ignora parâmetros fora do padrão", () => {
  assert.deepEqual(parseUtm("?utm_source=Instagram&utm_medium=Social&utm_campaign=lancamento-2026&gclid=abc"), {
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "lancamento-2026",
  });
  assert.deepEqual(parseUtm("?utm_source=<script>&utm_medium="), {});
  assert.deepEqual(parseUtm(""), {});
});

test("mergeFirstTouch mantém o primeiro toque por 30 dias", () => {
  const now = Date.UTC(2026, 7, 20);
  const first = { utm_source: "google", utm_medium: "cpc", capturedAt: now - 5 * DAY };

  assert.equal(mergeFirstTouch(first, { utm_source: "instagram" }, now), first);
  assert.deepEqual(mergeFirstTouch({ ...first, capturedAt: now - 31 * DAY }, { utm_source: "instagram" }, now), {
    utm_source: "instagram",
    capturedAt: now,
  });
  assert.equal(mergeFirstTouch(null, {}, now), null);
});

test("readStoredUtm tolera dados ausentes, corrompidos ou vencidos", () => {
  const now = Date.UTC(2026, 7, 20);
  const storage = (value) => ({ getItem: (key) => (key === UTM_STORAGE_KEY ? value : null) });

  assert.deepEqual(readStoredUtm(undefined, now), {});
  assert.deepEqual(readStoredUtm(storage("{quebrado"), now), {});
  assert.deepEqual(readStoredUtm(storage(JSON.stringify({ utm_source: "google", capturedAt: now - 40 * DAY })), now), {});
  assert.deepEqual(
    readStoredUtm(storage(JSON.stringify({ utm_source: "google", utm_campaign: "<x>", capturedAt: now - DAY })), now),
    { utm_source: "google" }
  );
});
