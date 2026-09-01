import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import { sha256 } from "@/lib/canonical";
import { relayConfig } from "@/lib/config";
import { readSessionHandle, SESSION_COOKIE, signHandle } from "@/lib/security";
import { createSession, enforceRateLimit, getSession } from "@/lib/store";
import type { RelayState } from "@/lib/types";

export function requestFingerprint(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return sha256(forwarded || request.headers.get("x-real-ip") || "local").slice(0, 24);
}

export function sessionFromRequest(request: NextRequest): RelayState | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const handle = readSessionHandle(token);
    return getSession(handle.sessionId);
  } catch {
    return null;
  }
}

export function getOrCreateSession(request: NextRequest): { state: RelayState; created: boolean } {
  const fingerprint = requestFingerprint(request);
  enforceRateLimit(`session:${fingerprint}`, 120, 60_000);
  const existing = sessionFromRequest(request);
  if (existing) return { state: existing, created: false };
  return { state: createSession(), created: true };
}

export function attachSessionCookie(response: NextResponse, state: RelayState): void {
  const token = signHandle({
    kind: "session",
    sessionId: state.sessionId,
    target: state.sessionId,
    version: 1,
    expiresAt: state.expiresAt,
  });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: relayConfig().cookieSecure,
    path: "/",
    expires: new Date(state.expiresAt),
  });
}

export function requireSameOriginMutation(request: NextRequest): void {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") throw new Error("CROSS_ORIGIN_FORBIDDEN");
  const origin = request.headers.get("origin");
  if (!origin) return;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new Error("CROSS_ORIGIN_FORBIDDEN");
  }
  const allowedHosts = new Set(
    [
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
      request.headers.get("host"),
      request.nextUrl.host,
    ].filter((value): value is string => Boolean(value)),
  );
  if (!allowedHosts.has(originUrl.host)) throw new Error("CROSS_ORIGIN_FORBIDDEN");
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProtocol && originUrl.protocol !== `${forwardedProtocol}:`) {
    throw new Error("CROSS_ORIGIN_FORBIDDEN");
  }
}

export async function readBoundedJson(request: NextRequest, maxBytes = 8192): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (!Number.isFinite(declaredLength) || declaredLength < 0 || declaredLength > maxBytes) {
    throw new Error("INPUT_TOO_LARGE");
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) throw new Error("INPUT_TOO_LARGE");
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("INVALID_REQUEST");
  }
}
