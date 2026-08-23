import { test, expect } from "@playwright/test";

test.describe("StraxonSecure Phase 1: Critical Journey Smoke Test", () => {
  // We use test.beforeEach to ensure we start at a clean state
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("E2E Journey: Login -> Attack Surface -> Launch Pentest", async ({ page }) => {
    // 1. Authenticate
    await page.goto("/auth");
    
    // Fill in mock credentials (these should map to a test user in the new Supabase instance)
    await page.fill('input[name="email"]', "test-analyst@straxon.io");
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');

    // Wait for redirect to Dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page.getByText("Dashboard")).toBeVisible();

    // 2. Navigate to EASM (External Attack Surface Management)
    await page.click('a[href="/easm"]');
    await page.waitForURL("**/easm");
    await expect(page.getByText("Attack Surface")).toBeVisible();
    
    // Check that at least one asset is loaded in the table/cards
    // This relies on actual data being returned from the API
    await expect(page.locator(".cyber-card")).not.toHaveCount(0);

    // 3. Launch a Pentest Lab
    await page.click('a[href="/pentest"]');
    await page.waitForURL("**/pentest");
    await expect(page.getByText("Penetration Testing")).toBeVisible();

    // Fill out the pentest scan target
    const targetInput = page.getByPlaceholder("https://target.com");
    if (await targetInput.isVisible()) {
      await targetInput.fill("https://scan-me.org");
      // Select the 'Quick' scan type
      await page.getByRole("combobox").selectOption("quick");
      await page.click('button:has-text("Launch Scan")');
      
      // Verify success toast or UI update
      await expect(page.getByText("Scan queued")).toBeVisible({ timeout: 5000 });
    }

    // 4. Export Report
    await page.click('a[href="/reports"]');
    await page.waitForURL("**/reports");
    await expect(page.getByText("Compliance & Reporting")).toBeVisible();
    // Assuming there's a button to generate report
    const exportBtn = page.getByRole("button", { name: /Export|Download/i }).first();
    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});
