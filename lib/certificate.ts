import "server-only";

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from "node:crypto";

import { canonicalJson, sha256 } from "@/lib/canonical";
import { metaGet, metaSet } from "@/lib/store";

type KeyMaterial = { privateKey: string; publicKey: string };

function keyMaterial(): KeyMaterial {
  const existing = metaGet("certificate_ed25519_keypair");
  if (existing) return JSON.parse(existing) as KeyMaterial;
  const pair = generateKeyPairSync("ed25519");
  const material = {
    privateKey: pair.privateKey.export({ format: "der", type: "pkcs8" }).toString("base64url"),
    publicKey: pair.publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
  };
  metaSet("certificate_ed25519_keypair", JSON.stringify(material));
  return material;
}

export function issueCertificate(payload: Record<string, unknown>) {
  const keys = keyMaterial();
  const message = Buffer.from(canonicalJson(payload));
  const signature = sign(
    null,
    message,
    createPrivateKey({ key: Buffer.from(keys.privateKey, "base64url"), format: "der", type: "pkcs8" }),
  ).toString("base64url");
  return {
    payload,
    signature,
    publicKey: keys.publicKey,
    certificateHash: sha256({ payload, signature, publicKey: keys.publicKey }),
  };
}

export function verifyCertificate(certificate: {
  payload: Record<string, unknown>;
  signature: string;
  publicKey: string;
  certificateHash: string;
}): boolean {
  const hashMatches =
    sha256({
      payload: certificate.payload,
      signature: certificate.signature,
      publicKey: certificate.publicKey,
    }) === certificate.certificateHash;
  if (!hashMatches) return false;
  try {
    return verify(
      null,
      Buffer.from(canonicalJson(certificate.payload)),
      createPublicKey({
        key: Buffer.from(certificate.publicKey, "base64url"),
        format: "der",
        type: "spki",
      }),
      Buffer.from(certificate.signature, "base64url"),
    );
  } catch {
    return false;
  }
}
