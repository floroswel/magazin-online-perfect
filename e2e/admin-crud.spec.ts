import { test, expect } from "@playwright/test";

test.describe("Admin product CRUD", () => {
  test("admin can create, edit and delete a product", async ({ page }) => {
    test.skip(!process.env.E2E_ADMIN_EMAIL, "Set E2E_ADMIN_EMAIL/PASSWORD");

    // Login as admin
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/parol/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /autentific/i }).click();

    // Go to admin
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: /produse/i })).toBeVisible();

    // CREATE
    const name = `E2E Lumânare ${Date.now()}`;
    await page.getByRole("button", { name: /produs nou|adaugă/i }).click();
    await page.getByLabel(/nume/i).fill(name);
    await page.getByLabel(/preț/i).fill("99.99");
    await page.getByLabel(/stoc/i).fill("5");
    await page.getByRole("button", { name: /salveaz/i }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });

    // EDIT
    await page.getByText(name).click();
    await page.getByLabel(/preț/i).fill("89.99");
    await page.getByRole("button", { name: /salveaz/i }).click();
    await expect(page.getByText("89.99")).toBeVisible();

    // DELETE
    await page.getByRole("button", { name: /șterge/i }).first().click();
    await page.getByRole("button", { name: /confirm/i }).click();
    await expect(page.getByText(name)).not.toBeVisible({ timeout: 10_000 });
  });
});
