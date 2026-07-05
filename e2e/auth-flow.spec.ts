import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { E2E_USERNAME } from "./helpers/constants";

test.describe("auth flow", () => {
  test("login with E2E credentials", async ({ page }) => {
    await login(page, { next: "/write" });
    await expect(page).toHaveURL(/\/write/);
    await expect(page.getByLabel("제목 (필수)")).toBeVisible();
  });

  test("invalid login shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="login"]').fill(E2E_USERNAME);
    await page.locator('input[name="password"]').fill("wrong-password-xyz");
    await page.locator("#main-content button[type='submit']").click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("이메일(아이디) 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
  });
});
