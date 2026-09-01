/* global document, window */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(root, "captures");
const outputPath = path.join(outputDir, "relay-live-demo.webm");
const liveUrl = process.env.RELAY_DEMO_URL || "https://arcadeops-relay.51-210-5-255.sslip.io/";

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  colorScheme: "dark",
  recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } },
  viewport: { width: 1920, height: 1080 },
});

await context.addInitScript(() => {
  const tools = [];
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: {
      registerTool(tool, options = {}) {
        tools.push({ ...tool, signal: options.signal });
      },
    },
  });
  Object.defineProperty(window, "__videoWebMcpTools", { configurable: true, value: tools });
});

const page = await context.newPage();
const video = page.video();
await page.goto(liveUrl, { waitUntil: "networkidle" });
await page.getByText("WebMCP connected · 7 tools").waitFor();

await page.evaluate(() => {
  const callout = document.createElement("div");
  callout.id = "relay-video-callout";
  Object.assign(callout.style, {
    position: "fixed",
    right: "28px",
    top: "86px",
    zIndex: "99999",
    padding: "12px 18px",
    borderRadius: "7px",
    background: "rgba(17, 18, 20, 0.96)",
    border: "1px solid rgba(148, 153, 157, 0.55)",
    borderLeft: "4px solid #4d82a3",
    color: "#f2f2ef",
    fontFamily: "system-ui, sans-serif",
    fontSize: "18px",
    fontWeight: "700",
    letterSpacing: "0.01em",
    boxShadow: "none",
    opacity: "0",
    transition: "opacity .3s ease",
    pointerEvents: "none",
  });
  document.body.append(callout);
});

async function callout(text) {
  await page.evaluate((value) => {
    const node = document.querySelector("#relay-video-callout");
    if (!node) return;
    node.textContent = value;
    node.style.opacity = "1";
  }, text);
}

async function invoke(name, input = {}) {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const tool = window.__videoWebMcpTools.find((candidate) => candidate.name === toolName);
      if (!tool) throw new Error(`Native WebMCP tool not found: ${toolName}`);
      return tool.execute(toolInput);
    },
    { toolName: name, toolInput: input },
  );
}

await page.getByRole("button", { name: "Run review" }).click();
await page.waitForTimeout(28_000);

await callout("Native WebMCP tools");
await invoke("inspect_project");
await page.waitForTimeout(20_000);

await callout("Browser agent drafts the mission");
const drafted = await invoke("draft_mission_plan");
await page.getByText("Mission plan · v1").waitFor();
await page.waitForTimeout(20_000);

await callout("Browser agent delegates");
const launched = await invoke("launch_mission", { planHandle: drafted.data.planHandle });
await page.getByText("Human decision required").waitFor();
await page.waitForTimeout(20_000);

await callout("Human decision required");
await invoke("explain_block", { runHandle: launched.data.runHandle });
await page.getByRole("button", { name: /Stage the release/ }).focus();
await page.waitForTimeout(20_000);
await page.getByRole("button", { name: /Stage the release/ }).click();
await page.locator(".decision-result").getByText("staged release").waitFor();
await page.waitForTimeout(5_000);

await callout("Mission resumes safely");
await invoke("observe_run", { runHandle: launched.data.runHandle });
await invoke("resume_after_human_decision", {
  runHandle: launched.data.runHandle,
  decisionRef: launched.decisionRef,
});
await page.getByText("4 required evidence checks", { exact: false }).waitFor();
await page.waitForTimeout(22_000);

await callout("Evidence verified");
await page.getByRole("button", { name: "Accept this exact evidence pack" }).focus();
await page.waitForTimeout(10_000);
await page.getByRole("button", { name: "Accept this exact evidence pack" }).click();
await page.getByText("VALID", { exact: true }).waitFor();
await invoke("verify_delivery", { runHandle: launched.data.runHandle });
await callout("Certificate valid");
await page.waitForTimeout(12_000);

await context.close();
await video.saveAs(outputPath);
await browser.close();

process.stdout.write(`${outputPath}\n`);
