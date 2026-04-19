import { test, expect } from "@playwright/test";

test.describe("Checkout flow (guest)", () => {
  test("add product to cart → checkout → submit order", async ({ page }) => {
    await page.goto("/");
    // Navigate to first product card on homepage
    await page.locator("a[href^='/produs/']").first().click();
    await expect(page).toHaveURL(/\/produs\//);

    // Add to cart
    await page.getByRole("button", { name: /adaug.* (în )?co/i }).click();
    await page.goto("/cos");
    await expect(page.getByText(/sub-?total|total/i).first()).toBeVisible();

    // Proceed to checkout
    await page.getByRole("link", { name: /finalizeaz|checkout/i }).first().click();
    await expect(page).toHaveURL(/\/checkout/);

    // Fill guest details
    await page.getByLabel(/nume/i).fill("Test User");
    await page.getByLabel(/email/i).fill(`guest+${Date.now()}@mamalucica.local`);
    await page.getByLabel(/telefon/i).fill("0712345678");
    await page.getByLabel(/adres/i).first().fill("Str. Test 1");
    await page.getByLabel(/oraș|localitate/i).fill("București");
    await page.getByLabel(/județ/i).fill("București");

    // Pick first available shipping + payment
    await page.locator("input[type='radio']").first().check({ force: true });

    // Accept legal consents
    for (const cb of await page.locator("input[type='checkbox']").all()) {
      const label = await cb.getAttribute("aria-label") ?? "";
      if (/termen|confiden/i.test(label)) await cb.check({ force: true });
    }

    await page.getByRole("button", { name: /plaseaz|trimite|finalizeaz/i }).click();

    // Expect success page or order number
    await expect(page.getByText(/comand|order|mulțumim/i).first()).toBeVisible({ timeout: 30_000 });
  });
});
