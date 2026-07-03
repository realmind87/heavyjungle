CREATE TYPE "public"."post_category" AS ENUM('general', 'notice');--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "category" "post_category" DEFAULT 'general' NOT NULL;