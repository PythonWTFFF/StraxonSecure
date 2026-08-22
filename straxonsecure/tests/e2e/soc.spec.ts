import { test, expect } from "@playwright/test";

test.describe("SOC Dashboard", () => {
  test("SOC Dashboard loads and renders 3D Globe fallback", async ({ page }) => {
    await page.goto("/dashboard");

    // Verify header/title
    await expect(page.getByText(/Global Threat Matrix/i).first()).toBeVisible();

    // The globe uses Suspense, so we either see the fallback or the canvas
    const fallback = page.getByText("Initializing 3D Globe...");
    const canvas = page.locator("canvas");

    // We expect either one of them to eventually show up
    await Promise.race([expect(fallback).toBeVisible(), expect(canvas.first()).toBeVisible()]);
  });
});
