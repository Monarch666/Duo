import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createCoupleDal } from '@/lib/dal';
import {
  generateInviteCode,
  createCoupleSpace,
  joinCoupleSpace,
} from '@/lib/auth/pairing';
import { hashPassword } from '@/lib/auth/password';

describe('Pairing Lifecycle & End-to-End Sanctuary Suite', () => {
  describe('Secret Couple Key Generation & Formatting', () => {
    it('generates valid readable invite codes with DUO- prefix', () => {
      const code = generateInviteCode();
      expect(code).toMatch(/^DUO-[2-9A-Z]{4}$/);
      expect(code.length).toBe(8);
    });

    it('generates unique codes with high entropy (no collisions in batch)', () => {
      const generated = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const code = generateInviteCode();
        expect(generated.has(code)).toBe(false);
        generated.add(code);
      }
      expect(generated.size).toBe(50);
    });
  });

  describe('Pairing Flow Edge Cases & Error Handling', () => {
    let bfId: string;
    let gfId: string;
    let thirdUserId: string;
    let validCoupleId: string;
    let validKey: string;

    beforeAll(async () => {
      bfId = crypto.randomUUID();
      gfId = crypto.randomUUID();
      thirdUserId = crypto.randomUUID();

      const pass = await hashPassword('SecretLove123!');
      await db.insert(schema.users).values([
        { id: bfId, email: `bf_pair_${Date.now()}@test.com`, passwordHash: pass, displayName: 'Aadarsh' },
        { id: gfId, email: `gf_pair_${Date.now()}@test.com`, passwordHash: pass, displayName: 'Shivani' },
        { id: thirdUserId, email: `intruder_${Date.now()}@test.com`, passwordHash: pass, displayName: 'Intruder' },
      ]);
    });

    it('creates a new couple space with pending status and valid key', async () => {
      const result = await createCoupleSpace(bfId, '2024-02-14');
      expect(result.success).toBe(true);
      expect(result.coupleId).toBeDefined();
      expect(result.inviteCode).toMatch(/^DUO-[2-9A-Z]{4}$/);

      validCoupleId = result.coupleId!;
      validKey = result.inviteCode!;

      // Verify DB record
      const [coupleRecord] = await db
        .select()
        .from(schema.couples)
        .where(eq(schema.couples.id, validCoupleId));

      expect(coupleRecord).toBeDefined();
      expect(coupleRecord.status).toBe('pending');
      expect(coupleRecord.anniversaryDate).toBe('2024-02-14');
    });

    it('blocks user from creating a second couple space if already a member', async () => {
      const secondCreate = await createCoupleSpace(bfId);
      expect(secondCreate.success).toBe(false);
      expect(secondCreate.error).toContain('already a member');
    });

    it('rejects joining with non-existent or invalid code', async () => {
      const badJoin = await joinCoupleSpace(gfId, 'DUO-INVALID999');
      expect(badJoin.success).toBe(false);
      expect(badJoin.error).toContain('Invalid invite code');
    });

    it('gracefully normalizes and accepts lowercase / spaced / suffix-only secret keys', async () => {
      // Create a temporary couple to test normalization
      const tempBfId = crypto.randomUUID();
      const tempGf1 = crypto.randomUUID();
      const tempGf2 = crypto.randomUUID();
      const pass = await hashPassword('TestPass123!');

      await db.insert(schema.users).values([
        { id: tempBfId, email: `norm_bf_${Date.now()}@test.com`, passwordHash: pass, displayName: 'NormBF' },
        { id: tempGf1, email: `norm_gf1_${Date.now()}@test.com`, passwordHash: pass, displayName: 'NormGF1' },
        { id: tempGf2, email: `norm_gf2_${Date.now()}@test.com`, passwordHash: pass, displayName: 'NormGF2' },
      ]);

      const tempSpace = await createCoupleSpace(tempBfId);
      const code = tempSpace.inviteCode!; // e.g. "DUO-7K2M"

      // 1. Test lowercase with space: "duo 7k2m"
      const spacedLower = code.toLowerCase().replace('-', ' ');
      const joinSpaced = await joinCoupleSpace(tempGf1, spacedLower);
      expect(joinSpaced.success).toBe(true);

      // Clean up temp space
      const dalTemp = createCoupleDal({ userId: tempBfId, coupleId: tempSpace.coupleId! });
      await dalTemp.couple.unlinkAndDestroy();

      // 2. Test suffix only without "DUO-": "7K2M"
      const tempSpace2 = await createCoupleSpace(tempBfId);
      const suffix2 = tempSpace2.inviteCode!.replace('DUO-', '');
      const joinSuffix = await joinCoupleSpace(tempGf2, suffix2);
      expect(joinSuffix.success).toBe(true);

      const dalTemp2 = createCoupleDal({ userId: tempBfId, coupleId: tempSpace2.coupleId! });
      await dalTemp2.couple.unlinkAndDestroy();
    });

    it('successfully pairs girlfriend (gfId) using validKey and updates status to paired', async () => {
      const joinResult = await joinCoupleSpace(gfId, validKey);
      expect(joinResult.success).toBe(true);
      expect(joinResult.coupleId).toBe(validCoupleId);

      // Verify DB record changed to paired with exactly 2 members
      const [coupleRecord] = await db
        .select()
        .from(schema.couples)
        .where(eq(schema.couples.id, validCoupleId));

      expect(coupleRecord.status).toBe('paired');

      const members = await db
        .select()
        .from(schema.coupleMembers)
        .where(eq(schema.coupleMembers.coupleId, validCoupleId));

      expect(members.length).toBe(2);
      expect(members.some((m) => m.userId === bfId && m.role === 'creator')).toBe(true);
      expect(members.some((m) => m.userId === gfId && m.role === 'partner')).toBe(true);
    });

    it('STRICT HARD LIMIT (Law 2): mathematically blocks a 3rd user from joining', async () => {
      const intruderAttempt = await joinCoupleSpace(thirdUserId, validKey);
      expect(intruderAttempt.success).toBe(false);
      expect(intruderAttempt.error).toContain('strictly limited to 2 partners');

      // Verify member count remains exactly 2
      const members = await db
        .select()
        .from(schema.coupleMembers)
        .where(eq(schema.coupleMembers.coupleId, validCoupleId));
      expect(members.length).toBe(2);
    });

    it('blocks paired user from joining another space', async () => {
      // GF is already in Couple A; attempts to join another space
      const otherBfId = crypto.randomUUID();
      const pass = await hashPassword('Pass123!');
      await db.insert(schema.users).values([
        { id: otherBfId, email: `other_bf_${Date.now()}@test.com`, passwordHash: pass, displayName: 'OtherBF' },
      ]);

      const otherSpace = await createCoupleSpace(otherBfId);
      const attempt = await joinCoupleSpace(gfId, otherSpace.inviteCode!);

      expect(attempt.success).toBe(false);
      expect(attempt.error).toContain('already a member');
    });
  });

  describe('Full End-to-End Shared Sanctuary Experience', () => {
    let bfId: string;
    let gfId: string;
    let coupleId: string;
    let dalBf: ReturnType<typeof createCoupleDal>;
    let dalGf: ReturnType<typeof createCoupleDal>;

    beforeAll(async () => {
      bfId = crypto.randomUUID();
      gfId = crypto.randomUUID();
      const pass = await hashPassword('SecretSanctuary123!');

      await db.insert(schema.users).values([
        { id: bfId, email: `e2e_bf_${Date.now()}@test.com`, passwordHash: pass, displayName: 'Alex' },
        { id: gfId, email: `e2e_gf_${Date.now()}@test.com`, passwordHash: pass, displayName: 'Chloe' },
      ]);

      // 1. BF creates space
      const created = await createCoupleSpace(bfId, '2023-08-15');
      coupleId = created.coupleId!;

      // 2. GF joins with secret key
      await joinCoupleSpace(gfId, created.inviteCode!);

      dalBf = createCoupleDal({ userId: bfId, coupleId });
      dalGf = createCoupleDal({ userId: gfId, coupleId });
    });

    it('synchronizes calendar dates between partners', async () => {
      // BF plans a candlelit dinner
      const event = await dalBf.events.create({
        title: 'Candlelit Stargazing Picnic',
        category: 'date_night',
        startAt: '2026-11-14T19:00:00Z',
        color: '#D53039',
        description: 'Warm blanket and hot cocoa under the stars',
      });

      // GF fetches events and sees it immediately
      const gfEvents = await dalGf.events.getAll();
      const found = gfEvents.find((e) => e.id === event.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe('Candlelit Stargazing Picnic');
    });

    it('synchronizes menstrual cycle and girlfriend comfort beacon', async () => {
      // GF logs cycle
      const today = new Date().toISOString().split('T')[0];
      const cycle = await dalGf.cycles.logCycle({
        startDate: today,
        periodLength: 5,
        cycleLength: 28,
        flow: 'medium',
        symptoms: ['cramps', 'fatigue'],
        comfortRequest: 'Hot tea and back rub please 🌸',
      });

      expect(cycle.id).toBeDefined();

      // BF opens cycle sanctuary and sees GF request
      const latest = await dalBf.cycles.getLatest();
      expect(latest).toBeDefined();
      expect(latest?.comfortRequest).toBe('Hot tea and back rub please 🌸');
      expect(latest?.flow).toBe('medium');
    });

    it('enforces reciprocal check-in vault secrecy (Law 3)', async () => {
      // Create weekly checkin
      const checkin = await dalBf.checkins.getOrCreateWeek(2026, 44, {
        promptOne: 'What was your favorite moment together this week?',
        promptTwo: 'What is something sweet I can do for you in the coming days?',
      });

      expect(checkin).toBeDefined();
      expect(checkin?.status).toBe('pending');
      expect(checkin?.isRevealed).toBe(false);

      // BF submits reflection
      const bfSubmit = await dalBf.checkins.submitAnswers(checkin!.id, {
        mood: 5,
        answerOne: 'Cooking pasta together on Tuesday night.',
        answerTwo: 'Just your warm cuddles.',
      });
      expect(bfSubmit.revealedNow).toBe(false);

      // GF checks reflections -> BF answer MUST NOT be leaked (sealed vault)
      const currentVaultForGf = await dalGf.checkins.getCheckinDetails(checkin!.id);
      expect(currentVaultForGf?.isRevealed).toBe(false);
      expect(currentVaultForGf?.partnerAnswer).toBeNull();

      // GF submits reflection -> VAULT UNSEALED!
      const gfSubmit = await dalGf.checkins.submitAnswers(checkin!.id, {
        mood: 5,
        answerOne: 'When you brought me coffee in bed!',
        answerTwo: 'A long weekend walk in the park.',
      });
      expect(gfSubmit.revealedNow).toBe(true);

      // Both submitted -> Both answers visible side-by-side
      const revealedForBf = await dalBf.checkins.getCheckinDetails(checkin!.id);
      expect(revealedForBf?.isRevealed).toBe(true);
      expect(revealedForBf?.myAnswer).not.toBeNull();
      expect(revealedForBf?.partnerAnswer).not.toBeNull();
      expect(revealedForBf?.partnerAnswer?.answerOne).toContain('coffee in bed');
    });

    it('synchronizes love notes between partners', async () => {
      // GF writes a love note
      const note = await dalGf.loveNotes.create({
        content: 'Thank you for always being my safe harbor. I love you endlessly. ❤️',
        paperStyle: 'rose',
      });

      // BF reads notes
      const notesForBf = await dalBf.loveNotes.getAll();
      const foundNote = notesForBf.find((n) => n.id === note.id);
      expect(foundNote).toBeDefined();
      expect(foundNote?.content).toContain('safe harbor');

      // BF taps love
      const tapped = await dalBf.loveNotes.tap(note.id);
      expect(tapped.tapsCount).toBeGreaterThan(0);
    });

    it('exports all chamber data in offline archive and verifies completeness', async () => {
      const backup = await dalBf.couple.exportAllData();
      expect(backup.couple.id).toBe(coupleId);
      expect(backup.events.length).toBeGreaterThan(0);
      expect(backup.cycles.length).toBeGreaterThan(0);
      expect(backup.loveNotes.length).toBeGreaterThan(0);
      expect(backup.checkins.length).toBeGreaterThan(0);
    });

    it('cleanly dissolves couple space upon unlinking without orphan records', async () => {
      await dalBf.couple.unlinkAndDestroy();

      const [coupleAfter] = await db
        .select()
        .from(schema.couples)
        .where(eq(schema.couples.id, coupleId));

      expect(coupleAfter).toBeUndefined();

      // Members cascade deleted
      const membersAfter = await db
        .select()
        .from(schema.coupleMembers)
        .where(eq(schema.coupleMembers.coupleId, coupleId));

      expect(membersAfter.length).toBe(0);
    });
  });
});
