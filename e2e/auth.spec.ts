import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_USER_EMAIL ?? "test@mamalucica.local";
const PASSWORD = process.env.E2E_USER_PASSWORD ?? "Test1234!";

test.describe("Auth flow", () => {
  test("login form validates required fields", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /autentific/i }).click();
    await expect(page.getByText(/email|parol/i).first()).toBeVisible();
  });

  test("user can log in and is redirected to account", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/parol/i).fill(PASSWORD);
    await page.getByRole("button", { name: /autentific/i }).click();
    await expect(page).toHaveURL(/\/cont/i, { timeout: 15_000 });
  });

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("link", { name: /am uitat parola|reset/i }).click();
    await expect(page).toHaveURL(/forgot|reset/i);
  });

  test("logout clears session", async ({ page, context }) => {
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/parol/i).fill(PASSWORD);
    await page.getByRole("button", { name: /autentific/i }).click();
    await page.waitForURL(/\/cont/);
    await page.getByRole("button", { name: /deconectare|logout/i }).click();
    await page.goto("/cont");
    await expect(page).toHaveURL(/auth/);
  });
});
