ALTER TABLE "categories" ADD COLUMN "color" text DEFAULT '#1D9E75' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "type" text DEFAULT 'expense' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;