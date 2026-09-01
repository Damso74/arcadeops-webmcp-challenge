import { NextRequest, NextResponse } from "next/server";

import { recordHumanAction } from "@/lib/engine";
import {
  attachSessionCookie,
  readBoundedJson,
  requestFingerprint,
  requireSameOriginMutation,
  sessionFromRequest,
} from "@/lib/http-session";
import { sessionView } from "@/lib/presentation";
import { humanActionSchema } from "@/lib/schemas";
import { enforceRateLimit } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    requireSameOriginMutation(request);
    if (request.headers.get("x-relay-human-action") !== "visible-ui") {
      return NextResponse.json({ ok: false, errorCode: "HUMAN_UI_REQUIRED" }, { status: 403 });
    }
    const state = sessionFromRequest(request);
    if (!state) return NextResponse.json({ ok: false, errorCode: "SESSION_REQUIRED" }, { status: 401 });
    enforceRateLimit(`human:${state.sessionId}:${requestFingerprint(request)}`, 12, 60_000);
    const input = humanActionSchema.parse(await readBoundedJson(request, 4096));
    const updated = recordHumanAction(state.sessionId, input);
    const response = NextResponse.json({ ok: true, session: sessionView(updated) });
    response.headers.set("Cache-Control", "no-store");
    attachSessionCookie(response, updated);
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : "HUMAN_ACTION_REFUSED";
    const safe = ["DECISION_REQUIRED", "EVIDENCE_NOT_READY", "STALE_HANDLE", "RATE_LIMITED", "INPUT_TOO_LARGE"].includes(code)
      ? code
      : "HUMAN_ACTION_REFUSED";
    const status = safe === "RATE_LIMITED" ? 429 : safe === "INPUT_TOO_LARGE" ? 413 : 409;
    return NextResponse.json({ ok: false, errorCode: safe }, { status });
  }
}
