import { test, expect } from "@playwright/test";

test.describe("Hydration Mismatch Smoke Tests", () => {
  test("Dashboard page renders without hydration mismatch", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/dashboard");
    // Ensure dashboard loads its basic shell
    await expect(page.getByText("Dashboard")).toBeVisible();

    // Check if React logged any hydration mismatch errors
    const hydrationErrors = errors.filter(
      (e) => e.includes("Hydration failed") || e.includes("did not match"),
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test("Pentest page renders without hydration mismatch", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/pentest");
    await expect(page.getByText("Penetration Testing")).toBeVisible();

    const hydrationErrors = errors.filter(
      (e) => e.includes("Hydration failed") || e.includes("did not match"),
    );
    expect(hydrationErrors).toHaveLength(0);
  });
});

test.describe("WebSocket Resiliency", () => {
  test("Dashboard recovers from offline state", async ({ page, context }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Dashboard")).toBeVisible();

    // Simulate offline
    await context.setOffline(true);
    // Wait for the app to potentially react to offline
    await page.waitForTimeout(1000);

    // Simulate online
    await context.setOffline(false);

    // Wait to ensure UI didn't crash
    await page.waitForTimeout(2000);

    // Elements should still be interactive
    await expect(page.getByText("Dashboard")).toBeVisible();
  });
});
