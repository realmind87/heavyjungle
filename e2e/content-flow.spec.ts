import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import {
  commentComposer,
  fillRichText,
  postWriteEditor,
  uploadGifToEditor,
} from "./helpers/editor";

test.describe.configure({ mode: "serial" });

test.describe("content flow", () => {
  const runId = Date.now();
  const postTitle = `E2E 글 ${runId}`;
  const postBody = `E2E 본문 ${runId}`;
  const commentBody = `E2E 댓글 ${runId}`;

  test("login → write post with GIF → comment with GIF", async ({ page }) => {
    await login(page, { next: "/write" });
    await expect(page).toHaveURL(/\/write/);

    await page.getByLabel("제목 (필수)").fill(postTitle);

    const editor = postWriteEditor(page);
    await fillRichText(editor, postBody);
    await uploadGifToEditor(page.locator("main"));

    await page.getByRole("button", { name: "등록", exact: true }).click();
    await expect(page).toHaveURL(/\/posts\/[0-9a-f-]+/, { timeout: 15_000 });

    await expect(page.getByRole("heading", { level: 1, name: postTitle })).toBeVisible();
    await expect(page.locator("article img").first()).toBeVisible();

    const composer = commentComposer(page);
    const commentEditor = composer.locator("[contenteditable='true']");
    await fillRichText(commentEditor, commentBody);
    await uploadGifToEditor(composer);

    await composer.getByRole("button", { name: "등록" }).click();

    const postedComment = page.locator("article").filter({ hasText: commentBody });
    await expect(postedComment).toBeVisible({ timeout: 15_000 });
    await expect(postedComment.locator("img").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /댓글 \(1\)/ })).toBeVisible();
  });
});
