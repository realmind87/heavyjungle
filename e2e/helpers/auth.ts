import { expect, type Page } from "@playwright/test";
import { E2E_PASSWORD, E2E_USERNAME } from "./constants";

export async function login(
  page: Page,
  options?: { username?: string; password?: string; next?: string },
) {
  const username = options?.username ?? E2E_USERNAME;
  const password = options?.password ?? E2E_PASSWORD;
  const next = options?.next;

  const loginUrl = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  await page.goto(loginUrl);

  await page.locator('input[name="login"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator("#main-content button[type='submit']").click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 15_000 });
}
