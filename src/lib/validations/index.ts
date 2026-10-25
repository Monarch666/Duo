import { z } from 'zod';

// ==================== AUTH VALIDATIONS ====================
export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be under 128 characters'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(60, 'Name must be under 60 characters'),
});

export const logInSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// ==================== COUPLE / PAIRING VALIDATIONS ====================
export const createCoupleSchema = z.object({
  anniversaryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
});

export const joinCoupleSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, 'Invite code must be at least 4 characters')
    .max(16, 'Invalid invite code'),
});

// ==================== CALENDAR EVENT VALIDATIONS ====================
export const eventCategoryEnum = z.enum([
  'anniversary',
  'date_night',
  'trip',
  'reminder',
  'other',
]);

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Event title is required')
    .max(120, 'Title is too long'),
  description: z.string().trim().max(1000).optional(),
  category: eventCategoryEnum.default('date_night'),
  startAt: z.string().min(1, 'Start time/date is required'),
  endAt: z.string().optional().or(z.literal('')),
  isAllDay: z.boolean().default(false),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color code').default('#EA4C53'),
});

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().min(1),
});

// ==================== LIST & ITEMS VALIDATIONS ====================
export const listCategoryEnum = z.enum([
  'date_ideas',
  'gift_ideas',
  'bucket_list',
  'groceries',
  'custom',
]);

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'List title is required').max(80),
  category: listCategoryEnum.default('custom'),
  icon: z.string().max(40).default('Heart'),
});

export const createListItemSchema = z.object({
  listId: z.string().min(1),
  content: z.string().trim().min(1, 'Item content is required').max(300),
});

export const toggleListItemSchema = z.object({
  itemId: z.string().min(1),
  isCompleted: z.boolean(),
});

// ==================== CHECK-IN VALIDATIONS ====================
export const submitCheckinSchema = z.object({
  checkinId: z.string().min(1),
  mood: z.number().int().min(1).max(5),
  answerOne: z.string().trim().min(1, 'Answer 1 cannot be empty').max(1000),
  answerTwo: z.string().trim().min(1, 'Answer 2 cannot be empty').max(1000),
});

// ==================== MEMORY VALIDATIONS ====================
export const createMemorySchema = z.object({
  title: z.string().trim().min(1, 'Memory title is required').max(120),
  memoryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  note: z.string().trim().max(2000).optional(),
});

// ==================== PREFERENCE VALIDATIONS ====================
export const preferenceCategoryEnum = z.enum([
  'favorite_food',
  'love_language',
  'gift_ideas',
  'coffee_order',
  'comfort_movies',
  'pet_peeves',
  'custom',
]);

export const upsertPreferenceSchema = z.object({
  id: z.string().optional(),
  category: preferenceCategoryEnum,
  title: z.string().trim().min(1, 'Title is required').max(80),
  content: z.string().trim().min(1, 'Content is required').max(1000),
});

// ==================== LOVE NOTE VALIDATIONS ====================
export const createLoveNoteSchema = z.object({
  title: z.string().trim().max(80).default('Morning Love Note'),
  content: z.string().trim().min(1, 'Please write your love note').max(2000),
  signOff: z.string().trim().max(60).default('Forever yours'),
  paperStyle: z.enum(['butter', 'rose', 'sage', 'classic']).default('butter'),
});

export const replyLoveNoteSchema = z.object({
  noteId: z.string().min(1),
  content: z.string().trim().min(1, 'Scribble cannot be empty').max(300),
});

// ==================== DAILY PROMPT VALIDATIONS ====================
export const createDailyPromptSchema = z.object({
  promptText: z.string().trim().min(5, 'Question must be at least 5 characters').max(300),
});

export const answerDailyPromptSchema = z.object({
  promptId: z.string().min(1),
  answer: z.string().trim().min(1, 'Reflection cannot be empty').max(1000),
});

// ==================== PARTNER MOOD VALIDATIONS ====================
export const updatePartnerMoodSchema = z.object({
  emoji: z.string().min(1).max(8),
  label: z.string().trim().min(1).max(50),
  note: z.string().trim().max(200).optional(),
});

// ==================== ONBOARDING BLUEPRINT VALIDATIONS ====================
export const onboardingSchema = z.object({
  anniversaryDate: z.string().optional().or(z.literal('')),
  meetPlace: z.string().trim().max(160).optional(),
  loveLanguage: z.string().trim().min(1, 'Please select your primary love language'),
  comfortFood: z.string().trim().min(1, 'Please share your comfort food or craving').max(200),
  comfortCheerUp: z.string().trim().max(300).optional(),
  dreamDates: z.array(z.string().trim()).min(1, 'Please choose or add at least one dream date'),
  bucketListDream: z.string().trim().min(1, 'Please share a bucket list dream').max(250),
  nextDateTitle: z.string().trim().max(100).optional(),
  nextDateStartAt: z.string().optional().or(z.literal('')),
  nextDateCategory: eventCategoryEnum.default('date_night'),
  welcomeNote: z.string().trim().max(1000).optional(),
  welcomeNoteStyle: z.enum(['butter', 'rose', 'sage', 'classic']).default('butter'),
  welcomeNoteSignOff: z.string().trim().max(60).optional(),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

// ==================== CYCLE & PERIOD VALIDATIONS ====================
export const logCycleSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional().or(z.literal('')),
  periodLength: z.coerce.number().int().min(1).max(14).default(5),
  cycleLength: z.coerce.number().int().min(18).max(60).default(28),
  flow: z.enum(['light', 'medium', 'heavy', 'spotting']).default('medium'),
  symptoms: z.array(z.string()).default([]),
  mood: z.string().trim().max(60).default('sensitive'),
  comfortRequest: z.string().trim().max(300).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type LogCycleInput = z.infer<typeof logCycleSchema>;

