import { test, expect } from "@playwright/test";

// Payment flow uses Netopia sandbox. Requires a confirmed order with payment_method=card.
// In sandbox, the gateway redirects back to /payment-success or /payment-failed.

test.describe("Card payment", () => {
  test("card payment redirects to Netopia and back", async ({ page }) => {
    test.skip(!process.env.E2E_RUN_PAYMENTS, "Set E2E_RUN_PAYMENTS=1 to enable (uses Netopia sandbox)");

    // Assumes a guest checkout was completed and the user clicked "Plătește cu cardul"
    await page.goto("/checkout?test=card");
    await page.getByRole("button", { name: /plătește cu cardul/i }).click();

    // Wait for Netopia gateway redirect
    await page.waitForURL(/secure\.sandbox\.netopia/, { timeout: 30_000 });

    // Sandbox card details
    await page.getByLabel(/card number/i).fill("9900004810225098");
    await page.getByLabel(/expir/i).fill("12/30");
    await page.getByLabel(/cvv|cvc/i).fill("123");
    await page.getByRole("button", { name: /pay|plătește/i }).click();

    // Return to success page
    await page.waitForURL(/payment-success/, { timeout: 60_000 });
    await expect(page.getByText(/plata.*confirmat/i)).toBeVisible();
  });
});
