import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("admin dashboard access", () => {
  test("non-admin user is redirected from /admin/dashboard", async ({ page }) => {
    await login(page);
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL("/");
  });

  test("guest is redirected to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fdashboard/);
  });
});
