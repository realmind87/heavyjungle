ALTER TABLE "posts" DROP CONSTRAINT "posts_board_id_boards_id_fk";--> statement-breakpoint
DROP INDEX "posts_board_created_at_idx";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "board_id";--> statement-breakpoint
CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
DROP TABLE "boards";
