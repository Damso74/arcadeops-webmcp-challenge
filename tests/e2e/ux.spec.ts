import { expect, test } from "@playwright/test";

test("business-first operations workspace renders without UI errors or overflow", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const tools: Array<{ name: string }> = [];
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool(tool: { name: string }) {
          tools.push(tool);
        },
      },
    });
  });

  await page.goto("/");
  await expect(page.getByText("WebMCP connected · 7 tools")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toContainText("Projects");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toContainText("Reviews");
  await expect(page.getByRole("region", { name: "Mission progress" })).toContainText("Inspect");
  await expect(page.getByRole("region", { name: "Mission progress" })).toContainText("Verify");
  await page.getByText("WebMCP connected · 7 tools").click();
  await expect(page.getByText("WebMCP command", { exact: true })).toBeVisible();
  await expect(page.getByText("Release review workflow available", { exact: true })).toBeVisible();
  await expect(page.getByText("Browser instruction", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Project Aurora", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mission activity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Controls", exact: true })).toBeVisible();
  await expect(page.getByText("Permissions", { exact: true })).toBeVisible();
  await expect(page.getByText("Restricted", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Readiness", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Release readiness" })).toBeVisible();
  await page.getByRole("tab", { name: "Mission", exact: true }).click();

  const diagnostics = await page.evaluate(() => ({
    blank: document.body.innerText.trim().length === 0,
    errorOverlay: Boolean(document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    background: getComputedStyle(document.body).backgroundColor,
  }));

  expect(diagnostics).toMatchObject({ blank: false, errorOverlay: false, overflow: false });
  expect(diagnostics.background).not.toBe("rgba(0, 0, 0, 0)");

  await page.screenshot({ fullPage: true, path: `artifacts/ux-${testInfo.project.name}.png` });
});
