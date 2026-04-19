import { test, expect } from "@playwright/test";

test.describe("Return wizard", () => {
  test("user can submit return request for delivered order", async ({ page }) => {
    test.skip(!process.env.E2E_USER_EMAIL, "Set E2E_USER_EMAIL/PASSWORD with delivered order");

    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL!);
    await page.getByLabel(/parol/i).fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: /autentific/i }).click();
    await page.waitForURL(/\/cont/);

    await page.goto("/cont/comenzi");
    await page.getByRole("button", { name: /retur|înapoi/i }).first().click();

    // Wizard step 1: select reason
    await page.getByLabel(/motiv/i).selectOption({ index: 1 });
    await page.getByRole("button", { name: /următor/i }).click();

    // Step 2: photo upload skipped if not strict
    await page.getByRole("button", { name: /următor|trimite/i }).click();

    await expect(page.getByText(/cerere.*trimis|primit/i)).toBeVisible({ timeout: 15_000 });
  });
});
