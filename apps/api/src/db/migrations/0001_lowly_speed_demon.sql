ALTER TYPE "account_type" ADD VALUE 'savings';--> statement-breakpoint
ALTER TYPE "account_type" ADD VALUE 'loan';--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "account_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "institution_name" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "credit_limit" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "outstanding_balance" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "parent_category_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transfer_group_id" uuid;