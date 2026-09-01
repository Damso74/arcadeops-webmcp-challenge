"use client";

import { useEffect } from "react";

import { RELAY_TOOL_NAMES, type RelayToolName } from "@/lib/types";

type ToolDefinition = {
  name: RelayToolName;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; destructiveHint: false; idempotentHint: true };
  execute: (input?: Record<string, unknown>) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (tool: ToolDefinition, options?: { signal?: AbortSignal }) => Promise<void> | void;
};

type RelayRegistration = {
  controller: AbortController;
  owners: number;
  cleanupTimer?: number;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
    __arcadeOpsRelayRegistration?: RelayRegistration;
  }

  interface Window {
    __relayInvokeTool?: (tool: RelayToolName, input?: Record<string, unknown>) => Promise<unknown>;
  }
}

const descriptions: Record<RelayToolName, string> = {
  inspect_project: "Inspect the bounded Project Aurora objective, constraints, tasks, policy, agents, permissions, risks, and safe next actions.",
  draft_mission_plan: "Draft one bounded release mission plan with phases, dependencies, budget, acceptance criteria, evidence, risk, and likely human decisions. Does not launch it.",
  launch_mission: "Launch the drafted bounded mission with the signed plan handle. The server enforces authorization, allowlists, cost cap, idempotency, and the human decision gate.",
  observe_run: "Read authoritative persisted run status, current and completed steps, complete cost truth, events, artifacts, decisions, evidence, and terminal-state truth.",
  explain_block: "Explain the current policy block, what the agent may do, what only a human may do, and whether the exact run can safely resume.",
  resume_after_human_decision: "Resume the exact persisted run only after a separately recorded human decision. Cannot create or approve a decision.",
  verify_delivery: "Verify delivery truth, evidence-pack hash, exact human acceptance, certificate status, Ed25519 signature, artifact references, and remaining blockers.",
};

const schemas: Record<RelayToolName, Record<string, unknown>> = {
  inspect_project: { type: "object", properties: {}, additionalProperties: false },
  draft_mission_plan: {
    type: "object",
    properties: { objective: { type: "string", minLength: 10, maxLength: 500 } },
    additionalProperties: false,
  },
  launch_mission: {
    type: "object",
    properties: { planHandle: { type: "string", minLength: 40, maxLength: 2048 } },
    required: ["planHandle"],
    additionalProperties: false,
  },
  observe_run: {
    type: "object",
    properties: { runHandle: { type: "string", minLength: 40, maxLength: 2048 } },
    additionalProperties: false,
  },
  explain_block: {
    type: "object",
    properties: { runHandle: { type: "string", minLength: 40, maxLength: 2048 } },
    additionalProperties: false,
  },
  resume_after_human_decision: {
    type: "object",
    properties: {
      runHandle: { type: "string", minLength: 40, maxLength: 2048 },
      decisionRef: { type: "string", minLength: 40, maxLength: 2048 },
    },
    required: ["runHandle", "decisionRef"],
    additionalProperties: false,
  },
  verify_delivery: {
    type: "object",
    properties: { runHandle: { type: "string", minLength: 40, maxLength: 2048 } },
    additionalProperties: false,
  },
};

async function invoke(tool: RelayToolName, input: Record<string, unknown> = {}) {
  const response = await fetch("/api/tool", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tool, input, idempotencyKey: `webmcp_${crypto.randomUUID()}` }),
  });
  const result = (await response.json()) as unknown;
  window.dispatchEvent(new CustomEvent("relay:state-changed", { detail: { tool, result } }));
  return result;
}

export function WebMcpRelay() {
  useEffect(() => {
    window.__relayInvokeTool = invoke;
    if (window.location.pathname !== "/") {
      return () => {
        delete window.__relayInvokeTool;
      };
    }
    const context = document.modelContext;
    if (!context || typeof context.registerTool !== "function") {
      window.dispatchEvent(new CustomEvent("relay:webmcp-status", { detail: { connected: false, count: 0 } }));
      return () => {
        delete window.__relayInvokeTool;
      };
    }
    const releaseRegistration = (registration: RelayRegistration) => {
      registration.owners -= 1;
      registration.cleanupTimer = window.setTimeout(() => {
        if (registration.owners > 0) return;
        registration.controller.abort();
        if (document.__arcadeOpsRelayRegistration === registration) {
          delete document.__arcadeOpsRelayRegistration;
        }
        delete window.__relayInvokeTool;
      }, 0);
    };
    const existing = document.__arcadeOpsRelayRegistration;
    if (existing) {
      existing.owners += 1;
      if (existing.cleanupTimer !== undefined) window.clearTimeout(existing.cleanupTimer);
      window.dispatchEvent(
        new CustomEvent("relay:webmcp-status", { detail: { connected: true, count: RELAY_TOOL_NAMES.length } }),
      );
      return () => releaseRegistration(existing);
    }
    const controller = new AbortController();
    const registration: RelayRegistration = { controller, owners: 1 };
    document.__arcadeOpsRelayRegistration = registration;
    const registrations = RELAY_TOOL_NAMES.map((name) =>
      context.registerTool(
        {
          name,
          description: descriptions[name],
          inputSchema: schemas[name],
          annotations: {
            readOnlyHint: ["inspect_project", "observe_run", "explain_block", "verify_delivery"].includes(name),
            destructiveHint: false,
            idempotentHint: true,
          },
          execute: (input = {}) => invoke(name, input),
        },
        { signal: controller.signal },
      ),
    );
    Promise.all(registrations.map((registration) => Promise.resolve(registration)))
      .then(() => {
        window.dispatchEvent(
          new CustomEvent("relay:webmcp-status", { detail: { connected: true, count: RELAY_TOOL_NAMES.length } }),
        );
      })
      .catch(() => {
        controller.abort();
        if (document.__arcadeOpsRelayRegistration === registration) {
          delete document.__arcadeOpsRelayRegistration;
        }
        window.dispatchEvent(new CustomEvent("relay:webmcp-status", { detail: { connected: false, count: 0 } }));
      });
    return () => {
      releaseRegistration(registration);
    };
  }, []);

  return null;
}
