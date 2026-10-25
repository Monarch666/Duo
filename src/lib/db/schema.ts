import { pgTable, text, integer, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Sessions table (stored in DB, httpOnly cookie)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});

// Login rate limiting table (track failed attempts per email/ip)
export const loginAttempts = pgTable('login_attempts', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(), // e.g. email:ip
  attemptCount: integer('attempt_count').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
});

// Couples space table
export const couples = pgTable('couples', {
  id: text('id').primaryKey(),
  inviteCode: text('invite_code').notNull().unique(),
  inviteCodeCreatedAt: timestamp('invite_code_created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  anniversaryDate: text('anniversary_date'), // YYYY-MM-DD
  status: text('status', { enum: ['pending', 'paired'] })
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Couple members table (Hard limit of 2 enforced in code & pair action)
export const coupleMembers = pgTable(
  'couple_members',
  {
    id: text('id').primaryKey(),
    coupleId: text('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['creator', 'partner'] })
      .notNull()
      .default('partner'),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    coupleUserUnique: uniqueIndex('couple_members_couple_user_idx').on(
      table.coupleId,
      table.userId
    ),
  })
);

// Events table (Shared calendar)
export const events = pgTable('events', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category', {
    enum: ['anniversary', 'date_night', 'trip', 'reminder', 'other'],
  })
    .notNull()
    .default('date_night'),
  startAt: text('start_at').notNull(), // ISO-8601 string or YYYY-MM-DDTHH:mm
  endAt: text('end_at'),
  isAllDay: boolean('is_all_day').notNull().default(false),
  location: text('location'),
  color: text('color').default('#EA4C53'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Lists table (Date ideas, gift ideas, bucket list, groceries, custom)
export const lists = pgTable('lists', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category', {
    enum: ['date_ideas', 'gift_ideas', 'bucket_list', 'groceries', 'custom'],
  })
    .notNull()
    .default('custom'),
  icon: text('icon').default('Heart'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// List items table (Checkable items inside lists)
export const listItems = pgTable('list_items', {
  id: text('id').primaryKey(),
  listId: text('list_id')
    .notNull()
    .references(() => lists.id, { onDelete: 'cascade' }),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isCompleted: boolean('is_completed')
    .notNull()
    .default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedByUserId: text('completed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Weekly Check-ins table
export const checkins = pgTable('checkins', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  weekNumber: integer('week_number').notNull(), // ISO week 1-53
  promptOne: text('prompt_one').notNull(),
  promptTwo: text('prompt_two').notNull(),
  status: text('status', { enum: ['pending', 'revealed'] })
    .notNull()
    .default('pending'),
  revealedAt: timestamp('revealed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Check-in answers table (Private until both partners submit, then revealed)
export const checkinAnswers = pgTable(
  'checkin_answers',
  {
    id: text('id').primaryKey(),
    checkinId: text('checkin_id')
      .notNull()
      .references(() => checkins.id, { onDelete: 'cascade' }),
    coupleId: text('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mood: integer('mood').notNull(), // 1 to 5
    answerOne: text('answer_one').notNull(),
    answerTwo: text('answer_two').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    checkinUserUnique: uniqueIndex('checkin_answers_checkin_user_idx').on(
      table.checkinId,
      table.userId
    ),
  })
);

// Memories table (Memory timeline with optional photos)
export const memories = pgTable('memories', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  createdByUserId: text('created_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  memoryDate: text('memory_date').notNull(), // YYYY-MM-DD
  note: text('note'),
  photoPath: text('photo_path'), // Client-side stored or external URL
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Preferences table (Partner preference cards)
export const preferences = pgTable('preferences', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  category: text('category', {
    enum: [
      'favorite_food',
      'love_language',
      'gift_ideas',
      'coffee_order',
      'comfort_movies',
      'pet_peeves',
      'custom',
    ],
  })
    .notNull()
    .default('custom'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Love Notes / Morning Capsules table
export const loveNotes = pgTable('love_notes', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  title: text('title').notNull().default('Morning Love Note'),
  content: text('content').notNull(),
  signOff: text('sign_off').default('Forever yours'),
  paperStyle: text('paper_style').default('butter'), // 'butter' | 'rose' | 'sage' | 'classic'
  tapsCount: integer('taps_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Love Note Replies / Scribbles table
export const loveNoteReplies = pgTable('love_note_replies', {
  id: text('id').primaryKey(),
  noteId: text('note_id')
    .notNull()
    .references(() => loveNotes.id, { onDelete: 'cascade' }),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Daily Prompts for Two table
export const dailyPrompts = pgTable('daily_prompts', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  promptText: text('prompt_text').notNull(),
  dayNumber: integer('day_number').default(312),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Daily Prompt Answers table
export const dailyPromptAnswers = pgTable('daily_prompt_answers', {
  id: text('id').primaryKey(),
  promptId: text('prompt_id')
    .notNull()
    .references(() => dailyPrompts.id, { onDelete: 'cascade' }),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  userName: text('user_name').notNull(),
  answer: text('answer').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Partner Moods table (persistent live mood cards)
export const partnerMoods = pgTable(
  'partner_moods',
  {
    id: text('id').primaryKey(),
    coupleId: text('couple_id')
      .notNull()
      .references(() => couples.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull(),
    label: text('label').notNull(),
    note: text('note'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    coupleUserMoodUnique: uniqueIndex('partner_moods_couple_user_idx').on(
      table.coupleId,
      table.userId
    ),
  })
);

// Period & Cycle Sanctuary Tracker (Cycle logging + BF Care & Advice Guide)
export const cycles = pgTable('cycles', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  loggedByUserId: text('logged_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date'), // YYYY-MM-DD
  periodLength: integer('period_length').notNull().default(5),
  cycleLength: integer('cycle_length').notNull().default(28),
  flow: text('flow', { enum: ['light', 'medium', 'heavy', 'spotting'] }).default('medium'),
  symptoms: text('symptoms').default('[]'), // JSON array: cramps, fatigue, cravings, etc.
  mood: text('mood').default('sensitive'),
  comfortRequest: text('comfort_request'), // Custom signal to BF e.g. "Warm tea & foot massage please"
  notes: text('notes'),
  partnerCareNotified: boolean('partner_care_notified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

