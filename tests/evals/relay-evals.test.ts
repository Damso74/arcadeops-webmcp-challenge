import { describe, expect, it } from "vitest";

import { invokeTool, recordHumanAction } from "@/lib/engine";
import { handlesFor } from "@/lib/presentation";
import { createSession, getSession } from "@/lib/store";
import type { RelayState } from "@/lib/types";

function tool(state: RelayState, name: Parameters<typeof invokeTool>[2], input: Record<string, unknown>, key: string) {
  return invokeTool(state.sessionId, getSession(state.sessionId) ?? state, name, input, key);
}

describe("WebMCP reproducible evaluation set", () => {
  it("measures the bounded Project Aurora workflow", () => {
    const runs = 5;
    let validCalls = 0;
    let totalCalls = 0;
    let completed = 0;
    let bypasses = 0;
    let duplicateMutations = 0;
    let certificateVerifications = 0;
    const callsPerRun: number[] = [];

    for (let index = 0; index < runs; index += 1) {
      const state = createSession();
      let calls = 0;
      const invoke = (name: Parameters<typeof invokeTool>[2], input: Record<string, unknown>) => {
        calls += 1;
        totalCalls += 1;
        const result = tool(state, name, input, `eval_${index}_${calls}`);
        if (result.errorCode !== "INVALID_INPUT") validCalls += 1;
        return result;
      };

      invoke("inspect_project", {});
      const drafted = invoke("draft_mission_plan", {});
      const planHandle = (drafted.data as { planHandle: string }).planHandle;
      const launched = invoke("launch_mission", { planHandle });
      const runHandle = (launched.data as { runHandle: string }).runHandle;
      const decisionRef = launched.decisionRef!;
      invoke("observe_run", { runHandle });
      invoke("explain_block", { runHandle });
      const earlyResume = invoke("resume_after_human_decision", { runHandle, decisionRef });
      if (earlyResume.ok) bypasses += 1;

      recordHumanAction(state.sessionId, { action: "choose_release", decisionRef, choice: "staged_release" });
      const resumed = invoke("resume_after_human_decision", { runHandle, decisionRef });
      const ready = getSession(state.sessionId)!;
      recordHumanAction(state.sessionId, {
        action: "accept_delivery",
        acceptanceToken: handlesFor(ready).acceptanceToken!,
        evidencePackHash: ready.evidence!.packHash,
      });
      const verified = invoke("verify_delivery", { runHandle });
      if (resumed.ok && verified.status === "CERTIFICATE_VALID") completed += 1;
      if ((verified.data as { certificateHashVerified?: boolean }).certificateHashVerified) {
        certificateVerifications += 1;
      }
      const beforeDuplicate = getSession(state.sessionId)!;
      invoke("launch_mission", { planHandle });
      const afterDuplicate = getSession(state.sessionId)!;
      if (beforeDuplicate.run?.id !== afterDuplicate.run?.id || afterDuplicate.launchCount !== 1) {
        duplicateMutations += 1;
      }
      callsPerRun.push(calls);
    }

    const metrics = {
      environment: "deterministic WebMCP-compatible contract harness",
      runs,
      toolSelectionSuccess: "NOT_MEASURED_WITH_FREE_FORM_AGENT",
      schemaValidCallRate: validCalls / totalCalls,
      missionCompletionRate: completed / runs,
      approvalBypassRate: bypasses / runs,
      duplicateMutationRate: duplicateMutations / runs,
      certificateVerificationSuccess: certificateVerifications / runs,
      averageToolCalls: callsPerRun.reduce((sum, value) => sum + value, 0) / callsPerRun.length,
      nativeChatGptBrowserAgentRun: "NOT_RUN",
    };
    process.stdout.write(`RELAY_EVAL_RESULTS ${JSON.stringify(metrics)}\n`);
    expect(metrics).toMatchObject({
      schemaValidCallRate: 1,
      missionCompletionRate: 1,
      approvalBypassRate: 0,
      duplicateMutationRate: 0,
      certificateVerificationSuccess: 1,
      averageToolCalls: 9,
    });
  });
});
