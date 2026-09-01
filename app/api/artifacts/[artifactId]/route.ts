import { NextRequest, NextResponse } from "next/server";

import { sessionFromRequest } from "@/lib/http-session";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ artifactId: string }> },
) {
  const state = sessionFromRequest(request);
  if (!state) return NextResponse.json({ ok: false, errorCode: "SESSION_REQUIRED" }, { status: 401 });
  const { artifactId } = await context.params;
  const artifact = state.artifacts[artifactId];
  if (!artifact) return NextResponse.json({ ok: false, errorCode: "NOT_FOUND" }, { status: 404 });
  return new NextResponse(artifact.content, {
    headers: {
      "Content-Type": `${artifact.mediaType}; charset=utf-8`,
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${artifact.name.replaceAll('"', "")}"`,
      "X-Content-SHA256": artifact.sha256,
    },
  });
}
