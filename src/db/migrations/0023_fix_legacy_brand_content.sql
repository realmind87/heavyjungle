-- 구 사이트명(배포는기도다) → Heavy Jungle 치환 (글·댓글·프로필 소개)
UPDATE "posts"
SET
  "title" = replace(replace("title", '배포는 기도다', 'Heavy Jungle'), '배포는기도다', 'Heavy Jungle'),
  "content" = replace(replace("content", '배포는 기도다', 'Heavy Jungle'), '배포는기도다', 'Heavy Jungle'),
  "updated_at" = NOW()
WHERE "is_deleted" = false
  AND (
    "title" ILIKE '%배포는%기도%'
    OR "content" ILIKE '%배포는%기도%'
    OR "title" ILIKE '%배포는기도%'
    OR "content" ILIKE '%배포는기도%'
  );
--> statement-breakpoint
UPDATE "comments"
SET
  "content" = replace(replace("content", '배포는 기도다', 'Heavy Jungle'), '배포는기도다', 'Heavy Jungle'),
  "updated_at" = NOW()
WHERE "is_deleted" = false
  AND (
    "content" ILIKE '%배포는%기도%'
    OR "content" ILIKE '%배포는기도%'
  );
--> statement-breakpoint
UPDATE "users"
SET
  "bio" = replace(replace("bio", '배포는 기도다', 'Heavy Jungle'), '배포는기도다', 'Heavy Jungle'),
  "updated_at" = NOW()
WHERE "bio" IS NOT NULL
  AND (
    "bio" ILIKE '%배포는%기도%'
    OR "bio" ILIKE '%배포는기도%'
  );
