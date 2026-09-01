import "server-only";

import { signHandle } from "@/lib/security";
import type { RelayState } from "@/lib/types";

function handle(
  state: RelayState,
  kind: "plan" | "run" | "decision" | "acceptance",
  target: string,
  version: number,
): string {
  return signHandle({ kind, sessionId: state.sessionId, target, version, expiresAt: state.expiresAt });
}

export function handlesFor(state: RelayState) {
  return {
    planHandle: state.plan ? handle(state, "plan", state.plan.id, state.plan.version) : null,
    runHandle: state.run ? handle(state, "run", state.run.id, state.plan?.version ?? 1) : null,
    decisionRef: state.decision
      ? handle(state, "decision", state.decision.id, state.decision.stateRevision)
      : null,
    acceptanceToken: state.evidence
      ? handle(state, "acceptance", state.evidence.packHash, state.evidence.packVersion)
      : null,
  };
}

export function sessionView(state: RelayState) {
  const { idempotency: _idempotency, sessionId: _sessionId, ...safeState } = state;
  void _idempotency;
  void _sessionId;
  return { ...safeState, ...handlesFor(state) };
}
