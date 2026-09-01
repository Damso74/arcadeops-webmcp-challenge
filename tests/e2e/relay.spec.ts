import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

type Tool = { name: string; execute: (input?: Record<string, unknown>) => Promise<unknown> };

async function installWebMcpHarness(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const tools: Array<{ name: string; execute: (input?: Record<string, unknown>) => Promise<unknown>; signal?: AbortSignal }> = [];
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool: Tool, options?: { signal?: AbortSignal }) {
          tools.push({ ...tool, signal: options?.signal });
        },
      },
    });
    Object.defineProperty(window, "__webMcpTools", { configurable: true, value: tools });
  });
}

async function invoke(page: import("@playwright/test").Page, name: string, input: Record<string, unknown> = {}) {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const tools = (window as typeof window & { __webMcpTools: Tool[] }).__webMcpTools;
      const tool = tools.find((candidate) => candidate.name === toolName);
      if (!tool) throw new Error(`Tool not found: ${toolName}`);
      return tool.execute(toolInput);
    },
    { toolName: name, toolInput: input },
  );
}

test.beforeEach(async ({ page }) => {
  await installWebMcpHarness(page);
  await page.goto("/");
  await expect(page.getByText("WebMCP connected · 7 tools")).toBeVisible();
});

test("native-compatible tool surface drives the full visible Project Aurora loop", async ({ page }) => {
  const registered = await page.evaluate(() =>
    (window as typeof window & { __webMcpTools: Tool[] }).__webMcpTools.map((tool) => tool.name),
  );
  expect(registered).toEqual([
    "inspect_project",
    "draft_mission_plan",
    "launch_mission",
    "observe_run",
    "explain_block",
    "resume_after_human_decision",
    "verify_delivery",
  ]);

  const inspected = (await invoke(page, "inspect_project")) as { ok: boolean };
  if (!inspected.ok) throw new Error(`inspect_project failed: ${JSON.stringify(inspected)}`);
  expect(inspected).toMatchObject({ ok: true });
  const drafted = (await invoke(page, "draft_mission_plan")) as {
    data: { planHandle: string };
  };
  await expect(page.getByText("Mission plan · v1")).toBeVisible();
  const launched = (await invoke(page, "launch_mission", { planHandle: drafted.data.planHandle })) as {
    data: { runHandle: string };
    decisionRef: string;
  };
  await expect(page.getByText("Human decision required")).toBeVisible();
  await expect(page.getByText("Worker produced a real analysis artifact and paused at the policy gate.")).toBeVisible();

  const secondContext = await page.context().browser()!.newContext();
  const secondPage = await secondContext.newPage();
  await installWebMcpHarness(secondPage);
  await secondPage.goto(`${new URL(page.url()).origin}/`);
  await expect(secondPage.getByText("No reviews pending.")).toBeVisible();
  await secondContext.close();

  await page.getByRole("button", { name: "Stage the release" }).click();
  await expect(page.locator(".decision-result").getByText("staged release")).toBeVisible();
  const observed = (await invoke(page, "observe_run", { runHandle: launched.data.runHandle })) as {
    status: string;
  };
  expect(observed.status).toBe("DECISION_RECORDED");
  await invoke(page, "resume_after_human_decision", {
    runHandle: launched.data.runHandle,
    decisionRef: launched.decisionRef,
  });
  await expect(page.getByRole("heading", { name: "Evidence", exact: true })).toBeVisible();
  await expect(page.getByText("4 required evidence checks", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Accept this exact evidence pack" }).click();
  await expect(page.getByText("VALID", { exact: true })).toBeVisible();
  const verified = (await invoke(page, "verify_delivery", { runHandle: launched.data.runHandle })) as {
    status: string;
    data: { certificateHashVerified: boolean };
  };
  expect(verified).toMatchObject({ status: "CERTIFICATE_VALID", data: { certificateHashVerified: true } });

  const before = await page.evaluate(async () => (await fetch("/api/session")).json());
  await invoke(page, "launch_mission", { planHandle: drafted.data.planHandle });
  const after = await page.evaluate(async () => (await fetch("/api/session")).json());
  expect(after.session.launchCount).toBe(1);
  expect(after.session.run.id).toBe(before.session.run.id);
});

test("session reset is deterministic and mobile layout has no horizontal overflow", async ({ page }) => {
  await invoke(page, "inspect_project");
  await page.getByRole("button", { name: "Run review" }).click();
  await expect(page.getByText("Revision 0", { exact: true })).toBeVisible();
  await expect(page.getByText("No reviews pending.")).toBeVisible();
  const state = await page.evaluate(async () => (await fetch("/api/session")).json());
  expect(state.session.revision).toBe(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("challenge tools are not registered on another route", async ({ page }) => {
  await page.goto("/not-the-challenge");
  const count = await page.evaluate(() =>
    ((window as typeof window & { __webMcpTools?: Tool[] }).__webMcpTools || []).length,
  );
  expect(count).toBe(0);
});

test("oversized tool input is rejected before execution", async ({ page }) => {
  const status = await page.evaluate(async () => {
    const response = await fetch("/api/tool", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tool: "draft_mission_plan",
        input: { objective: "x".repeat(9000) },
        idempotencyKey: "oversized_input_test",
      }),
    });
    return response.status;
  });
  expect(status).toBe(413);
});
