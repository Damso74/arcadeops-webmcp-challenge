export const RELAY_TOOL_NAMES = [
  "inspect_project",
  "draft_mission_plan",
  "launch_mission",
  "observe_run",
  "explain_block",
  "resume_after_human_decision",
  "verify_delivery",
] as const;

export type RelayToolName = (typeof RELAY_TOOL_NAMES)[number];

export type RelayStatus =
  | "READY"
  | "PLAN_DRAFTED"
  | "AWAITING_HUMAN_DECISION"
  | "DECISION_RECORDED"
  | "RUNNING"
  | "READY_FOR_ACCEPTANCE"
  | "POSTPONED"
  | "ACCEPTED";

export type RelayResponse<T = Record<string, unknown>> = {
  ok: boolean;
  status: string;
  humanSummary: string;
  data: T;
  nextActions: string[];
  requiresHumanDecision: boolean;
  decisionRef: string | null;
  evidenceRefs: string[];
  retryable: boolean;
  errorCode: string | null;
};

export type RelayEvent = {
  id: string;
  at: string;
  actor: "browser_agent" | "arcadeops" | "worker" | "human";
  kind: string;
  summary: string;
};

export type RelayState = {
  schemaVersion: 1;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  revision: number;
  status: RelayStatus;
  launchCount: number;
  maxLaunches: number;
  costCapUsd: number;
  idempotency: Record<string, { tool: string; revision: number }>;
  project: {
    id: "project-aurora";
    name: "Project Aurora";
    objective: string;
    deadline: string;
    constraints: string[];
    acceptanceCriteria: string[];
    tasks: Array<{ id: string; title: string; status: "COMPLETED" | "BLOCKED" }>;
  };
  policy: {
    id: "challenge-safe-release-v1";
    riskCeiling: "R3";
    permissions: string[];
    deniedCapabilities: string[];
    workerAllowlist: string[];
  };
  plan: null | {
    id: string;
    version: number;
    objective: string;
    phases: Array<{ name: string; tasks: string[] }>;
    acceptanceCriteria: string[];
    requiredEvidence: string[];
    risks: string[];
    budgetUsd: number;
    likelyHumanDecisions: string[];
  };
  run: null | {
    id: string;
    state: "PAUSED" | "RUNNING" | "COMPLETED";
    currentStep: string;
    completedSteps: string[];
    costUsd: number;
    costTruth: "COMPLETE_DETERMINISTIC_NO_PROVIDER_CALL";
    artifactRefs: string[];
  };
  decision: null | {
    id: string;
    status: "PENDING" | "APPROVED" | "DENIED";
    prompt: string;
    choices: Array<{ id: "staged_release" | "postpone"; label: string; consequence: string }>;
    selectedChoice: "staged_release" | "postpone" | null;
    decidedAt: string | null;
    stateRevision: number;
  };
  evidence: null | {
    packVersion: number;
    packHash: string;
    checks: Array<{ id: string; label: string; status: "PASS" | "FAIL" }>;
    artifactRefs: string[];
  };
  delivery: null | {
    readyForAcceptance: boolean;
    acceptedEvidenceHash: string | null;
    acceptedAt: string | null;
    certificate: null | {
      payload: Record<string, unknown>;
      signature: string;
      publicKey: string;
      certificateHash: string;
    };
  };
  artifacts: Record<string, { name: string; mediaType: string; content: string; sha256: string }>;
  events: RelayEvent[];
};
