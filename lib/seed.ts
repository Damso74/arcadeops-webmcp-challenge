import { relayConfig } from "@/lib/config";
import type { RelayState } from "@/lib/types";

export function createInitialState(sessionId: string, now = new Date()): RelayState {
  const config = relayConfig();
  const expiresAt = new Date(now.getTime() + config.sessionTtlMinutes * 60_000).toISOString();
  const deadline = new Date(now.getTime() + 24 * 60 * 60_000).toISOString();
  return {
    schemaVersion: 1,
    sessionId,
    createdAt: now.toISOString(),
    expiresAt,
    revision: 0,
    status: "READY",
    launchCount: 0,
    maxLaunches: config.maxMissionsPerSession,
    costCapUsd: config.maxCostUsd,
    idempotency: {},
    project: {
      id: "project-aurora",
      name: "Project Aurora",
      objective: "Prepare Project Aurora for a safe staged release tomorrow without modifying production or contacting external parties.",
      deadline,
      constraints: [
        "Do not modify production.",
        "Do not contact external parties.",
        "Stay within the strict mission cost cap.",
        "A human must choose the release strategy and accept the exact evidence pack.",
      ],
      acceptanceCriteria: [
        "Release-readiness summary exists.",
        "Residual risks are explicit.",
        "All required evidence checks pass.",
        "Certificate binds the accepted evidence-pack hash.",
      ],
      tasks: [
        { id: "aurora-task-1", title: "Build candidate assembled", status: "COMPLETED" },
        { id: "aurora-task-2", title: "Rollback procedure rehearsed", status: "COMPLETED" },
        { id: "aurora-task-3", title: "Security review completed", status: "COMPLETED" },
        { id: "aurora-task-4", title: "Final validation window", status: "BLOCKED" },
      ],
    },
    policy: {
      id: "challenge-safe-release-v1",
      riskCeiling: "R3",
      permissions: ["project:read", "plan:draft", "mission:launch_bounded", "run:read", "delivery:verify"],
      deniedCapabilities: ["email", "calendar", "financial", "deployment", "production_mutation", "destructive_tools"],
      workerAllowlist: ["inspect_synthetic_project", "analyze_release_readiness", "write_internal_artifact", "evaluate_evidence"],
    },
    plan: null,
    run: null,
    decision: null,
    evidence: null,
    delivery: null,
    artifacts: {},
    events: [
      {
        id: "evt_seeded",
        at: now.toISOString(),
        actor: "arcadeops",
        kind: "SESSION_CREATED",
        summary: "Fresh isolated Project Aurora judge workspace created.",
      },
    ],
  };
}
