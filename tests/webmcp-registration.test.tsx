// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WebMcpRelay } from "@/components/WebMcpRelay";

describe("WebMcpRelay", () => {
  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(document, "modelContext");
    Reflect.deleteProperty(document, "__arcadeOpsRelayRegistration");
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("registers exactly seven strict intent tools once and aborts them on unmount", async () => {
    const registerTool = vi.fn();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }))));

    const first = render(<WebMcpRelay />);
    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(7));
    const second = render(<WebMcpRelay />);
    expect(registerTool).toHaveBeenCalledTimes(7);

    const tools = registerTool.mock.calls.map(([tool]) => tool as Record<string, unknown>);
    expect(tools.map((tool) => tool.name)).toEqual([
      "inspect_project",
      "draft_mission_plan",
      "launch_mission",
      "observe_run",
      "explain_block",
      "resume_after_human_decision",
      "verify_delivery",
    ]);
    for (const tool of tools) {
      expect(tool.inputSchema).toMatchObject({ type: "object", additionalProperties: false });
      expect(tool.annotations).toMatchObject({ destructiveHint: false, idempotentHint: true });
    }
    const signal = (registerTool.mock.calls[0]?.[1] as { signal: AbortSignal }).signal;
    expect(signal.aborted).toBe(false);
    second.unmount();
    expect(signal.aborted).toBe(false);
    first.unmount();
    await waitFor(() => expect(signal.aborted).toBe(true));
  });

  it("does not register tools away from the challenge page", () => {
    window.history.replaceState({}, "", "/not-the-challenge");
    const registerTool = vi.fn();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool },
    });
    render(<WebMcpRelay />);
    expect(registerTool).not.toHaveBeenCalled();
  });

  it("keeps a useful human UI fallback when WebMCP is unavailable", () => {
    expect(() => render(<WebMcpRelay />)).not.toThrow();
    expect(window.__relayInvokeTool).toBeTypeOf("function");
  });
});
