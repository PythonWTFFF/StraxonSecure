import { test, expect } from "@playwright/test";

test.describe("Attack Labs", () => {
  test("Labs page loads and can navigate to terminal lab", async ({ page }) => {
    await page.goto("/labs");

    // We should see the terminal lab option
    await expect(page.getByText("Interactive Shell (xterm)").first()).toBeVisible();

    // Navigate to terminal lab
    await page.goto("/labs/terminal");

    // Expect the header
    await expect(page.getByText("Interactive Shell Environment").first()).toBeVisible();

    const fallback = page.getByText("Initializing Xterm...");
    const terminal = page.locator(".xterm-viewport");

    await Promise.race([expect(fallback).toBeVisible(), expect(terminal.first()).toBeVisible()]);
  });
});
