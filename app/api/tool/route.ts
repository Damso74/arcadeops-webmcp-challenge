import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { invokeTool } from "@/lib/engine";
import {
  attachSessionCookie,
  getOrCreateSession,
  readBoundedJson,
  requestFingerprint,
  requireSameOriginMutation,
} from "@/lib/http-session";
import { RELAY_TOOL_NAMES } from "@/lib/types";
import { redactToolOutput } from "@/lib/redaction";
import { enforceRateLimit, getSession } from "@/lib/store";

export const dynamic = "force-dynamic";

const requestSchema = z
  .object({
    tool: z.enum(RELAY_TOOL_NAMES),
    input: z.record(z.string(), z.unknown()),
    idempotencyKey: z.string().regex(/^[a-zA-Z0-9:_-]{8,100}$/),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    requireSameOriginMutation(request);
    const { state } = getOrCreateSession(request);
    enforceRateLimit(`tool:${state.sessionId}:${requestFingerprint(request)}`, 60, 60_000);
    const body = requestSchema.parse(await readBoundedJson(request));
    const result = invokeTool(state.sessionId, state, body.tool, body.input, body.idempotencyKey);
    const current = getSession(state.sessionId) ?? state;
    const response = NextResponse.json(redactToolOutput(result), { status: result.ok ? 200 : 400 });
    response.headers.set("Cache-Control", "no-store");
    attachSessionCookie(response, current);
    return response;
  } catch (error) {
    const rawCode = error instanceof Error ? error.message : "INVALID_REQUEST";
    const code = ["RATE_LIMITED", "CROSS_ORIGIN_FORBIDDEN", "SESSION_CONFLICT", "INPUT_TOO_LARGE"].includes(rawCode)
      ? rawCode
      : "INVALID_REQUEST";
    console.warn("relay_tool_request_refused", { code });
    const status = code === "RATE_LIMITED" ? 429 : code === "INPUT_TOO_LARGE" ? 413 : 400;
    return NextResponse.json({ ok: false, errorCode: code }, { status });
  }
}
