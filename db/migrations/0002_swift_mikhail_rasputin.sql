CREATE TABLE IF NOT EXISTS "subscribed_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"subscription_status" varchar(50),
	"invoice_status" varchar(50),
	"current_plan" varchar(50),
	"next_invoice_date" timestamp,
	CONSTRAINT "subscribed_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text,
	"event_payload" jsonb NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "subscription";