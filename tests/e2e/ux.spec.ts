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
  await expect(page.getByRole("heading", { name: "Project Aurora", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Release readiness" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Execution" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review & controls", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Operating boundary" })).toBeVisible();

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
