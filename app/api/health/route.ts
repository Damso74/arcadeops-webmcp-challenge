import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, service: "arcadeops-relay", contract: "arcadeops.relay.v1" });
}
