import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  });

  test("write requires auth", async ({ page }) => {
    await page.goto("/write");
    await expect(page).toHaveURL(/\/login/);
  });

  test("health API returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as { status?: string };
    expect(json.status).toBe("ok");
  });

  test("mobile bottom nav visible on small viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "모바일 하단 메뉴" })).toBeVisible();
  });
});
