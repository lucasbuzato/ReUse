import assert from "node:assert/strict";
import {
  constants,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  privateDecrypt,
  verify,
} from "node:crypto";
import test from "node:test";
import { createAssistantWebChatIdentityToken } from "../lib/assistant-web-chat-token";

const now = Date.UTC(2026, 8, 29, 2, 0, 0);
const signingKeys = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { format: "pem", type: "pkcs8" },
  publicKeyEncoding: { format: "pem", type: "spki" },
});
const encryptionKeys = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { format: "pem", type: "pkcs8" },
  publicKeyEncoding: { format: "pem", type: "spki" },
});

function decodePart<T>(part: string) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

function decryptUserPayload(value: string) {
  const key = createPrivateKey(encryptionKeys.privateKey);
  const encryptedBlockLength = Math.ceil(
    (key.asymmetricKeyDetails?.modulusLength ?? 0) / 8
  );
  const encrypted = Buffer.from(value, "base64");
  const decrypted: Buffer[] = [];

  assert.equal(encrypted.length % encryptedBlockLength, 0);

  for (
    let offset = 0;
    offset < encrypted.length;
    offset += encryptedBlockLength
  ) {
    decrypted.push(
      privateDecrypt(
        {
          key,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha1",
        },
        encrypted.subarray(offset, offset + encryptedBlockLength)
      )
    );
  }

  return JSON.parse(Buffer.concat(decrypted).toString("utf8")) as Record<
    string,
    unknown
  >;
}

test("assina JWT RS256 e criptografa o user_payload privado para a IBM", () => {
  const actionToken = `v1.${"p".repeat(320)}.signature`;
  const result = createAssistantWebChatIdentityToken({
    subject: "reuse_user_pseudonymous",
    privateKey: signingKeys.privateKey,
    ibmPublicKey: encryptionKeys.publicKey,
    userPayload: {
      reuse_authenticated: true,
      reuse_action_token: actionToken,
      reuse_token_expires_at: "2026-09-29T02:10:00.000Z",
      reuse_user_name: "Lucas",
    },
    now,
  });

  const [encodedHeader, encodedPayload, encodedSignature] = result.token.split(".");
  const header = decodePart<{ alg: string; typ: string }>(encodedHeader);
  const payload = decodePart<{
    sub: string;
    iat: number;
    exp: number;
    user_payload: string;
  }>(encodedPayload);
  const verified = verify(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    createPublicKey(signingKeys.publicKey),
    Buffer.from(encodedSignature, "base64url")
  );
  const decryptedPayload = decryptUserPayload(payload.user_payload);

  assert.deepEqual(header, { alg: "RS256", typ: "JWT" });
  assert.equal(payload.sub, "reuse_user_pseudonymous");
  assert.equal(payload.exp - payload.iat, 600);
  assert.equal(typeof payload.user_payload, "string");
  assert.equal(payload.user_payload.includes(actionToken), false);
  assert.equal(decryptedPayload.reuse_authenticated, true);
  assert.equal(decryptedPayload.reuse_action_token, actionToken);
  assert.equal(result.expiresAt, "2026-09-29T02:10:00.000Z");
  assert.equal(verified, true);
});

test("rejeita chave de assinatura abaixo do mínimo RSA de 2048 bits", () => {
  const weakKey = generateKeyPairSync("rsa", {
    modulusLength: 1024,
    privateKeyEncoding: { format: "pem", type: "pkcs8" },
    publicKeyEncoding: { format: "pem", type: "spki" },
  }).privateKey;

  assert.throws(
    () =>
      createAssistantWebChatIdentityToken({
        subject: "reuse_user",
        privateKey: weakKey,
        ibmPublicKey: encryptionKeys.publicKey,
        userPayload: { reuse_authenticated: false },
        now,
      }),
    /ao menos 2048 bits/
  );
});
