import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Sessions table (stored in SQLite, httpOnly cookie)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});

// Login rate limiting table (track failed attempts per email/ip)
export const loginAttempts = sqliteTable('login_attempts', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(), // e.g. email:ip
  attemptCount: integer('attempt_count').notNull().default(0),
  lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
});

// Couples space table
export const couples = sqliteTable('couples', {
  id: text('id').primaryKey(),
  inviteCode: text('invite_code').notNull().unique(),
  inviteCodeCreatedAt: integer('invite_code_created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  anniversaryDate: text('anniversary_date'), // YYYY-MM-DD
  status: text('status', { enum: ['pending', 'paired'] })
    .notNull()
    .default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Couple members table (Hard limit of 2 enforced in code & pair action)
export const coupleMembers = sqliteTable(
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
    joinedAt: integer('joined_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    coupleUserUnique: uniqueIndex('couple_members_couple_user_idx').on(
      table.coupleId,
      table.userId
    ),
  })
);

// Events table (Shared calendar)
export const events = sqliteTable('events', {
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
  isAllDay: integer('is_all_day', { mode: 'boolean' }).notNull().default(false),
  location: text('location'),
  color: text('color').default('#EA4C53'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Lists table (Date ideas, gift ideas, bucket list, groceries, custom)
export const lists = sqliteTable('lists', {
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
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// List items table (Checkable items inside lists)
export const listItems = sqliteTable('list_items', {
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
  isCompleted: integer('is_completed', { mode: 'boolean' })
    .notNull()
    .default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  completedByUserId: text('completed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Weekly Check-ins table
export const checkins = sqliteTable('checkins', {
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
  revealedAt: integer('revealed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Check-in answers table (Private until both partners submit, then revealed)
export const checkinAnswers = sqliteTable(
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
    submittedAt: integer('submitted_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    checkinUserUnique: uniqueIndex('checkin_answers_checkin_user_idx').on(
      table.checkinId,
      table.userId
    ),
  })
);

// Memories table (Memory timeline with optional photos)
export const memories = sqliteTable('memories', {
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
  photoPath: text('photo_path'), // Saved filename in ./data/uploads
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Preferences table (Partner preference cards)
export const preferences = sqliteTable('preferences', {
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
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Love Notes / Morning Capsules table
export const loveNotes = sqliteTable('love_notes', {
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
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Love Note Replies / Scribbles table
export const loveNoteReplies = sqliteTable('love_note_replies', {
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
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Daily Prompts for Two table
export const dailyPrompts = sqliteTable('daily_prompts', {
  id: text('id').primaryKey(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  promptText: text('prompt_text').notNull(),
  dayNumber: integer('day_number').default(312),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Daily Prompt Answers table
export const dailyPromptAnswers = sqliteTable('daily_prompt_answers', {
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
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

// Partner Moods table (persistent live mood cards)
export const partnerMoods = sqliteTable(
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
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    coupleUserMoodUnique: uniqueIndex('partner_moods_couple_user_idx').on(
      table.coupleId,
      table.userId
    ),
  })
);
