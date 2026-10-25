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
  cycles,
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
        const [couple] = await db
          .select()
          .from(couples)
          .where(eq(couples.id, coupleId));

        if (!couple) throw new UnauthorizedCoupleAccessError();

        const members = await db
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
          .where(eq(coupleMembers.coupleId, coupleId));

        const partner = members.find((m) => m.id !== userId);
        const me = members.find((m) => m.id === userId);

        return { couple, members, partner, me };
      },

      async updateAnniversary(anniversaryDate: string) {
        const [updated] = await db
          .update(couples)
          .set({ anniversaryDate, updatedAt: new Date() })
          .where(eq(couples.id, coupleId))
          .returning();
        return updated;
      },

      async exportAllData() {
        const [couple] = await db.select().from(couples).where(eq(couples.id, coupleId));
        const coupleEvents = await db.select().from(events).where(eq(events.coupleId, coupleId));
        const coupleLists = await db.select().from(lists).where(eq(lists.coupleId, coupleId));
        const coupleListItems = await db.select().from(listItems).where(eq(listItems.coupleId, coupleId));
        const coupleCheckins = await db.select().from(checkins).where(eq(checkins.coupleId, coupleId));
        const coupleAnswers = await db.select().from(checkinAnswers).where(eq(checkinAnswers.coupleId, coupleId));
        const coupleMemories = await db.select().from(memories).where(eq(memories.coupleId, coupleId));
        const couplePreferences = await db.select().from(preferences).where(eq(preferences.coupleId, coupleId));
        const coupleNotes = await db.select().from(loveNotes).where(eq(loveNotes.coupleId, coupleId));
        const coupleReplies = await db.select().from(loveNoteReplies).where(eq(loveNoteReplies.coupleId, coupleId));
        const couplePrompts = await db.select().from(dailyPrompts).where(eq(dailyPrompts.coupleId, coupleId));
        const couplePromptAnswers = await db.select().from(dailyPromptAnswers).where(eq(dailyPromptAnswers.coupleId, coupleId));
        const coupleMoods = await db.select().from(partnerMoods).where(eq(partnerMoods.coupleId, coupleId));
        const coupleCycles = await db.select().from(cycles).where(eq(cycles.coupleId, coupleId));

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
          cycles: coupleCycles,
        };
      },

      async unlinkAndDestroy() {
        // PostgreSQL foreign keys ON DELETE CASCADE will clean up all child records
        await db.delete(couples).where(eq(couples.id, coupleId));
      },
    },

    // ==================== SHARED CALENDAR EVENTS ====================
    events: {
      async getAll(filters?: { category?: string; month?: string }) {
        let conditions = eq(events.coupleId, coupleId);

        if (filters?.category) {
          conditions = and(conditions, eq(events.category, filters.category as any))!;
        }

        const rows = await db
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
          .orderBy(asc(events.startAt));

        if (filters?.month) {
          // filters.month is YYYY-MM
          return rows.filter((r) => r.startAt.startsWith(filters.month!));
        }

        return rows;
      },

      async getById(id: string) {
        const [row] = await db
          .select()
          .from(events)
          .where(and(eq(events.id, id), eq(events.coupleId, coupleId)));
        return row ?? null;
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

        const [row] = await db
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
          .returning();
        return row;
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

        const [row] = await db
          .update(events)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(and(eq(events.id, id), eq(events.coupleId, coupleId)))
          .returning();
        return row;
      },

      async delete(id: string) {
        const existing = await this.getById(id);
        if (!existing) throw new UnauthorizedCoupleAccessError('Event not found or access denied.');

        await db
          .delete(events)
          .where(and(eq(events.id, id), eq(events.coupleId, coupleId)));
      },
    },

    // ==================== SHARED LISTS & ITEMS ====================
    lists: {
      async getAll() {
        const coupleLists = await db
          .select()
          .from(lists)
          .where(eq(lists.coupleId, coupleId))
          .orderBy(desc(lists.createdAt));

        if (coupleLists.length === 0) return [];

        const counts = await db
          .select({
            listId: listItems.listId,
            total: sql<number>`count(*)::int`,
            completed: sql<number>`count(case when is_completed = true then 1 end)::int`,
          })
          .from(listItems)
          .where(eq(listItems.coupleId, coupleId))
          .groupBy(listItems.listId);

        const countMap = new Map<string, { total: number; completed: number }>();
        for (const c of counts) {
          countMap.set(c.listId, { total: Number(c.total) || 0, completed: Number(c.completed) || 0 });
        }

        return coupleLists.map((list) => {
          const c = countMap.get(list.id);
          return {
            ...list,
            totalItems: c?.total ?? 0,
            completedItems: c?.completed ?? 0,
          };
        });
      },

      async getById(id: string) {
        const [list] = await db
          .select()
          .from(lists)
          .where(and(eq(lists.id, id), eq(lists.coupleId, coupleId)));

        if (!list) return null;

        const items = await db
          .select()
          .from(listItems)
          .where(and(eq(listItems.listId, id), eq(listItems.coupleId, coupleId)))
          .orderBy(asc(listItems.isCompleted), asc(listItems.sortOrder), desc(listItems.createdAt));

        return { ...list, items };
      },

      async create(data: {
        title: string;
        category?: 'date_ideas' | 'gift_ideas' | 'bucket_list' | 'groceries' | 'custom';
        icon?: string;
      }) {
        const id = crypto.randomUUID();
        const now = new Date();

        const [row] = await db
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
          .returning();
        return row;
      },

      async delete(id: string) {
        const list = await this.getById(id);
        if (!list) throw new UnauthorizedCoupleAccessError('List not found or access denied.');

        await db
          .delete(lists)
          .where(and(eq(lists.id, id), eq(lists.coupleId, coupleId)));
      },
    },

    listItems: {
      async addItem(listId: string, content: string) {
        // Verify list ownership
        const [list] = await db
          .select({ id: lists.id })
          .from(lists)
          .where(and(eq(lists.id, listId), eq(lists.coupleId, coupleId)));

        if (!list) throw new UnauthorizedCoupleAccessError('List does not belong to this couple.');

        const id = crypto.randomUUID();
        const now = new Date();

        const [row] = await db
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
          .returning();
        return row;
      },

      async toggleItem(itemId: string, isCompleted: boolean) {
        const [item] = await db
          .select()
          .from(listItems)
          .where(and(eq(listItems.id, itemId), eq(listItems.coupleId, coupleId)));

        if (!item) throw new UnauthorizedCoupleAccessError('Item not found or access denied.');

        const now = new Date();
        const [row] = await db
          .update(listItems)
          .set({
            isCompleted,
            completedAt: isCompleted ? now : null,
            completedByUserId: isCompleted ? userId : null,
            updatedAt: now,
          })
          .where(and(eq(listItems.id, itemId), eq(listItems.coupleId, coupleId)))
          .returning();
        return row;
      },

      async deleteItem(itemId: string) {
        const [item] = await db
          .select()
          .from(listItems)
          .where(and(eq(listItems.id, itemId), eq(listItems.coupleId, coupleId)));

        if (!item) throw new UnauthorizedCoupleAccessError('Item not found or access denied.');

        await db
          .delete(listItems)
          .where(and(eq(listItems.id, itemId), eq(listItems.coupleId, coupleId)));
      },
    },

    // ==================== WEEKLY CHECK-INS ====================
    checkins: {
      async getOrCreateWeek(
        year: number,
        weekNumber: number,
        defaultPrompts: { promptOne: string; promptTwo: string }
      ) {
        let [checkin] = await db
          .select()
          .from(checkins)
          .where(
            and(
              eq(checkins.coupleId, coupleId),
              eq(checkins.year, year),
              eq(checkins.weekNumber, weekNumber)
            )
          );

        if (!checkin) {
          const id = crypto.randomUUID();
          [checkin] = await db
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
            .returning();
        }

        return this.getCheckinDetails(checkin.id);
      },

      async getCheckinDetails(checkinId: string) {
        const [checkin] = await db
          .select()
          .from(checkins)
          .where(and(eq(checkins.id, checkinId), eq(checkins.coupleId, coupleId)));

        if (!checkin) return null;

        const answers = await db
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
          );

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
        const [checkin] = await db
          .select()
          .from(checkins)
          .where(and(eq(checkins.id, checkinId), eq(checkins.coupleId, coupleId)));

        if (!checkin) throw new UnauthorizedCoupleAccessError('Check-in not found.');

        const [existingAnswer] = await db
          .select()
          .from(checkinAnswers)
          .where(
            and(
              eq(checkinAnswers.checkinId, checkinId),
              eq(checkinAnswers.userId, userId),
              eq(checkinAnswers.coupleId, coupleId)
            )
          );

        const now = new Date();
        if (existingAnswer) {
          await db.update(checkinAnswers)
            .set({
              mood: data.mood,
              answerOne: data.answerOne,
              answerTwo: data.answerTwo,
              submittedAt: now,
            })
            .where(eq(checkinAnswers.id, existingAnswer.id));
        } else {
          await db.insert(checkinAnswers)
            .values({
              id: crypto.randomUUID(),
              checkinId,
              coupleId,
              userId,
              mood: data.mood,
              answerOne: data.answerOne,
              answerTwo: data.answerTwo,
              submittedAt: now,
            });
        }

        // Check if both partners have now submitted
        const allAnswers = await db
          .select()
          .from(checkinAnswers)
          .where(
            and(
              eq(checkinAnswers.checkinId, checkinId),
              eq(checkinAnswers.coupleId, coupleId)
            )
          );

        // Exactly 2 partners in a couple
        let revealedNow = false;
        if (allAnswers.length >= 2 && checkin.status !== 'revealed') {
          await db.update(checkins)
            .set({ status: 'revealed', revealedAt: now })
            .where(eq(checkins.id, checkinId));
          revealedNow = true;
        }

        return { success: true, revealedNow };
      },

      async getHistory() {
        const rows = await db
          .select()
          .from(checkins)
          .where(
            and(
              eq(checkins.coupleId, coupleId),
              eq(checkins.status, 'revealed')
            )
          )
          .orderBy(desc(checkins.year), desc(checkins.weekNumber));

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
          .orderBy(desc(memories.memoryDate), desc(memories.createdAt));
      },

      async getById(id: string) {
        const [row] = await db
          .select()
          .from(memories)
          .where(and(eq(memories.id, id), eq(memories.coupleId, coupleId)));
        return row ?? null;
      },

      async create(data: {
        title: string;
        memoryDate: string;
        note?: string;
        photoPath?: string;
      }) {
        const id = crypto.randomUUID();
        const now = new Date();

        const [row] = await db
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
          .returning();
        return row;
      },

      async delete(id: string) {
        const item = await this.getById(id);
        if (!item) throw new UnauthorizedCoupleAccessError('Memory not found or access denied.');

        await db
          .delete(memories)
          .where(and(eq(memories.id, id), eq(memories.coupleId, coupleId)));
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
          .orderBy(preferences.category, preferences.title);
      },

      async upsert(data: {
        id?: string;
        category: 'favorite_food' | 'love_language' | 'gift_ideas' | 'coffee_order' | 'comfort_movies' | 'pet_peeves' | 'custom';
        title: string;
        content: string;
      }) {
        const now = new Date();

        if (data.id) {
          const [existing] = await db
            .select()
            .from(preferences)
            .where(
              and(
                eq(preferences.id, data.id),
                eq(preferences.coupleId, coupleId),
                eq(preferences.userId, userId)
              )
            );

          if (!existing) {
            throw new UnauthorizedCoupleAccessError('Cannot update preference not owned by you.');
          }

          const [row] = await db
            .update(preferences)
            .set({
              category: data.category,
              title: data.title,
              content: data.content,
              updatedAt: now,
            })
            .where(eq(preferences.id, data.id))
            .returning();
          return row;
        }

        const id = crypto.randomUUID();
        const [row] = await db
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
          .returning();
        return row;
      },

      async delete(id: string) {
        const [existing] = await db
          .select()
          .from(preferences)
          .where(
            and(
              eq(preferences.id, id),
              eq(preferences.coupleId, coupleId),
              eq(preferences.userId, userId)
            )
          );

        if (!existing) {
          throw new UnauthorizedCoupleAccessError('Preference not found or not owned by you.');
        }

        await db.delete(preferences).where(eq(preferences.id, id));
      },
    },

    // ==================== LOVE NOTES & CAPSULES ====================
    loveNotes: {
      async getAll() {
        const notes = await db
          .select()
          .from(loveNotes)
          .where(eq(loveNotes.coupleId, coupleId))
          .orderBy(desc(loveNotes.createdAt));

        const replies = await db
          .select()
          .from(loveNoteReplies)
          .where(eq(loveNoteReplies.coupleId, coupleId))
          .orderBy(asc(loveNoteReplies.createdAt));

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
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId));
        const id = crypto.randomUUID();

        const [inserted] = await db
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
          .returning();

        return { ...inserted, replies: [] };
      },

      async tap(noteId: string) {
        const [note] = await db
          .select()
          .from(loveNotes)
          .where(and(eq(loveNotes.id, noteId), eq(loveNotes.coupleId, coupleId)));

        if (!note) {
          throw new UnauthorizedCoupleAccessError('Love note not found in this space.');
        }

        const [updated] = await db
          .update(loveNotes)
          .set({ tapsCount: note.tapsCount + 1, updatedAt: new Date() })
          .where(eq(loveNotes.id, noteId))
          .returning();

        return updated;
      },

      async addReply(data: { noteId: string; content: string }) {
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId));
        const id = crypto.randomUUID();

        const [note] = await db
          .select()
          .from(loveNotes)
          .where(and(eq(loveNotes.id, data.noteId), eq(loveNotes.coupleId, coupleId)));

        if (!note) {
          throw new UnauthorizedCoupleAccessError('Love note not found in this space.');
        }

        const [reply] = await db
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
          .returning();

        return reply;
      },

      async delete(noteId: string) {
        const [note] = await db
          .select()
          .from(loveNotes)
          .where(and(eq(loveNotes.id, noteId), eq(loveNotes.coupleId, coupleId)));

        if (!note) {
          throw new UnauthorizedCoupleAccessError('Love note not found in this space.');
        }

        await db.delete(loveNotes).where(eq(loveNotes.id, noteId));
      },
    },

    // ==================== DAILY PROMPTS FOR TWO ====================
    dailyPrompts: {
      async getLatest() {
        let [latest] = await db
          .select()
          .from(dailyPrompts)
          .where(eq(dailyPrompts.coupleId, coupleId))
          .orderBy(desc(dailyPrompts.createdAt))
          .limit(1);

        // If no prompt exists yet, seed an initial romantic prompt
        if (!latest) {
          const [userRecord] = await db.select().from(users).where(eq(users.id, userId));
          const id = crypto.randomUUID();
          [latest] = await db
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
            .returning();
        }

        const answers = await db
          .select()
          .from(dailyPromptAnswers)
          .where(and(eq(dailyPromptAnswers.promptId, latest.id), eq(dailyPromptAnswers.coupleId, coupleId)))
          .orderBy(asc(dailyPromptAnswers.createdAt));

        return { ...latest, answers };
      },

      async create(promptText: string) {
        const id = crypto.randomUUID();
        const currentPrompts = await db
          .select()
          .from(dailyPrompts)
          .where(eq(dailyPrompts.coupleId, coupleId));
        const currentCount = currentPrompts.length;

        const [inserted] = await db
          .insert(dailyPrompts)
          .values({
            id,
            coupleId,
            authorUserId: userId,
            promptText,
            dayNumber: 312 + currentCount,
            createdAt: new Date(),
          })
          .returning();

        return { ...inserted, answers: [] };
      },

      async answer(data: { promptId: string; answer: string }) {
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId));
        const [existing] = await db
          .select()
          .from(dailyPromptAnswers)
          .where(
            and(
              eq(dailyPromptAnswers.promptId, data.promptId),
              eq(dailyPromptAnswers.userId, userId)
            )
          );

        if (existing) {
          const [updated] = await db
            .update(dailyPromptAnswers)
            .set({ answer: data.answer, createdAt: new Date() })
            .where(eq(dailyPromptAnswers.id, existing.id))
            .returning();
          return updated;
        }

        const id = crypto.randomUUID();
        const [row] = await db
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
          .returning();
        return row;
      },
    },

    // ==================== PARTNER MOODS ====================
    partnerMoods: {
      async getAll() {
        return db
          .select()
          .from(partnerMoods)
          .where(eq(partnerMoods.coupleId, coupleId));
      },

      async update(data: { emoji: string; label: string; note?: string }) {
        const [existing] = await db
          .select()
          .from(partnerMoods)
          .where(and(eq(partnerMoods.coupleId, coupleId), eq(partnerMoods.userId, userId)));

        if (existing) {
          const [updated] = await db
            .update(partnerMoods)
            .set({
              emoji: data.emoji,
              label: data.label,
              note: data.note || null,
              updatedAt: new Date(),
            })
            .where(eq(partnerMoods.id, existing.id))
            .returning();
          return updated;
        }

        const id = crypto.randomUUID();
        const [row] = await db
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
          .returning();
        return row;
      },
    },

    // ==================== PERIOD & CYCLE SANCTUARY TRACKER ====================
    cycles: {
      async getLatest() {
        const [latest] = await db
          .select()
          .from(cycles)
          .where(eq(cycles.coupleId, coupleId))
          .orderBy(desc(cycles.startDate))
          .limit(1);
        return latest || null;
      },

      async getAll() {
        return db
          .select()
          .from(cycles)
          .where(eq(cycles.coupleId, coupleId))
          .orderBy(desc(cycles.startDate));
      },

      async logCycle(data: {
        startDate: string;
        endDate?: string;
        periodLength?: number;
        cycleLength?: number;
        flow?: 'light' | 'medium' | 'heavy' | 'spotting';
        symptoms?: string[];
        mood?: string;
        comfortRequest?: string;
        notes?: string;
      }) {
        const id = crypto.randomUUID();
        const [row] = await db
          .insert(cycles)
          .values({
            id,
            coupleId,
            loggedByUserId: userId,
            startDate: data.startDate,
            endDate: data.endDate || null,
            periodLength: data.periodLength ?? 5,
            cycleLength: data.cycleLength ?? 28,
            flow: data.flow || 'medium',
            symptoms: JSON.stringify(data.symptoms || []),
            mood: data.mood || 'sensitive',
            comfortRequest: data.comfortRequest || null,
            notes: data.notes || null,
            partnerCareNotified: false,
            updatedAt: new Date(),
          })
          .returning();
        return row;
      },

      async updateComfortRequest(cycleId: string, comfortRequest: string) {
        const [existing] = await db
          .select()
          .from(cycles)
          .where(and(eq(cycles.id, cycleId), eq(cycles.coupleId, coupleId)));

        if (!existing) throw new UnauthorizedCoupleAccessError();

        const [updated] = await db
          .update(cycles)
          .set({ comfortRequest, partnerCareNotified: true, updatedAt: new Date() })
          .where(and(eq(cycles.id, cycleId), eq(cycles.coupleId, coupleId)))
          .returning();
        return updated;
      },

      async delete(cycleId: string) {
        const [existing] = await db
          .select()
          .from(cycles)
          .where(and(eq(cycles.id, cycleId), eq(cycles.coupleId, coupleId)));

        if (!existing) throw new UnauthorizedCoupleAccessError();

        await db
          .delete(cycles)
          .where(and(eq(cycles.id, cycleId), eq(cycles.coupleId, coupleId)));
        return { success: true };
      },
    },
  };
}
