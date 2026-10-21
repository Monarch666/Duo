CREATE TABLE "checkin_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"checkin_id" text NOT NULL,
	"couple_id" text NOT NULL,
	"user_id" text NOT NULL,
	"mood" integer NOT NULL,
	"answer_one" text NOT NULL,
	"answer_two" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"year" integer NOT NULL,
	"week_number" integer NOT NULL,
	"prompt_one" text NOT NULL,
	"prompt_two" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"revealed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couple_members" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'partner' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couples" (
	"id" text PRIMARY KEY NOT NULL,
	"invite_code" text NOT NULL,
	"invite_code_created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"anniversary_date" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "couples_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "daily_prompt_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt_id" text NOT NULL,
	"couple_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"prompt_text" text NOT NULL,
	"day_number" integer DEFAULT 312,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'date_night' NOT NULL,
	"start_at" text NOT NULL,
	"end_at" text,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"color" text DEFAULT '#EA4C53',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "list_items" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"couple_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"content" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by_user_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'custom' NOT NULL,
	"icon" text DEFAULT 'Heart',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	CONSTRAINT "login_attempts_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "love_note_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"couple_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "love_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"title" text DEFAULT 'Morning Love Note' NOT NULL,
	"content" text NOT NULL,
	"sign_off" text DEFAULT 'Forever yours',
	"paper_style" text DEFAULT 'butter',
	"taps_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"memory_date" text NOT NULL,
	"note" text,
	"photo_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_moods" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"label" text NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"couple_id" text NOT NULL,
	"user_id" text NOT NULL,
	"category" text DEFAULT 'custom' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "checkin_answers" ADD CONSTRAINT "checkin_answers_checkin_id_checkins_id_fk" FOREIGN KEY ("checkin_id") REFERENCES "public"."checkins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_answers" ADD CONSTRAINT "checkin_answers_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_answers" ADD CONSTRAINT "checkin_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_members" ADD CONSTRAINT "couple_members_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couple_members" ADD CONSTRAINT "couple_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_prompt_answers" ADD CONSTRAINT "daily_prompt_answers_prompt_id_daily_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."daily_prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_prompt_answers" ADD CONSTRAINT "daily_prompt_answers_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_prompt_answers" ADD CONSTRAINT "daily_prompt_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_prompts" ADD CONSTRAINT "daily_prompts_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_prompts" ADD CONSTRAINT "daily_prompts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "love_note_replies" ADD CONSTRAINT "love_note_replies_note_id_love_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."love_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "love_note_replies" ADD CONSTRAINT "love_note_replies_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "love_note_replies" ADD CONSTRAINT "love_note_replies_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "love_notes" ADD CONSTRAINT "love_notes_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "love_notes" ADD CONSTRAINT "love_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_moods" ADD CONSTRAINT "partner_moods_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_moods" ADD CONSTRAINT "partner_moods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkin_answers_checkin_user_idx" ON "checkin_answers" USING btree ("checkin_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "couple_members_couple_user_idx" ON "couple_members" USING btree ("couple_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_moods_couple_user_idx" ON "partner_moods" USING btree ("couple_id","user_id");