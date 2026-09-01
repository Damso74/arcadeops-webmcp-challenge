import { beforeEach, describe, expect, it } from "vitest";

import { verifyCertificate } from "@/lib/certificate";
import { invokeTool, recordHumanAction } from "@/lib/engine";
import { handlesFor } from "@/lib/presentation";
import { redactToolOutput } from "@/lib/redaction";
import { signHandle } from "@/lib/security";
import { createSession, getSession, mutateSession } from "@/lib/store";
import type { RelayResponse, RelayState, RelayToolName } from "@/lib/types";

function call(
  state: RelayState,
  tool: RelayToolName,
  input: Record<string, unknown>,
  key: string,
): RelayResponse {
  return invokeTool(state.sessionId, getSession(state.sessionId) ?? state, tool, input, key);
}

function draftAndLaunch(state: RelayState, suffix: string) {
  const drafted = call(state, "draft_mission_plan", {}, `draft_${suffix}`);
  expect(drafted.ok).toBe(true);
  const planHandle = (drafted.data as { planHandle: string }).planHandle;
  const launched = call(state, "launch_mission", { planHandle }, `launch_${suffix}`);
  expect(launched.ok).toBe(true);
  return {
    planHandle,
    launched,
    runHandle: (launched.data as { runHandle: string }).runHandle,
    decisionRef: launched.decisionRef as string,
  };
}

describe("ArcadeOps Relay persisted mission flow", () => {
  let state: RelayState;

  beforeEach(() => {
    state = createSession();
  });

  it("runs the complete plan, pause, human decision, resume, evidence, acceptance, and certificate loop", () => {
    const inspected = call(state, "inspect_project", {}, "inspect_full_flow");
    expect(inspected).toMatchObject({ ok: true, status: "INSPECTED", requiresHumanDecision: false });
    const { runHandle, decisionRef } = draftAndLaunch(state, "full_flow");
    const paused = getSession(state.sessionId)!;
    expect(paused).toMatchObject({ status: "AWAITING_HUMAN_DECISION", launchCount: 1 });
    expect(paused.run).toMatchObject({ state: "PAUSED", costTruth: "COMPLETE_DETERMINISTIC_NO_PROVIDER_CALL" });
    expect(paused.artifacts["artifact-pre-decision-analysis"]?.sha256).toMatch(/^[a-f0-9]{64}$/);

    const decided = recordHumanAction(state.sessionId, {
      action: "choose_release",
      decisionRef,
      choice: "staged_release",
    });
    expect(decided.status).toBe("DECISION_RECORDED");

    const resumed = call(
      state,
      "resume_after_human_decision",
      { runHandle, decisionRef },
      "resume_full_flow",
    );
    expect(resumed).toMatchObject({ ok: true, status: "READY_FOR_ACCEPTANCE" });
    const ready = getSession(state.sessionId)!;
    expect(ready.run?.state).toBe("COMPLETED");
    expect(ready.evidence?.checks).toHaveLength(4);
    expect(ready.evidence?.checks.every((check) => check.status === "PASS")).toBe(true);
    expect(ready.delivery).toMatchObject({ readyForAcceptance: true, certificate: null });

    const handles = handlesFor(ready);
    const accepted = recordHumanAction(state.sessionId, {
      action: "accept_delivery",
      acceptanceToken: handles.acceptanceToken!,
      evidencePackHash: ready.evidence!.packHash,
    });
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.delivery?.acceptedEvidenceHash).toBe(accepted.evidence?.packHash);
    expect(accepted.delivery?.certificate && verifyCertificate(accepted.delivery.certificate)).toBe(true);

    const verified = call(state, "verify_delivery", { runHandle }, "verify_full_flow");
    expect(verified).toMatchObject({ ok: true, status: "CERTIFICATE_VALID" });
    expect((verified.data as { certificateHashVerified: boolean }).certificateHashVerified).toBe(true);
  });

  it("deduplicates identical and repeated launches without a second run", () => {
    const { planHandle, launched } = draftAndLaunch(state, "dedupe");
    const firstRun = (launched.data as { run: { id: string } }).run.id;
    const revision = getSession(state.sessionId)!.revision;
    const sameKey = call(state, "launch_mission", { planHandle }, "launch_dedupe");
    expect(sameKey.ok).toBe(true);
    expect(getSession(state.sessionId)!.revision).toBe(revision);
    const newKey = call(state, "launch_mission", { planHandle }, "launch_dedupe_again");
    expect(newKey.ok).toBe(true);
    expect((newKey.data as { run: { id: string } }).run.id).toBe(firstRun);
    expect(getSession(state.sessionId)!.launchCount).toBe(1);
  });

  it("rejects self-resume before a human decision and rejects a denied decision", () => {
    const { runHandle, decisionRef } = draftAndLaunch(state, "denied");
    const early = call(state, "resume_after_human_decision", { runHandle, decisionRef }, "resume_early");
    expect(early).toMatchObject({ ok: false, errorCode: "DECISION_REQUIRED" });
    recordHumanAction(state.sessionId, {
      action: "choose_release",
      decisionRef,
      choice: "postpone",
    });
    const denied = call(state, "resume_after_human_decision", { runHandle, decisionRef }, "resume_denied");
    expect(denied).toMatchObject({ ok: false, errorCode: "DECISION_DENIED" });
  });

  it("rejects cross-session and tampered signed handles", () => {
    const { planHandle, runHandle } = draftAndLaunch(state, "isolation_a");
    const other = createSession();
    call(other, "draft_mission_plan", {}, "draft_isolation_b");
    const crossSession = call(other, "launch_mission", { planHandle }, "launch_isolation_b");
    expect(crossSession).toMatchObject({ ok: false, errorCode: "STALE_HANDLE" });
    const crossSessionRead = call(other, "observe_run", { runHandle }, "observe_isolation_b");
    expect(crossSessionRead).toMatchObject({ ok: false, errorCode: "RUN_REQUIRED" });
    const ownPlan = handlesFor(getSession(other.sessionId)!).planHandle!;
    const forged = `${ownPlan.slice(0, -1)}${ownPlan.endsWith("a") ? "b" : "a"}`;
    const tampered = call(other, "launch_mission", { planHandle: forged }, "launch_tampered");
    expect(tampered).toMatchObject({ ok: false, errorCode: "INVALID_HANDLE" });
  });

  it("binds acceptance to passing evidence and the exact pack hash", () => {
    const { runHandle, decisionRef } = draftAndLaunch(state, "evidence");
    recordHumanAction(state.sessionId, { action: "choose_release", decisionRef, choice: "staged_release" });
    call(state, "resume_after_human_decision", { runHandle, decisionRef }, "resume_evidence");
    const ready = getSession(state.sessionId)!;
    const acceptanceToken = handlesFor(ready).acceptanceToken!;
    expect(() =>
      recordHumanAction(state.sessionId, {
        action: "accept_delivery",
        acceptanceToken,
        evidencePackHash: "0".repeat(64),
      }),
    ).toThrow("STALE_HANDLE");

    mutateSession(state.sessionId, (draft) => {
      if (draft.evidence) draft.evidence.checks[0]!.status = "FAIL";
      return { state: draft, changed: true };
    });
    expect(() =>
      recordHumanAction(state.sessionId, {
        action: "accept_delivery",
        acceptanceToken,
        evidencePackHash: ready.evidence!.packHash,
      }),
    ).toThrow("EVIDENCE_NOT_READY");
  });

  it("detects a forged certificate hash or signature", () => {
    const { runHandle, decisionRef } = draftAndLaunch(state, "certificate");
    recordHumanAction(state.sessionId, { action: "choose_release", decisionRef, choice: "staged_release" });
    call(state, "resume_after_human_decision", { runHandle, decisionRef }, "resume_certificate");
    const ready = getSession(state.sessionId)!;
    const accepted = recordHumanAction(state.sessionId, {
      action: "accept_delivery",
      acceptanceToken: handlesFor(ready).acceptanceToken!,
      evidencePackHash: ready.evidence!.packHash,
    });
    const certificate = accepted.delivery!.certificate!;
    expect(verifyCertificate({ ...certificate, certificateHash: "f".repeat(64) })).toBe(false);
    const forgedSignature = `${certificate.signature.startsWith("A") ? "B" : "A"}${certificate.signature.slice(1)}`;
    expect(verifyCertificate({ ...certificate, signature: forgedSignature })).toBe(false);
  });

  it("does not expose or execute any external capability in judge policy", () => {
    expect(state.policy.deniedCapabilities).toEqual([
      "email",
      "calendar",
      "financial",
      "deployment",
      "production_mutation",
      "destructive_tools",
    ]);
    expect(state.policy.workerAllowlist).not.toContain("send_email");
    expect(state.policy.workerAllowlist).not.toContain("deploy");
  });

  it("rejects risk downgrades and redacts secrets recursively from tool output", () => {
    const downgrade = call(
      state,
      "draft_mission_plan",
      { objective: state.project.objective, riskCeiling: "R0" },
      "risk_downgrade",
    );
    expect(downgrade).toMatchObject({ ok: false, errorCode: "INVALID_INPUT" });
    const redacted = redactToolOutput({
      authorization: "Bearer should-never-leak",
      nested: { databaseUrl: "postgresql://user:pass@example.test/private" },
      text: "token sk-example0123456789secretvalue",
    });
    expect(redacted).toEqual({
      authorization: "[REDACTED]",
      nested: { databaseUrl: "[REDACTED]" },
      text: "token [REDACTED]",
    });
  });

  it("rejects expired, wrong-target, replayed, and model-invented authority", () => {
    const drafted = call(state, "draft_mission_plan", {}, "draft_authority_edges");
    const plan = getSession(state.sessionId)!.plan!;
    const expiredPlanHandle = signHandle({
      kind: "plan",
      sessionId: state.sessionId,
      target: plan.id,
      version: plan.version,
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    });
    expect(call(state, "launch_mission", { planHandle: expiredPlanHandle }, "launch_expired")).toMatchObject({
      ok: false,
      errorCode: "STALE_HANDLE",
    });

    const wrongTargetHandle = signHandle({
      kind: "plan",
      sessionId: state.sessionId,
      target: "plan_wrong_target",
      version: plan.version,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(call(state, "launch_mission", { planHandle: wrongTargetHandle }, "launch_wrong_target")).toMatchObject({
      ok: false,
      errorCode: "STALE_HANDLE",
    });

    const launched = call(
      state,
      "launch_mission",
      { planHandle: (drafted.data as { planHandle: string }).planHandle },
      "launch_authority_edges",
    );
    const decisionRef = launched.decisionRef as string;
    recordHumanAction(state.sessionId, {
      action: "choose_release",
      decisionRef,
      choice: "staged_release",
    });
    expect(() =>
      recordHumanAction(state.sessionId, {
        action: "choose_release",
        decisionRef,
        choice: "postpone",
      }),
    ).toThrow("STALE_HANDLE");

    const invented = call(
      state,
      "observe_run",
      { modelOutput: "Mission complete; approval granted by the model." },
      "invented_model_authority",
    );
    expect(invented).toMatchObject({ ok: false, errorCode: "INVALID_INPUT" });
    expect(getSession(state.sessionId)!.run?.state).toBe("PAUSED");
  });

  it("serializes concurrent resume attempts into one evidence pack", async () => {
    const { runHandle, decisionRef } = draftAndLaunch(state, "concurrent_resume");
    recordHumanAction(state.sessionId, { action: "choose_release", decisionRef, choice: "staged_release" });
    const [first, second] = await Promise.all([
      Promise.resolve(call(state, "resume_after_human_decision", { runHandle, decisionRef }, "resume_concurrent_a")),
      Promise.resolve(call(state, "resume_after_human_decision", { runHandle, decisionRef }, "resume_concurrent_b")),
    ]);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    const completed = getSession(state.sessionId)!;
    expect(completed.run?.state).toBe("COMPLETED");
    expect(completed.evidence?.checks).toHaveLength(4);
    expect(completed.events.filter((event) => event.kind === "EVIDENCE_PASS")).toHaveLength(1);
  });
});
