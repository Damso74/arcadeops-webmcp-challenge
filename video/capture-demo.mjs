/* global document, HTMLElement, window */

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
await page.waitForFunction(() => window.__videoWebMcpTools?.length === 7);

await page.evaluate(() => {
  const cursor = document.createElement("div");
  cursor.id = "relay-video-cursor";
  cursor.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 28 34" width="28" height="34">
      <path d="M3 2.5v24.2l6.1-5.7 4.1 9.2 4.8-2.2-4.1-8.8h8.5L3 2.5Z" fill="#F7F5F0" stroke="#101416" stroke-linejoin="round" stroke-width="2"/>
    </svg>
    <span aria-hidden="true"></span>`;
  Object.assign(cursor.style, {
    position: "fixed",
    left: "0",
    top: "0",
    zIndex: "100001",
    width: "28px",
    height: "34px",
    transform: "translate3d(1560px, 870px, 0)",
    transition: "transform 480ms cubic-bezier(.22,.75,.22,1)",
    pointerEvents: "none",
    filter: "drop-shadow(0 2px 2px rgba(0,0,0,.35))",
  });
  const ring = cursor.querySelector("span");
  Object.assign(ring.style, {
    position: "absolute",
    left: "-8px",
    top: "-8px",
    width: "28px",
    height: "28px",
    border: "2px solid #C98554",
    borderRadius: "999px",
    opacity: "0",
    transform: "scale(.45)",
    transition: "opacity 180ms ease, transform 180ms ease",
  });
  document.body.append(cursor);

  const callout = document.createElement("div");
  callout.id = "relay-video-callout";
  Object.assign(callout.style, {
    position: "fixed",
    left: "260px",
    top: "58px",
    zIndex: "99999",
    padding: "9px 13px 9px 16px",
    borderRadius: "6px",
    background: "rgba(16, 20, 22, 0.96)",
    border: "1px solid rgba(247, 245, 240, 0.18)",
    borderLeft: "4px solid #C98554",
    color: "#F7F5F0",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontSize: "15px",
    fontWeight: "650",
    boxShadow: "none",
    display: "block",
    opacity: "0",
    transition: "opacity 180ms ease",
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

async function moveCursorTo(locator, { duration = 520, xRatio = 0.5, yRatio = 0.5 } = {}) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return;
  const x = Math.round(box.x + box.width * xRatio);
  const y = Math.round(box.y + box.height * yRatio);
  await page.evaluate(({ cursorX, cursorY, transitionMs }) => {
    const node = document.querySelector("#relay-video-cursor");
    if (!(node instanceof HTMLElement)) return;
    node.style.transitionDuration = `${transitionMs}ms`;
    node.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
  }, { cursorX: x, cursorY: y, transitionMs: duration });
  await page.mouse.move(x, y, { steps: 18 });
  await page.waitForTimeout(duration + 120);
}

async function clickWithCursor(locator, options) {
  await moveCursorTo(locator, options);
  await page.evaluate(() => {
    const ring = document.querySelector("#relay-video-cursor span");
    if (!(ring instanceof HTMLElement)) return;
    ring.style.opacity = "1";
    ring.style.transform = "scale(1)";
    window.setTimeout(() => {
      ring.style.opacity = "0";
      ring.style.transform = "scale(1.35)";
    }, 180);
  });
  await locator.click();
  await page.waitForTimeout(420);
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

await page.waitForTimeout(1_400);
await clickWithCursor(page.getByRole("button", { name: "Run review" }), { duration: 650 });
await page.waitForTimeout(1_400);

await callout("Native WebMCP tools");
await moveCursorTo(page.getByText("WebMCP connected · 7 tools"), { duration: 720, xRatio: 0.2 });
await invoke("inspect_project");
await moveCursorTo(page.getByRole("region", { name: "Mission progress" }), { duration: 680, xRatio: 0.18 });
await page.waitForTimeout(7_000);

await callout("Browser operator prepares the mission");
const drafted = await invoke("draft_mission_plan");
await page.getByText("Mission plan · v1").waitFor();
await moveCursorTo(page.getByText("Mission plan · v1"), { duration: 720, xRatio: 0.25 });
await page.waitForTimeout(9_000);

await callout("Mission delegated to the release worker");
const launched = await invoke("launch_mission", { planHandle: drafted.data.planHandle });
await page.getByText("Human decision required").waitFor();
await moveCursorTo(page.getByText("Human decision required"), { duration: 760, xRatio: 0.25 });
await page.waitForTimeout(9_000);

await callout("Human decision required");
await invoke("explain_block", { runHandle: launched.data.runHandle });
const stageRelease = page.getByRole("button", { name: /Stage the release/ });
await moveCursorTo(stageRelease, { duration: 900, xRatio: 0.22 });
await page.waitForTimeout(10_000);
await clickWithCursor(stageRelease, { duration: 520, xRatio: 0.22 });
await page.locator(".decision-result").getByText("staged release").waitFor();
await page.waitForTimeout(2_000);

await callout("Mission resumes safely");
await invoke("observe_run", { runHandle: launched.data.runHandle });
await invoke("resume_after_human_decision", {
  runHandle: launched.data.runHandle,
  decisionRef: launched.decisionRef,
});
await page.getByText("4 required evidence checks", { exact: false }).waitFor();
await moveCursorTo(page.getByText("4 required evidence checks", { exact: false }), { duration: 760, xRatio: 0.3 });
await page.waitForTimeout(7_000);

await callout("Evidence verified");
const acceptEvidence = page.getByRole("button", { name: "Accept this exact evidence pack" });
await moveCursorTo(acceptEvidence, { duration: 860, xRatio: 0.3 });
await page.waitForTimeout(4_000);
await clickWithCursor(acceptEvidence, { duration: 520, xRatio: 0.3 });
await page.getByText("VALID", { exact: true }).waitFor();
await invoke("verify_delivery", { runHandle: launched.data.runHandle });
await callout("Certificate valid");
await moveCursorTo(page.getByText("VALID", { exact: true }), { duration: 760 });
await page.waitForTimeout(6_000);

await context.close();
await video.saveAs(outputPath);
await browser.close();

process.stdout.write(`${outputPath}\n`);
