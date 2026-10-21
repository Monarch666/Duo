import crypto from 'crypto';
import { db } from '@/lib/db';
import {
  couples,
  coupleMembers,
  users,
  events,
  lists,
  listItems,
  checkins,
  checkinAnswers,
  memories,
  preferences,
  loveNotes,
  loveNoteReplies,
  dailyPrompts,
  dailyPromptAnswers,
  partnerMoods,
} from '@/lib/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

export class UnauthorizedCoupleAccessError extends Error {
  constructor(message = 'Access denied: Resource does not belong to this couple space.') {
    super(message);
    this.name = 'UnauthorizedCoupleAccessError';
  }
}

export interface DalContext {
  userId: string;
  coupleId: string;
}

/**
 * Creates an authenticated Data Access Layer bound to a verified coupleId.
 * EVERY query made through this DAL is strictly scoped by coupleId.
 */
export function createCoupleDal(context: DalContext) {
  const { userId, coupleId } = context;

  if (!userId || !coupleId) {
    throw new UnauthorizedCoupleAccessError('Invalid DAL context: userId and coupleId are required.');
  }

  return {
    context,

    // ==================== COUPLE SPACE & UNLINK ====================
    couple: {
      async getDetails() {
        const couple = db
          .select()
          .from(couples)
          .where(eq(couples.id, coupleId))
          .get();

        if (!couple) throw new UnauthorizedCoupleAccessError();

        const members = db
          .select({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
            avatarUrl: users.avatarUrl,
            role: coupleMembers.role,
            joinedAt: coupleMembers.joinedAt,
          })
          .from(coupleMembers)
          .innerJoin(users, eq(users.id, coupleMembers.userId))
          .where(eq(coupleMembers.coupleId, coupleId))
          .all();

        const partner = members.find((m) => m.id !== userId);
        const me = members.find((m) => m.id === userId);

        return { couple, members, partner, me };
      },

      async updateAnniversary(anniversaryDate: string) {
        return db
          .update(couples)
          .set({ anniversaryDate, updatedAt: new Date() })
          .where(eq(couples.id, coupleId))
          .returning()
          .get();
      },

      async exportAllData() {
        const couple = db.select().from(couples).where(eq(couples.id, coupleId)).get();
        const coupleEvents = db.select().from(events).where(eq(events.coupleId, coupleId)).all();
        const coupleLists = db.select().from(lists).where(eq(lists.coupleId, coupleId)).all();
        const coupleListItems = db.select().from(listItems).where(eq(listItems.coupleId, coupleId)).all();
        const coupleCheckins = db.select().from(checkins).where(eq(checkins.coupleId, coupleId)).all();
        const coupleAnswers = db.select().from(checkinAnswers).where(eq(checkinAnswers.coupleId, coupleId)).all();
        const coupleMemories = db.select().from(memories).where(eq(memories.coupleId, coupleId)).all();
        const couplePreferences = db.select().from(preferences).where(eq(preferences.coupleId, coupleId)).all();
        const coupleNotes = db.select().from(loveNotes).where(eq(loveNotes.coupleId, coupleId)).all();
        const coupleReplies = db.select().from(loveNoteReplies).where(eq(loveNoteReplies.coupleId, coupleId)).all();
        const couplePrompts = db.select().from(dailyPrompts).where(eq(dailyPrompts.coupleId, coupleId)).all();
        const couplePromptAnswers = db.select().from(dailyPromptAnswers).where(eq(dailyPromptAnswers.coupleId, coupleId)).all();
        const coupleMoods = db.select().from(partnerMoods).where(eq(partnerMoods.coupleId, coupleId)).all();

        return {
          exportedAt: new Date().toISOString(),
          couple,
          events: coupleEvents,
          lists: coupleLists,
          listItems: coupleListItems,
          checkins: coupleCheckins,
          checkinAnswers: coupleAnswers,
          memories: coupleMemories,
          preferences: couplePreferences,
          loveNotes: coupleNotes,
          loveNoteReplies: coupleReplies,
          dailyPrompts: couplePrompts,
          dailyPromptAnswers: couplePromptAnswers,
          partnerMoods: coupleMoods,
        };
      },

      async unlinkAndDestroy() {
        // SQLite foreign keys ON DELETE CASCADE will clean up all child records
        return db.delete(couples).where(eq(couples.id, coupleId)).run();
      },
    },

    // ==================== SHARED CALENDAR EVENTS ====================
    events: {
      async getAll(filters?: { category?: string; month?: string }) {
        let conditions = eq(events.coupleId, coupleId);

        if (filters?.category) {
          conditions = and(conditions, eq(events.category, filters.category as any))!;
        }

        const rows = db
          .select({
            id: events.id,
            coupleId: events.coupleId,
            createdByUserId: events.createdByUserId,
            title: events.title,
            description: events.description,
            category: events.category,
            startAt: events.startAt,
            endAt: events.endAt,
            isAllDay: events.isAllDay,
            location: events.location,
            color: events.color,
            createdAt: events.createdAt,
            creatorName: users.displayName,
          })
          .from(events)
          .innerJoin(users, eq(users.id, events.createdByUserId))
          .where(conditions)
          .orderBy(asc(events.startAt))
          .all();

        if (filters?.month) {
          // filters.month is YYYY-MM
          return rows.filter((r) => r.startAt.startsWith(filters.month!));
        }

        return rows;
      },

      async getById(id: string) {
        return db
          .select()
          .from(events)
          .where(and(eq(events.id, id), eq(events.coupleId, coupleId)))
          .get() ?? null;
      },

      async create(data: {
        title: string;
        description?: string;
        category?: 'anniversary' | 'date_night' | 'trip' | 'reminder' | 'other';
        startAt: string;
        endAt?: string;
        isAllDay?: boolean;
        location?: string;
        color?: string;
      }) {
        const id = crypto.randomUUID();
        const now = new Date();

        return db
          .insert(events)
          .values({
            id,
            coupleId,
            createdByUserId: userId,
            title: data.title,
            description: data.description || null,
            category: data.category || 'date_night',
            startAt: data.startAt,
            endAt: data.endAt || null,
            isAllDay: data.isAllDay ?? false,
            location: data.location || null,
            color: data.color || '#EA4C53',
            createdAt: now,
            updatedAt: now,
          })
          .returning()
          .get();
      },

      async update(
        id: string,
        data: Partial<{
          title: string;
          description: string | null;
          category: 'anniversary' | 'date_night' | 'trip' | 'reminder' | 'other';
          startAt: string;
          endAt: string | null;
          isAllDay: boolean;
          location: string | null;
          color: string;
        }>
      ) {
        const existing = await this.getById(id);
        if (!existing) throw new UnauthorizedCoupleAccessError('Event not found or access denied.');

        return db
          .update(events)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(and(eq(events.id, id), eq(events.coupleId, coupleId)))
          .returning()
          .get();
      },

      async delete(id: string) {
        const existing = await this.getById(id);
        if (!existing) throw new UnauthorizedCoupleAccessError('Event not found or access denied.');

        return db
          .delete(events)
          .where(and(eq(events.id, id), eq(events.coupleId, coupleId)))
          .run();
      },
    },

    // ==================== SHARED LISTS & ITEMS ====================
    lists: {
      async getAll() {
        const coupleLists = db
          .select()
          .from(lists)
          .where(eq(lists.coupleId, coupleId))
          .orderBy(desc(lists.createdAt))
          .all();

        // Attach item counts
        return coupleLists.map((list) => {
          const items = db
            .select({
              total: sql<number>`count(*)`,
              completed: sql<number>`sum(case when is_completed = 1 then 1 else 0 end)`,
            })
            .from(listItems)
            .where(and(eq(listItems.listId, list.id), eq(listItems.coupleId, coupleId)))
            .get();

          return {
            ...list,
            totalItems: items?.total ?? 0,
            completedItems: items?.completed ?? 0,
          };
        });
      },

      async getById(id: string) {
        const list = db
          .select()
          .from(lists)
          .where(and(eq(lists.id, id), eq(lists.coupleId, coupleId)))
          .get();

        if (!list) return null;

        const items = db
          .select()
          .from(listItems)
          .where(and(eq(listItems.listId, id), eq(listItems.coupleId, coupleId)))
          .orderBy(asc(listItems.isCompleted), asc(listItems.sortOrder), desc(listItems.createdAt))
          .all();

        return { ...list, items };
      },

      async create(data: {
        title: string;
        category?: 'date_ideas' | 'gift_ideas' | 'bucket_list' | 'groceries' | 'custom';
        icon?: string;
      }) {
        const id = crypto.randomUUID();
        const now = new Date();

        return db
          .insert(lists)
          .values({
            id,
            coupleId,
            createdByUserId: userId,
            title: data.title,
            category: data.category || 'custom',
            icon: data.icon || 'Heart',
            createdAt: now,
            updatedAt: now,
          })
          .returning()
          .get();
      },

      async delete(id: string) {
        const list = await this.getById(id);
        if (!list) throw new UnauthorizedCoupleAccessError('List not found or access denied.');

        return db
          .delete(lists)
          .where(and(eq(lists.id, id), eq(lists.coupleId, coupleId)))
          .run();
      },
    },

    listItems: {
      async addItem(listId: string, content: string) {
        // Verify list ownership
        const list = db
          .select({ id: lists.id })
          .from(lists)
          .where(and(eq(lists.id, listId), eq(lists.coupleId, coupleId)))
          .get();

        if (!list) throw new UnauthorizedCoupleAccessError('List does not belong to this couple.');

        const id = crypto.randomUUID();
        const now = new Date();

        return db
          .insert(listItems)
          .values({
            id,
            listId,
            coupleId,
            createdByUserId: userId,
            content,
            isCompleted: false,
            createdAt: now,
            updatedAt: now,
          })
          .returning()
          .get();
      },

      async toggleItem(itemId: string, isCompleted: boolean) {
        const item = db
          .select()
          .from(listItems)
          .where(and(eq(listItems.id, itemId), eq(listItems.coupleId, coupleId)))
          .get();

        if (!item) throw new UnauthorizedCoupleAccessError('Item not found or access denied.');

        const now = new Date();
        return db
          .update(listItems)
          .set({
            isCompleted,
            completedAt: isCompleted ? now : null,
            completedByUserId: isCompleted ? userId : null,
            updatedAt: now,
          })
          .where(and(eq(listItems.id, itemId), eq(listItems.coupleId, coupleId)))
          .returning()
          .get();
      },

      async deleteItem(itemId: string) {
        const item = db
          .select()
          .from(listItems)
          .where(and(eq(listItems.id, itemId), eq(listItems.coupleId, coupleId)))
          .get();

        if (!item) throw new UnauthorizedCoupleAccessError('Item not found or access denied.');

        return db
          .delete(listItems)
          .where(and(eq(listItems.id, itemId), eq(listItems.coupleId, coupleId)))
          .run();
      },
    },

    // ==================== WEEKLY CHECK-INS ====================
    checkins: {
      async getOrCreateWeek(
        year: number,
        weekNumber: number,
        defaultPrompts: { promptOne: string; promptTwo: string }
      ) {
        let checkin = db
          .select()
          .from(checkins)
          .where(
            and(
              eq(checkins.coupleId, coupleId),
              eq(checkins.year, year),
              eq(checkins.weekNumber, weekNumber)
            )
          )
          .get();

        if (!checkin) {
          const id = crypto.randomUUID();
          checkin = db
            .insert(checkins)
            .values({
              id,
              coupleId,
              year,
              weekNumber,
              promptOne: defaultPrompts.promptOne,
              promptTwo: defaultPrompts.promptTwo,
              status: 'pending',
            })
            .returning()
            .get();
        }

        return this.getCheckinDetails(checkin.id);
      },

      async getCheckinDetails(checkinId: string) {
        const checkin = db
          .select()
          .from(checkins)
          .where(and(eq(checkins.id, checkinId), eq(checkins.coupleId, coupleId)))
          .get();

        if (!checkin) return null;

        const answers = db
          .select({
            id: checkinAnswers.id,
            userId: checkinAnswers.userId,
            mood: checkinAnswers.mood,
            answerOne: checkinAnswers.answerOne,
            answerTwo: checkinAnswers.answerTwo,
            submittedAt: checkinAnswers.submittedAt,
            userName: users.displayName,
          })
          .from(checkinAnswers)
          .innerJoin(users, eq(users.id, checkinAnswers.userId))
          .where(
            and(
              eq(checkinAnswers.checkinId, checkinId),
              eq(checkinAnswers.coupleId, coupleId)
            )
          )
          .all();

        const myAnswer = answers.find((a) => a.userId === userId) || null;
        const partnerAnswer = answers.find((a) => a.userId !== userId) || null;
        const partnerSubmitted = partnerAnswer !== null;

        // Privacy rule: If status is 'pending', do not reveal partner's text or mood!
        const isRevealed = checkin.status === 'revealed';

        return {
          ...checkin,
          isRevealed,
          myAnswer,
          partnerSubmitted,
          partnerAnswer: isRevealed ? partnerAnswer : null,
          canReveal: myAnswer !== null && partnerSubmitted,
        };
      },

      async submitAnswers(
        checkinId: string,
        data: { mood: number; answerOne: string; answerTwo: string }
      ) {
        const checkin = db
          .select()
          .from(checkins)
          .where(and(eq(checkins.id, checkinId), eq(checkins.coupleId, coupleId)))
          .get();

        if (!checkin) throw new UnauthorizedCoupleAccessError('Check-in not found.');

        const existingAnswer = db
          .select()
          .from(checkinAnswers)
          .where(
            and(
              eq(checkinAnswers.checkinId, checkinId),
              eq(checkinAnswers.userId, userId),
              eq(checkinAnswers.coupleId, coupleId)
            )
          )
          .get();

        const now = new Date();
        if (existingAnswer) {
          db.update(checkinAnswers)
            .set({
              mood: data.mood,
              answerOne: data.answerOne,
              answerTwo: data.answerTwo,
              submittedAt: now,
            })
            .where(eq(checkinAnswers.id, existingAnswer.id))
            .run();
        } else {
          db.insert(checkinAnswers)
            .values({
              id: crypto.randomUUID(),
              checkinId,
              coupleId,
              userId,
              mood: data.mood,
              answerOne: data.answerOne,
              answerTwo: data.answerTwo,
              submittedAt: now,
            })
            .run();
        }

        // Check if both partners have now submitted
        const allAnswers = db
          .select()
          .from(checkinAnswers)
          .where(
            and(
              eq(checkinAnswers.checkinId, checkinId),
              eq(checkinAnswers.coupleId, coupleId)
            )
          )
          .all();

        // Exactly 2 partners in a couple
        let revealedNow = false;
        if (allAnswers.length >= 2 && checkin.status !== 'revealed') {
          db.update(checkins)
            .set({ status: 'revealed', revealedAt: now })
            .where(eq(checkins.id, checkinId))
            .run();
          revealedNow = true;
        }

        return { success: true, revealedNow };
      },

      async getHistory() {
        const rows = db
          .select()
          .from(checkins)
          .where(
            and(
              eq(checkins.coupleId, coupleId),
              eq(checkins.status, 'revealed')
            )
          )
          .orderBy(desc(checkins.year), desc(checkins.weekNumber))
          .all();

        return Promise.all(rows.map((r) => this.getCheckinDetails(r.id)));
      },
    },

    // ==================== MEMORIES TIMELINE ====================
    memories: {
      async getAll() {
        return db
          .select({
            id: memories.id,
            coupleId: memories.coupleId,
            createdByUserId: memories.createdByUserId,
            title: memories.title,
            memoryDate: memories.memoryDate,
            note: memories.note,
            photoPath: memories.photoPath,
            createdAt: memories.createdAt,
            creatorName: users.displayName,
          })
          .from(memories)
          .innerJoin(users, eq(users.id, memories.createdByUserId))
          .where(eq(memories.coupleId, coupleId))
          .orderBy(desc(memories.memoryDate), desc(memories.createdAt))
          .all();
      },

      async getById(id: string) {
        return db
          .select()
          .from(memories)
          .where(and(eq(memories.id, id), eq(memories.coupleId, coupleId)))
          .get() ?? null;
      },

      async create(data: {
        title: string;
        memoryDate: string;
        note?: string;
        photoPath?: string;
      }) {
        const id = crypto.randomUUID();
        const now = new Date();

        return db
          .insert(memories)
          .values({
            id,
            coupleId,
            createdByUserId: userId,
            title: data.title,
            memoryDate: data.memoryDate,
            note: data.note || null,
            photoPath: data.photoPath || null,
            createdAt: now,
            updatedAt: now,
          })
          .returning()
          .get();
      },

      async delete(id: string) {
        const item = await this.getById(id);
        if (!item) throw new UnauthorizedCoupleAccessError('Memory not found or access denied.');

        return db
          .delete(memories)
          .where(and(eq(memories.id, id), eq(memories.coupleId, coupleId)))
          .run();
      },
    },

    // ==================== PREFERENCES CARDS ====================
    preferences: {
      async getAll() {
        return db
          .select({
            id: preferences.id,
            coupleId: preferences.coupleId,
            userId: preferences.userId,
            category: preferences.category,
            title: preferences.title,
            content: preferences.content,
            updatedAt: preferences.updatedAt,
            userName: users.displayName,
          })
          .from(preferences)
          .innerJoin(users, eq(users.id, preferences.userId))
          .where(eq(preferences.coupleId, coupleId))
          .orderBy(preferences.category, preferences.title)
          .all();
      },

      async upsert(data: {
        id?: string;
        category: 'favorite_food' | 'love_language' | 'gift_ideas' | 'coffee_order' | 'comfort_movies' | 'pet_peeves' | 'custom';
        title: string;
        content: string;
      }) {
        const now = new Date();

        if (data.id) {
          const existing = db
            .select()
            .from(preferences)
            .where(
              and(
                eq(preferences.id, data.id),
                eq(preferences.coupleId, coupleId),
                eq(preferences.userId, userId)
              )
            )
            .get();

          if (!existing) {
            throw new UnauthorizedCoupleAccessError('Cannot update preference not owned by you.');
          }

          return db
            .update(preferences)
            .set({
              category: data.category,
              title: data.title,
              content: data.content,
              updatedAt: now,
            })
            .where(eq(preferences.id, data.id))
            .returning()
            .get();
        }

        const id = crypto.randomUUID();
        return db
          .insert(preferences)
          .values({
            id,
            coupleId,
            userId,
            category: data.category,
            title: data.title,
            content: data.content,
            updatedAt: now,
          })
          .returning()
          .get();
      },

      async delete(id: string) {
        const existing = db
          .select()
          .from(preferences)
          .where(
            and(
              eq(preferences.id, id),
              eq(preferences.coupleId, coupleId),
              eq(preferences.userId, userId)
            )
          )
          .get();

        if (!existing) {
          throw new UnauthorizedCoupleAccessError('Preference not found or not owned by you.');
        }

        return db.delete(preferences).where(eq(preferences.id, id)).run();
      },
    },

    // ==================== LOVE NOTES & CAPSULES ====================
    loveNotes: {
      async getAll() {
        const notes = db
          .select()
          .from(loveNotes)
          .where(eq(loveNotes.coupleId, coupleId))
          .orderBy(desc(loveNotes.createdAt))
          .all();

        const replies = db
          .select()
          .from(loveNoteReplies)
          .where(eq(loveNoteReplies.coupleId, coupleId))
          .orderBy(asc(loveNoteReplies.createdAt))
          .all();

        return notes.map((note) => ({
          ...note,
          replies: replies.filter((r) => r.noteId === note.id),
        }));
      },

      async getLatest() {
        const all = await this.getAll();
        return all[0] || null;
      },

      async create(data: {
        title?: string;
        content: string;
        signOff?: string;
        paperStyle?: string;
      }) {
        const userRecord = db.select().from(users).where(eq(users.id, userId)).get();
        const id = crypto.randomUUID();

        const inserted = db
          .insert(loveNotes)
          .values({
            id,
            coupleId,
            authorUserId: userId,
            authorName: userRecord?.displayName || 'Partner',
            title: data.title || 'Morning Love Note',
            content: data.content,
            signOff: data.signOff || 'Forever yours',
            paperStyle: data.paperStyle || 'butter',
            tapsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
          .get();

        return { ...inserted, replies: [] };
      },

      async tap(noteId: string) {
        const note = db
          .select()
          .from(loveNotes)
          .where(and(eq(loveNotes.id, noteId), eq(loveNotes.coupleId, coupleId)))
          .get();

        if (!note) {
          throw new UnauthorizedCoupleAccessError('Love note not found in this space.');
        }

        const updated = db
          .update(loveNotes)
          .set({ tapsCount: note.tapsCount + 1, updatedAt: new Date() })
          .where(eq(loveNotes.id, noteId))
          .returning()
          .get();

        return updated;
      },

      async addReply(data: { noteId: string; content: string }) {
        const userRecord = db.select().from(users).where(eq(users.id, userId)).get();
        const id = crypto.randomUUID();

        const note = db
          .select()
          .from(loveNotes)
          .where(and(eq(loveNotes.id, data.noteId), eq(loveNotes.coupleId, coupleId)))
          .get();

        if (!note) {
          throw new UnauthorizedCoupleAccessError('Love note not found in this space.');
        }

        const reply = db
          .insert(loveNoteReplies)
          .values({
            id,
            noteId: data.noteId,
            coupleId,
            authorUserId: userId,
            authorName: userRecord?.displayName || 'Partner',
            content: data.content,
            createdAt: new Date(),
          })
          .returning()
          .get();

        return reply;
      },

      async delete(noteId: string) {
        const note = db
          .select()
          .from(loveNotes)
          .where(and(eq(loveNotes.id, noteId), eq(loveNotes.coupleId, coupleId)))
          .get();

        if (!note) {
          throw new UnauthorizedCoupleAccessError('Love note not found in this space.');
        }

        return db.delete(loveNotes).where(eq(loveNotes.id, noteId)).run();
      },
    },

    // ==================== DAILY PROMPTS FOR TWO ====================
    dailyPrompts: {
      async getLatest() {
        let latest = db
          .select()
          .from(dailyPrompts)
          .where(eq(dailyPrompts.coupleId, coupleId))
          .orderBy(desc(dailyPrompts.createdAt))
          .get();

        // If no prompt exists yet, seed an initial romantic prompt
        if (!latest) {
          const userRecord = db.select().from(users).where(eq(users.id, userId)).get();
          const id = crypto.randomUUID();
          latest = db
            .insert(dailyPrompts)
            .values({
              id,
              coupleId,
              authorUserId: userId,
              promptText:
                'If we could teleport to any little bakery or coffee shop anywhere in the world this evening, where would we sit and what treat would we share?',
              dayNumber: 312,
              createdAt: new Date(),
            })
            .returning()
            .get();
        }

        const answers = db
          .select()
          .from(dailyPromptAnswers)
          .where(and(eq(dailyPromptAnswers.promptId, latest.id), eq(dailyPromptAnswers.coupleId, coupleId)))
          .orderBy(asc(dailyPromptAnswers.createdAt))
          .all();

        return { ...latest, answers };
      },

      async create(promptText: string) {
        const id = crypto.randomUUID();
        const currentCount = db
          .select()
          .from(dailyPrompts)
          .where(eq(dailyPrompts.coupleId, coupleId))
          .all().length;

        const inserted = db
          .insert(dailyPrompts)
          .values({
            id,
            coupleId,
            authorUserId: userId,
            promptText,
            dayNumber: 312 + currentCount,
            createdAt: new Date(),
          })
          .returning()
          .get();

        return { ...inserted, answers: [] };
      },

      async answer(data: { promptId: string; answer: string }) {
        const userRecord = db.select().from(users).where(eq(users.id, userId)).get();
        const existing = db
          .select()
          .from(dailyPromptAnswers)
          .where(
            and(
              eq(dailyPromptAnswers.promptId, data.promptId),
              eq(dailyPromptAnswers.userId, userId)
            )
          )
          .get();

        if (existing) {
          return db
            .update(dailyPromptAnswers)
            .set({ answer: data.answer, createdAt: new Date() })
            .where(eq(dailyPromptAnswers.id, existing.id))
            .returning()
            .get();
        }

        const id = crypto.randomUUID();
        return db
          .insert(dailyPromptAnswers)
          .values({
            id,
            promptId: data.promptId,
            coupleId,
            userId,
            userName: userRecord?.displayName || 'Partner',
            answer: data.answer,
            createdAt: new Date(),
          })
          .returning()
          .get();
      },
    },

    // ==================== PARTNER MOODS ====================
    partnerMoods: {
      async getAll() {
        return db
          .select()
          .from(partnerMoods)
          .where(eq(partnerMoods.coupleId, coupleId))
          .all();
      },

      async update(data: { emoji: string; label: string; note?: string }) {
        const existing = db
          .select()
          .from(partnerMoods)
          .where(and(eq(partnerMoods.coupleId, coupleId), eq(partnerMoods.userId, userId)))
          .get();

        if (existing) {
          return db
            .update(partnerMoods)
            .set({
              emoji: data.emoji,
              label: data.label,
              note: data.note || null,
              updatedAt: new Date(),
            })
            .where(eq(partnerMoods.id, existing.id))
            .returning()
            .get();
        }

        const id = crypto.randomUUID();
        return db
          .insert(partnerMoods)
          .values({
            id,
            coupleId,
            userId,
            emoji: data.emoji,
            label: data.label,
            note: data.note || null,
            updatedAt: new Date(),
          })
          .returning()
          .get();
      },
    },
  };
}
