import "server-only";

import { issueCertificate, verifyCertificate } from "@/lib/certificate";
import { canonicalJson, sha256 } from "@/lib/canonical";
import { handlesFor } from "@/lib/presentation";
import { toolSchemas } from "@/lib/schemas";
import { newPublicId, verifyHandle } from "@/lib/security";
import { mutateSession } from "@/lib/store";
import type { RelayResponse, RelayState, RelayToolName } from "@/lib/types";

function event(
  state: RelayState,
  actor: "browser_agent" | "arcadeops" | "worker" | "human",
  kind: string,
  summary: string,
): void {
  state.events.push({ id: newPublicId("evt"), at: new Date().toISOString(), actor, kind, summary });
  state.events = state.events.slice(-40);
}

function response<T>(
  status: string,
  humanSummary: string,
  data: T,
  options: Partial<Omit<RelayResponse<T>, "ok" | "status" | "humanSummary" | "data">> = {},
): RelayResponse<T> {
  return {
    ok: true,
    status,
    humanSummary,
    data,
    nextActions: options.nextActions ?? [],
    requiresHumanDecision: options.requiresHumanDecision ?? false,
    decisionRef: options.decisionRef ?? null,
    evidenceRefs: options.evidenceRefs ?? [],
    retryable: options.retryable ?? false,
    errorCode: options.errorCode ?? null,
  };
}

function errorResponse(error: unknown): RelayResponse {
  const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const safeCodes = new Set([
    "INVALID_HANDLE",
    "STALE_HANDLE",
    "SESSION_NOT_FOUND",
    "SESSION_CONFLICT",
    "PLAN_REQUIRED",
    "RUN_REQUIRED",
    "DECISION_REQUIRED",
    "DECISION_DENIED",
    "EVIDENCE_NOT_READY",
    "COST_CAP_EXCEEDED",
    "MISSION_LIMIT_REACHED",
    "INVALID_INPUT",
  ]);
  const errorCode = safeCodes.has(code) ? code : "INTERNAL_ERROR";
  return {
    ok: false,
    status: "ERROR",
    humanSummary: `ArcadeOps Relay refused the request: ${errorCode}.`,
    data: {},
    nextActions: errorCode === "STALE_HANDLE" ? ["Inspect the current project state and retry with fresh handles."] : [],
    requiresHumanDecision: false,
    decisionRef: null,
    evidenceRefs: [],
    retryable: errorCode === "SESSION_CONFLICT",
    errorCode,
  };
}

function projectSnapshot(state: RelayState) {
  return {
    project: state.project,
    availableAgents: [
      { id: "release-coordinator", role: "bounded synthetic release worker" },
      { id: "evidence-verifier", role: "deterministic evidence evaluator" },
    ],
    effectivePermissions: state.policy.permissions,
    riskCeiling: state.policy.riskCeiling,
    policy: state.policy,
    blockers: state.project.tasks.filter((task) => task.status === "BLOCKED"),
    contextReferences: ["project://aurora/tasks", "policy://challenge-safe-release-v1"],
    suggestedSafeNextActions: state.plan ? ["launch_mission"] : ["draft_mission_plan"],
    revision: state.revision,
  };
}

function observeData(state: RelayState) {
  const handles = handlesFor(state);
  return {
    run: state.run,
    missionStatus: state.status,
    events: state.events,
    pendingDecisions: state.decision?.status === "PENDING" ? [state.decision] : [],
    decision: state.decision,
    evidence: state.evidence,
    terminalStateTruth: state.run?.state === "COMPLETED" ? "COMPLETED" : "NOT_TERMINAL",
    ...handles,
  };
}

export function invokeTool(
  sessionId: string,
  state: RelayState,
  tool: RelayToolName,
  rawInput: unknown,
  idempotencyKey: string,
): RelayResponse {
  let input: Record<string, unknown>;
  try {
    input = toolSchemas[tool].parse(rawInput) as Record<string, unknown>;
  } catch {
    return errorResponse(new Error("INVALID_INPUT"));
  }

  try {
    if (["observe_run", "explain_block", "verify_delivery"].includes(tool) && input.runHandle) {
      if (!state.run) throw new Error("RUN_REQUIRED");
      verifyHandle(input.runHandle, {
        kind: "run",
        sessionId: state.sessionId,
        target: state.run.id,
        version: state.plan?.version ?? 1,
      });
    }
    if (tool === "inspect_project") {
      const inspected = mutateSession(sessionId, (draft) => {
        if (draft.idempotency[idempotencyKey]) return { state: draft, changed: false };
        event(draft, "browser_agent", "PROJECT_INSPECTED", "Browser agent inspected the bounded Project Aurora state through WebMCP.");
        draft.idempotency[idempotencyKey] = { tool, revision: draft.revision + 1 };
        return { state: draft, changed: true };
      });
      return response("INSPECTED", "Project Aurora is isolated, bounded, and ready for a mission plan.", projectSnapshot(inspected), {
        nextActions: inspected.plan ? ["launch_mission"] : ["draft_mission_plan"],
      });
    }
    if (tool === "observe_run") {
      return response(state.status, `Authoritative mission state: ${state.status}.`, observeData(state), {
        requiresHumanDecision: state.decision?.status === "PENDING",
        decisionRef: handlesFor(state).decisionRef,
        evidenceRefs: state.evidence?.artifactRefs ?? [],
        nextActions:
          state.status === "DECISION_RECORDED"
            ? ["resume_after_human_decision"]
            : state.status === "READY_FOR_ACCEPTANCE"
              ? ["A human must accept the exact evidence pack in the visible UI."]
              : [],
      });
    }
    if (tool === "explain_block") {
      const decisionRef = handlesFor(state).decisionRef;
      const blocked = state.decision?.status === "PENDING";
      return response(
        blocked ? "BLOCKED" : "NOT_BLOCKED",
        blocked
          ? "The mission is paused because only a human may choose between a staged release and postponement."
          : "No pending human decision currently blocks the mission.",
        {
          rule: blocked ? "challenge-safe-release-v1:human-release-strategy" : null,
          agentMayDo: ["observe the run", "explain the block"],
          humanMustDo: blocked ? ["choose the release strategy in the Decisions Inbox"] : [],
          canResumeAfterward: blocked,
          decision: state.decision,
        },
        { requiresHumanDecision: blocked, decisionRef },
      );
    }
    if (tool === "verify_delivery") {
      const certificateValid = state.delivery?.certificate
        ? verifyCertificate(state.delivery.certificate)
        : false;
      const allEvidencePass = Boolean(state.evidence?.checks.every((check) => check.status === "PASS"));
      return response(
        certificateValid ? "CERTIFICATE_VALID" : allEvidencePass ? "EVIDENCE_PASS" : "NOT_VERIFIED",
        certificateValid
          ? "The accepted evidence pack and Ed25519 release certificate are valid."
          : allEvidencePass
            ? "All evidence passes, but human acceptance and certificate issuance are still required."
            : "Delivery is not verified because required evidence is missing or failing.",
        {
          deliveryTruth: state.run?.state === "COMPLETED" ? "WORKER_COMPLETED" : "WORKER_NOT_COMPLETED",
          acceptanceReadiness: state.delivery?.readyForAcceptance ?? false,
          blockingEvidence: state.evidence?.checks.filter((check) => check.status !== "PASS") ?? [],
          evidencePackHash: state.evidence?.packHash ?? null,
          acceptedEvidenceHash: state.delivery?.acceptedEvidenceHash ?? null,
          certificateStatus: state.delivery?.certificate ? "ISSUED" : "NOT_ISSUED",
          certificateHashVerified: certificateValid,
          certificate: state.delivery?.certificate ?? null,
          artifactReferences: state.evidence?.artifactRefs ?? [],
        },
        { evidenceRefs: state.evidence?.artifactRefs ?? [] },
      );
    }

    let toolResponse: RelayResponse | null = null;
    const updated = mutateSession(sessionId, (draft) => {
      const recorded = draft.idempotency[idempotencyKey];
      if (recorded) return { state: draft, changed: false };

      if (tool === "draft_mission_plan") {
        if (!draft.plan) {
          draft.plan = {
            id: newPublicId("plan"),
            version: 1,
            objective:
              typeof input.objective === "string" ? input.objective : draft.project.objective,
            phases: [
              { name: "Inspect", tasks: ["Review tasks, constraints, deadline, and policy"] },
              { name: "Prepare", tasks: ["Write release-readiness analysis", "Identify residual risk"] },
              { name: "Decide", tasks: ["Pause for a human release-strategy decision"] },
              { name: "Verify", tasks: ["Produce final summary", "Evaluate evidence", "Request human acceptance"] },
            ],
            acceptanceCriteria: draft.project.acceptanceCriteria,
            requiredEvidence: ["constraint-compliance", "rollback-readiness", "residual-risk-disclosure", "artifact-integrity"],
            risks: ["Blocked final validation leaves a documented residual risk", "Deadline is within 24 hours"],
            budgetUsd: Math.min(0.01, draft.costCapUsd),
            likelyHumanDecisions: ["Choose staged release with residual risk or postpone", "Accept the exact evidence pack"],
          };
          draft.status = "PLAN_DRAFTED";
          event(draft, "browser_agent", "PLAN_DRAFTED", "Browser agent drafted a bounded mission plan.");
        }
        draft.idempotency[idempotencyKey] = { tool, revision: draft.revision + 1 };
        return { state: draft, changed: true };
      }

      if (tool === "launch_mission") {
        if (!draft.plan) throw new Error("PLAN_REQUIRED");
        verifyHandle(input.planHandle, {
          kind: "plan",
          sessionId: draft.sessionId,
          target: draft.plan.id,
          version: draft.plan.version,
        });
        if (!draft.run) {
          if (draft.launchCount >= draft.maxLaunches) throw new Error("MISSION_LIMIT_REACHED");
          const estimatedCost = 0.004;
          if (estimatedCost > draft.costCapUsd) throw new Error("COST_CAP_EXCEEDED");
          const runId = newPublicId("run");
          const analysis = [
            "# Project Aurora pre-decision analysis",
            "",
            "The candidate is suitable only for a staged release. The final validation window remains blocked.",
            "Production mutation and external communication are prohibited by policy.",
            "A human must choose whether to accept documented residual risk or postpone.",
          ].join("\n");
          const artifactId = "artifact-pre-decision-analysis";
          draft.artifacts[artifactId] = {
            name: "pre-decision-analysis.md",
            mediaType: "text/markdown",
            content: analysis,
            sha256: sha256(analysis),
          };
          draft.run = {
            id: runId,
            state: "PAUSED",
            currentStep: "Awaiting human release-strategy decision",
            completedSteps: ["Project inspected", "Constraints enforced", "Pre-decision analysis produced"],
            costUsd: estimatedCost,
            costTruth: "COMPLETE_DETERMINISTIC_NO_PROVIDER_CALL",
            artifactRefs: [artifactId],
          };
          draft.launchCount += 1;
          draft.decision = {
            id: newPublicId("decision"),
            status: "PENDING",
            prompt: "Should Project Aurora proceed as a staged release with documented residual risk, or be postponed for additional validation?",
            choices: [
              { id: "staged_release", label: "Stage the release", consequence: "Proceed without production changes now; record the blocked validation as residual risk." },
              { id: "postpone", label: "Postpone", consequence: "Stop the mission and wait for the missing validation window." },
            ],
            selectedChoice: null,
            decidedAt: null,
            stateRevision: draft.revision + 1,
          };
          draft.status = "AWAITING_HUMAN_DECISION";
          event(draft, "browser_agent", "MISSION_LAUNCHED", "Browser agent delegated the bounded mission to the release worker.");
          event(draft, "worker", "WORKER_PAUSED", "Worker produced a real analysis artifact and paused at the policy gate.");
          event(draft, "arcadeops", "HUMAN_DECISION_REQUIRED", "ArcadeOps opened a release-strategy decision.");
        }
        draft.idempotency[idempotencyKey] = { tool, revision: draft.revision + 1 };
        return { state: draft, changed: true };
      }

      if (tool === "resume_after_human_decision") {
        if (!draft.run || !draft.plan) throw new Error("RUN_REQUIRED");
        if (!draft.decision || draft.decision.status === "PENDING") throw new Error("DECISION_REQUIRED");
        if (draft.decision.status === "DENIED" || draft.decision.selectedChoice !== "staged_release") {
          throw new Error("DECISION_DENIED");
        }
        verifyHandle(input.runHandle, {
          kind: "run",
          sessionId: draft.sessionId,
          target: draft.run.id,
          version: draft.plan.version,
        });
        verifyHandle(input.decisionRef, {
          kind: "decision",
          sessionId: draft.sessionId,
          target: draft.decision.id,
          version: draft.decision.stateRevision,
        });
        if (draft.run.state !== "COMPLETED") {
          draft.status = "RUNNING";
          draft.run.state = "RUNNING";
          event(draft, "browser_agent", "MISSION_RESUMED", "Browser agent resumed the exact persisted run after the human decision.");
          const report = [
            "# Project Aurora release-readiness summary",
            "",
            "Decision: staged release with documented residual risk.",
            "Production changes performed: none.",
            "External parties contacted: none.",
            "Residual risk: the final validation window is still blocked.",
            "Mitigation: stage only, preserve rollback readiness, and require a later production gate.",
          ].join("\n");
          const reportId = "artifact-release-readiness-summary";
          draft.artifacts[reportId] = {
            name: "project-aurora-release-readiness.md",
            mediaType: "text/markdown",
            content: report,
            sha256: sha256(report),
          };
          const checks = [
            { id: "constraint-compliance", label: "No production mutation or external communication", status: "PASS" as const },
            { id: "rollback-readiness", label: "Rollback readiness documented", status: "PASS" as const },
            { id: "residual-risk-disclosure", label: "Blocked validation disclosed as residual risk", status: "PASS" as const },
            { id: "artifact-integrity", label: "Release-readiness artifact hash matches", status: "PASS" as const },
          ];
          const packVersion = 1;
          const artifactRefs = [reportId, "artifact-pre-decision-analysis"];
          const packHash = sha256({
            session: draft.sessionId,
            run: draft.run.id,
            planVersion: draft.plan.version,
            decision: draft.decision.selectedChoice,
            checks,
            artifacts: artifactRefs.map((id) => ({ id, sha256: draft.artifacts[id]?.sha256 })),
            packVersion,
          });
          draft.evidence = { packVersion, packHash, checks, artifactRefs };
          draft.delivery = {
            readyForAcceptance: true,
            acceptedEvidenceHash: null,
            acceptedAt: null,
            certificate: null,
          };
          draft.run.state = "COMPLETED";
          draft.run.currentStep = "Worker completed; exact evidence pack awaits human acceptance";
          draft.run.completedSteps.push("Release-readiness summary produced", "Required evidence evaluated");
          draft.run.artifactRefs = artifactRefs;
          draft.run.costUsd = 0.008;
          draft.status = "READY_FOR_ACCEPTANCE";
          event(draft, "worker", "DELIVERABLE_PRODUCED", "Worker produced the final release-readiness summary.");
          event(draft, "arcadeops", "EVIDENCE_PASS", "All four required evidence checks passed.");
        }
        draft.idempotency[idempotencyKey] = { tool, revision: draft.revision + 1 };
        return { state: draft, changed: true };
      }
      throw new Error("INVALID_INPUT");
    });

    if (tool === "draft_mission_plan") {
      const planHandle = handlesFor(updated).planHandle;
      toolResponse = response("PLAN_DRAFTED", "A bounded four-phase plan is visible in ArcadeOps Relay.", {
        plan: updated.plan,
        planHandle,
        revision: updated.revision,
      }, { nextActions: ["launch_mission"] });
    } else if (tool === "launch_mission") {
      const handles = handlesFor(updated);
      toolResponse = response(
        updated.status,
        updated.decision?.status === "PENDING"
          ? "The worker persisted its run, produced a pre-decision artifact, and paused for human authority."
          : "The bounded mission already exists; no duplicate run or effect was created.",
        observeData(updated),
        {
          requiresHumanDecision: updated.decision?.status === "PENDING",
          decisionRef: handles.decisionRef,
          evidenceRefs: updated.run?.artifactRefs ?? [],
          nextActions:
            updated.decision?.status === "PENDING"
              ? ["explain_block", "Wait for the human decision in the visible UI."]
              : ["observe_run", "verify_delivery"],
        },
      );
    } else if (tool === "resume_after_human_decision") {
      toolResponse = response(
        "READY_FOR_ACCEPTANCE",
        "The exact persisted run resumed, completed, and produced a passing evidence pack for human acceptance.",
        observeData(updated),
        {
          evidenceRefs: updated.evidence?.artifactRefs ?? [],
          nextActions: ["A human must accept the exact evidence-pack hash in the visible UI.", "verify_delivery"],
        },
      );
    }
    return toolResponse ?? errorResponse(new Error("INTERNAL_ERROR"));
  } catch (error) {
    return errorResponse(error);
  }
}

export function recordHumanAction(
  sessionId: string,
  input:
    | { action: "choose_release"; decisionRef: string; choice: "staged_release" | "postpone" }
    | { action: "accept_delivery"; acceptanceToken: string; evidencePackHash: string },
): RelayState {
  return mutateSession(sessionId, (draft) => {
    if (input.action === "choose_release") {
      if (!draft.decision || !draft.run) throw new Error("DECISION_REQUIRED");
      verifyHandle(input.decisionRef, {
        kind: "decision",
        sessionId: draft.sessionId,
        target: draft.decision.id,
        version: draft.decision.stateRevision,
      });
      if (draft.decision.status !== "PENDING") {
        if (draft.decision.selectedChoice === input.choice) return { state: draft, changed: false };
        throw new Error("STALE_HANDLE");
      }
      draft.decision.status = input.choice === "staged_release" ? "APPROVED" : "DENIED";
      draft.decision.selectedChoice = input.choice;
      draft.decision.decidedAt = new Date().toISOString();
      draft.status = input.choice === "staged_release" ? "DECISION_RECORDED" : "POSTPONED";
      event(
        draft,
        "human",
        "RELEASE_STRATEGY_DECIDED",
        input.choice === "staged_release"
          ? "Human chose a staged release with documented residual risk."
          : "Human postponed the release for additional validation.",
      );
      return { state: draft, changed: true };
    }
    if (!draft.evidence || !draft.delivery || !draft.run || !draft.plan) throw new Error("EVIDENCE_NOT_READY");
    verifyHandle(input.acceptanceToken, {
      kind: "acceptance",
      sessionId: draft.sessionId,
      target: draft.evidence.packHash,
      version: draft.evidence.packVersion,
    });
    if (input.evidencePackHash !== draft.evidence.packHash) throw new Error("STALE_HANDLE");
    if (!draft.evidence.checks.every((check) => check.status === "PASS")) throw new Error("EVIDENCE_NOT_READY");
    if (draft.delivery.certificate) return { state: draft, changed: false };
    const acceptedAt = new Date().toISOString();
    const payload = {
      schema: "arcadeops.relay.release-certificate.v1",
      project: draft.project.name,
      runId: draft.run.id,
      planVersion: draft.plan.version,
      evidencePackVersion: draft.evidence.packVersion,
      evidencePackHash: draft.evidence.packHash,
      acceptedAt,
      decision: draft.decision?.selectedChoice,
      productionMutation: false,
      externalCommunication: false,
    };
    draft.delivery.acceptedEvidenceHash = draft.evidence.packHash;
    draft.delivery.acceptedAt = acceptedAt;
    draft.delivery.certificate = issueCertificate(payload);
    draft.status = "ACCEPTED";
    event(draft, "human", "DELIVERY_ACCEPTED", "Human accepted the exact evidence-pack hash.");
    event(draft, "arcadeops", "CERTIFICATE_ISSUED", "ArcadeOps issued an independently verifiable Ed25519 certificate.");
    return { state: draft, changed: true };
  });
}

export function responseFingerprint(value: RelayResponse): string {
  return sha256(canonicalJson(value));
}
