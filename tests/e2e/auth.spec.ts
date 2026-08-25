import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("User can navigate to auth page and see login form", async ({ page }) => {
    await page.goto("/auth");

    // Check if the auth page renders correctly
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});
