CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_title_trgm_idx" ON "posts" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_content_plain_trgm_idx" ON "posts" USING gin (regexp_replace("content", '<[^>]+>', ' ', 'g') gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_username_trgm_idx" ON "users" USING gin ("username" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_display_name_trgm_idx" ON "users" USING gin ("display_name" gin_trgm_ops);
