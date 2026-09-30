import {
  constants,
  createPrivateKey,
  createPublicKey,
  createSign,
  publicEncrypt,
} from "crypto";
import { ASSISTANT_ACTION_TOKEN_TTL_SECONDS } from "./assistant-action-token";

export const ASSISTANT_WEB_CHAT_TOKEN_TTL_SECONDS =
  ASSISTANT_ACTION_TOKEN_TTL_SECONDS;

export type AssistantWebChatUserPayload = {
  reuse_authenticated: boolean;
  reuse_action_token?: string;
  reuse_token_expires_at?: string;
  reuse_user_name?: string;
};

export type AssistantWebChatClaims = {
  sub: string;
  iat: number;
  exp: number;
  user_payload: string;
};

type CreateIdentityTokenOptions = {
  subject: string;
  privateKey: string;
  ibmPublicKey: string;
  userPayload: AssistantWebChatUserPayload;
  ttlSeconds?: number;
  now?: number;
};

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function assertRsaKey(
  type: "private" | "public",
  value: string,
  label: string
) {
  const key = type === "private" ? createPrivateKey(value) : createPublicKey(value);
  const modulusLength = key.asymmetricKeyDetails?.modulusLength ?? 0;

  if (key.asymmetricKeyType !== "rsa" || modulusLength < 2048) {
    throw new Error(`${label} deve ser uma chave RSA de ao menos 2048 bits.`);
  }

  return { key, modulusLength };
}

function readPemEnvironmentValue(base64Name: string, pemName: string) {
  const encoded = process.env[base64Name]?.trim();
  const configured = process.env[pemName];
  return encoded
    ? Buffer.from(encoded, "base64").toString("utf8")
    : configured?.replace(/\\n/g, "\n");
}

export function resolveAssistantWebChatPrivateKey() {
  const privateKey = readPemEnvironmentValue(
    "ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64",
    "ASSISTANT_WEB_CHAT_PRIVATE_KEY"
  );

  if (!privateKey) {
    throw new Error(
      "ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64 precisa ser configurada."
    );
  }

  assertRsaKey("private", privateKey, "A chave privada do Web Chat");
  return privateKey;
}

export function resolveAssistantWebChatIbmPublicKey() {
  const publicKey = readPemEnvironmentValue(
    "ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64",
    "ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY"
  );

  if (!publicKey) {
    throw new Error(
      "ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64 precisa ser configurada."
    );
  }

  assertRsaKey("public", publicKey, "A chave pública de criptografia da IBM");
  return publicKey;
}

export function encryptAssistantWebChatUserPayload(
  userPayload: AssistantWebChatUserPayload,
  ibmPublicKey: string
) {
  const { key, modulusLength } = assertRsaKey(
    "public",
    ibmPublicKey,
    "A chave pública de criptografia da IBM"
  );
  const encryptedBlockLength = Math.ceil(modulusLength / 8);
  const sha1DigestLength = 20;
  const maxPlaintextLength =
    encryptedBlockLength - 2 * sha1DigestLength - 2;
  const plaintext = Buffer.from(JSON.stringify(userPayload), "utf8");
  const blockCount = Math.ceil(plaintext.length / maxPlaintextLength) || 1;
  const dividedLength = Math.ceil(plaintext.length / blockCount) || 1;
  const encryptedBlocks: Buffer[] = [];

  for (let index = 0; index < blockCount; index += 1) {
    const block = plaintext.subarray(
      index * dividedLength,
      (index + 1) * dividedLength
    );
    encryptedBlocks.push(
      publicEncrypt(
        {
          key,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha1",
        },
        block
      )
    );
  }

  return Buffer.concat(encryptedBlocks).toString("base64");
}

export function createAssistantWebChatIdentityToken({
  subject,
  privateKey,
  ibmPublicKey,
  userPayload,
  ttlSeconds = ASSISTANT_WEB_CHAT_TOKEN_TTL_SECONDS,
  now = Date.now(),
}: CreateIdentityTokenOptions) {
  if (!subject || subject.length > 256) {
    throw new Error("O identificador do usuário do Web Chat é inválido.");
  }

  if (ttlSeconds < 60 || ttlSeconds > 15 * 60) {
    throw new Error("A validade do JWT do Web Chat deve ficar entre 60 e 900 segundos.");
  }

  assertRsaKey("private", privateKey, "A chave privada do Web Chat");

  const issuedAt = Math.floor(now / 1000);
  const claims: AssistantWebChatClaims = {
    sub: subject,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    user_payload: encryptAssistantWebChatUserPayload(userPayload, ibmPublicKey),
  };
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const unsignedToken = `${encodeJson(header)}.${encodeJson(claims)}`;
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .end()
    .sign(privateKey)
    .toString("base64url");

  return {
    token: `${unsignedToken}.${signature}`,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
    claims,
  };
}
