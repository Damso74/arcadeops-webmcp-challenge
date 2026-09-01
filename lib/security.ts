import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { relayConfig } from "@/lib/config";

type SignedHandle = {
  kind: "session" | "plan" | "run" | "decision" | "acceptance";
  sessionId: string;
  target: string;
  version: number;
  expiresAt: string;
};

function signature(value: string): string {
  return createHmac("sha256", relayConfig().secret).update(value).digest("base64url");
}

export function signHandle(handle: SignedHandle): string {
  const body = Buffer.from(JSON.stringify(handle)).toString("base64url");
  return `${body}.${signature(body)}`;
}

export function verifyHandle(
  token: unknown,
  expected: Pick<SignedHandle, "kind" | "sessionId" | "target" | "version">,
): SignedHandle {
  if (typeof token !== "string" || token.length > 2048) throw new Error("INVALID_HANDLE");
  const [body, supplied, extra] = token.split(".");
  if (!body || !supplied || extra) throw new Error("INVALID_HANDLE");
  const expectedSignature = signature(body);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expectedSignature);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("INVALID_HANDLE");
  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignedHandle;
  if (
    parsed.kind !== expected.kind ||
    parsed.sessionId !== expected.sessionId ||
    parsed.target !== expected.target ||
    parsed.version !== expected.version ||
    Date.parse(parsed.expiresAt) <= Date.now()
  ) {
    throw new Error("STALE_HANDLE");
  }
  return parsed;
}

export function readSessionHandle(token: unknown): SignedHandle {
  if (typeof token !== "string" || token.length > 2048) throw new Error("INVALID_SESSION");
  const [body] = token.split(".");
  if (!body) throw new Error("INVALID_SESSION");
  let parsed: SignedHandle;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignedHandle;
  } catch {
    throw new Error("INVALID_SESSION");
  }
  if (parsed.kind !== "session" || parsed.target !== parsed.sessionId || parsed.version !== 1) {
    throw new Error("INVALID_SESSION");
  }
  try {
    return verifyHandle(token, {
      kind: "session",
      sessionId: parsed.sessionId,
      target: parsed.sessionId,
      version: 1,
    });
  } catch {
    throw new Error("INVALID_SESSION");
  }
}

export function newPublicId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export const SESSION_COOKIE = "arcadeops_relay_session";
