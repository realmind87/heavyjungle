import { expect, type Locator, type Page } from "@playwright/test";
import { SAMPLE_GIF_PATH } from "./constants";

export async function fillRichText(editor: Locator, text: string) {
  await editor.click();
  await editor.fill(text);
}

export async function uploadGifToEditor(editorScope: Locator, gifPath = SAMPLE_GIF_PATH) {
  const fileInput = editorScope.locator('input[type="file"][accept*="gif"]');
  await fileInput.setInputFiles(gifPath);
  await expect(editorScope.locator('[contenteditable="true"] img')).toBeVisible({ timeout: 30_000 });
}

export function postWriteEditor(page: Page) {
  return page.locator("main [contenteditable='true']").first();
}

export function commentComposer(page: Page) {
  return page.locator("form").filter({ has: page.getByRole("toolbar", { name: "댓글 도구" }) });
}
