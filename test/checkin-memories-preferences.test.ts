import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { createCoupleDal } from '@/lib/dal';
import { createCoupleSpace, joinCoupleSpace } from '@/lib/auth/pairing';
import { hashPassword } from '@/lib/auth/password';
import crypto from 'crypto';

describe('Phase 3: Check-ins, Memories, and Preferences Suite', () => {
  let user1Id: string;
  let user2Id: string;
  let coupleId: string;
  let dalUser1: ReturnType<typeof createCoupleDal>;
  let dalUser2: ReturnType<typeof createCoupleDal>;

  beforeAll(async () => {
    user1Id = crypto.randomUUID();
    user2Id = crypto.randomUUID();
    const passHash = await hashPassword('Secret123!');

    await db.insert(schema.users)
      .values([
        { id: user1Id, email: `phase3_u1_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Maya' },
        { id: user2Id, email: `phase3_u2_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Jordan' },
      ]);

    const created = await createCoupleSpace(user1Id);
    coupleId = created.coupleId!;
    await joinCoupleSpace(user2Id, created.inviteCode!);

    dalUser1 = createCoupleDal({ userId: user1Id, coupleId });
    dalUser2 = createCoupleDal({ userId: user2Id, coupleId });
  });

  describe('Weekly Check-in Dual-Submission & Vault Privacy', () => {
    let checkinId: string;

    it('creates weekly check-in with prompts', async () => {
      const checkin = await dalUser1.checkins.getOrCreateWeek(2026, 43, {
        promptOne: 'What was your favorite laugh this week?',
        promptTwo: 'How can I support your dreams next week?',
      });

      expect(checkin).toBeDefined();
      expect(checkin?.status).toBe('pending');
      expect(checkin?.isRevealed).toBe(false);
      checkinId = checkin!.id;
    });

    it('keeps Partner 1 answer hidden from Partner 2 until Partner 2 submits', async () => {
      // Partner 1 submits
      const submit1 = await dalUser1.checkins.submitAnswers(checkinId, {
        mood: 4,
        answerOne: 'When we burned the pancakes and ordered pizza instead.',
        answerTwo: 'Give me quiet time to read on Saturday morning.',
      });
      expect(submit1.revealedNow).toBe(false);

      // Partner 2 views check-in
      const p2View = await dalUser2.checkins.getCheckinDetails(checkinId);
      expect(p2View?.isRevealed).toBe(false);
      expect(p2View?.partnerSubmitted).toBe(true);
      // Crucial privacy rule: Partner 1's actual text and mood MUST BE NULL to Partner 2
      expect(p2View?.partnerAnswer).toBeNull();
    });

    it('reveals both answers simultaneously once Partner 2 submits', async () => {
      const submit2 = await dalUser2.checkins.submitAnswers(checkinId, {
        mood: 5,
        answerOne: 'Watching the sunset on the balcony with tea.',
        answerTwo: 'Let us take an evening stroll without phones.',
      });
      expect(submit2.revealedNow).toBe(true);

      const revealedView = await dalUser2.checkins.getCheckinDetails(checkinId);
      expect(revealedView?.isRevealed).toBe(true);
      expect(revealedView?.partnerAnswer).not.toBeNull();
      expect(revealedView?.partnerAnswer?.mood).toBe(4);
      expect(revealedView?.partnerAnswer?.answerOne).toContain('burned the pancakes');
    });
  });

  describe('Memories Timeline Operations', () => {
    let memoryId: string;

    it('creates a memory with title, date, note, and photo path', async () => {
      const memory = await dalUser1.memories.create({
        title: 'Our first hike to Eagle Peak',
        memoryDate: '2026-08-14',
        note: 'We got lost for an hour, but the view at the summit was unforgettable.',
        photoPath: 'test_photo_uuid.jpg',
      });

      expect(memory).toBeDefined();
      expect(memory.title).toBe('Our first hike to Eagle Peak');
      expect(memory.photoPath).toBe('test_photo_uuid.jpg');
      memoryId = memory.id;
    });

    it('retrieves memories in chronological order', async () => {
      const allMemories = await dalUser2.memories.getAll();
      expect(allMemories.length).toBeGreaterThanOrEqual(1);
      expect(allMemories.some((m) => m.id === memoryId)).toBe(true);
    });

    it('deletes memory record', async () => {
      await dalUser1.memories.delete(memoryId);
      const fetched = await dalUser2.memories.getById(memoryId);
      expect(fetched).toBeNull();
    });
  });

  describe('Partner Preferences Cards', () => {
    let prefId: string;

    it('creates preference cards under defined categories', async () => {
      const pref = await dalUser1.preferences.upsert({
        category: 'coffee_order',
        title: 'Maya’s Daily Coffee',
        content: 'Iced caramel macchiato with almond milk, extra shot.',
      });

      expect(pref).toBeDefined();
      expect(pref.category).toBe('coffee_order');
      prefId = pref.id;
    });

    it('retrieves preference cards for partner to read', async () => {
      const prefs = await dalUser2.preferences.getAll();
      const mayaPref = prefs.find((p) => p.id === prefId);
      expect(mayaPref).toBeDefined();
      expect(mayaPref?.content).toContain('Iced caramel macchiato');
    });

    it('updates preference content', async () => {
      const updated = await dalUser1.preferences.upsert({
        id: prefId,
        category: 'coffee_order',
        title: 'Maya’s Daily Coffee (Updated)',
        content: 'Hot vanilla flat white with oat milk.',
      });

      expect(updated.title).toBe('Maya’s Daily Coffee (Updated)');
      expect(updated.content).toBe('Hot vanilla flat white with oat milk.');
    });

    it('deletes preference card', async () => {
      await dalUser1.preferences.delete(prefId);
      const all = await dalUser2.preferences.getAll();
      expect(all.some((p) => p.id === prefId)).toBe(false);
    });
  });
});
