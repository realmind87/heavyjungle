/** 게시글 본문 — 에디터·미리보기·상세 노출이 동일한 타이포/서식을 쓰도록 공유 */
export const postContentProseClass =
  "post-content font-sans text-base text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words " +
  "[&_a]:break-all [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 " +
  "[&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline " +
  "[&_s]:line-through [&_strike]:line-through [&_del]:line-through " +
  "[&_p]:min-h-[1.5em] [&_div]:min-h-[1.5em] " +
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:min-h-[1.5em] " +
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-zinc-300 dark:[&_table]:border-zinc-600 " +
  "[&_th]:border [&_th]:border-zinc-300 [&_th]:bg-zinc-100 [&_th]:px-2 [&_th]:py-1 dark:[&_th]:border-zinc-600 dark:[&_th]:bg-zinc-800 " +
  "[&_td]:border [&_td]:border-zinc-300 [&_td]:px-2 [&_td]:py-1 dark:[&_td]:border-zinc-600 " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-600 dark:[&_blockquote]:border-zinc-600 dark:[&_blockquote]:text-zinc-400 " +
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-3 dark:[&_pre]:bg-zinc-800 " +
  "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 dark:[&_code]:bg-zinc-800 " +
  "[&_img]:my-2 [&_img]:max-h-96 [&_img]:max-w-full [&_img]:rounded-lg " +
  "[&_video]:my-3 [&_video]:max-h-[32rem] [&_video]:max-w-full [&_video]:rounded-lg " +
  "[&_iframe]:my-3 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-lg";

/** 에디터 전용 — 선택·커서 등 편집 UI만 추가 */
export const postContentEditorExtraClass =
  "[&_img]:cursor-pointer [&_video]:cursor-pointer " +
  "[&_img.editor-image-selected]:outline [&_img.editor-image-selected]:outline-2 [&_img.editor-image-selected]:outline-blue-500 [&_img.editor-image-selected]:outline-offset-2 " +
  "[&_video.editor-image-selected]:outline [&_video.editor-image-selected]:outline-2 [&_video.editor-image-selected]:outline-blue-500 [&_video.editor-image-selected]:outline-offset-2";
