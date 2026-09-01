import { NextRequest, NextResponse } from "next/server";

import {
  attachSessionCookie,
  getOrCreateSession,
  requireSameOriginMutation,
  sessionFromRequest,
} from "@/lib/http-session";
import { sessionView } from "@/lib/presentation";
import { createSession, deleteSession } from "@/lib/store";

export const dynamic = "force-dynamic";

function json(state: ReturnType<typeof createSession>, created = false) {
  const response = NextResponse.json({ ok: true, created, session: sessionView(state) });
  response.headers.set("Cache-Control", "no-store");
  attachSessionCookie(response, state);
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const { state, created } = getOrCreateSession(request);
    return json(state, created);
  } catch {
    return NextResponse.json({ ok: false, errorCode: "SESSION_UNAVAILABLE" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOriginMutation(request);
    const current = sessionFromRequest(request);
    if (current) deleteSession(current.sessionId);
    return json(createSession(), true);
  } catch {
    return NextResponse.json({ ok: false, errorCode: "RESET_REFUSED" }, { status: 403 });
  }
}
