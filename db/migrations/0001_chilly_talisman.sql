CREATE TABLE IF NOT EXISTS "payments" (
	"email" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"checkout_session_object" jsonb NOT NULL
);
