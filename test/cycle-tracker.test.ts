import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { createCoupleDal } from '@/lib/dal';
import { createCoupleSpace, joinCoupleSpace } from '@/lib/auth/pairing';
import { hashPassword } from '@/lib/auth/password';
import { calculateCycleInfo } from '@/lib/utils/cycle';

describe('Period Cycle Sanctuary & Boyfriend Care Guide Suite', () => {
  let userA1Id: string;
  let userA2Id: string;
  let userB1Id: string;
  let userB2Id: string;

  let coupleAId: string;
  let coupleBId: string;

  beforeAll(async () => {
    userA1Id = crypto.randomUUID();
    userA2Id = crypto.randomUUID();
    userB1Id = crypto.randomUUID();
    userB2Id = crypto.randomUUID();

    const passHash = await hashPassword('SecretPass123!');

    await db.insert(schema.users).values([
      { id: userA1Id, email: `gf_a_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Elena' },
      { id: userA2Id, email: `bf_a_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Lucas' },
      { id: userB1Id, email: `gf_b_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Maya' },
      { id: userB2Id, email: `bf_b_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Noah' },
    ]);

    const resA = await createCoupleSpace(userA1Id);
    coupleAId = resA.coupleId!;
    await joinCoupleSpace(userA2Id, resA.inviteCode!);

    const resB = await createCoupleSpace(userB1Id);
    coupleBId = resB.coupleId!;
    await joinCoupleSpace(userB2Id, resB.inviteCode!);
  });

  describe('Cycle Phase Calculation & Boyfriend Advice Intelligence', () => {
    it('correctly identifies Menstrual Phase and generates empathetic BF care advice', () => {
      // Starting today = Day 1 (Menstrual phase)
      const today = new Date().toISOString().split('T')[0];
      const info = calculateCycleInfo(today, 5, 28);

      expect(info.phase).toBe('menstrual');
      expect(info.dayOfCycle).toBe(1);
      expect(info.boyfriendAdvice).toBeDefined();
      expect(info.boyfriendAdvice.headline).toContain('Warmth');
      expect(info.boyfriendAdvice.dos.length).toBeGreaterThan(0);
      expect(info.boyfriendAdvice.donts.length).toBeGreaterThan(0);
      expect(info.boyfriendAdvice.comfortKit.length).toBeGreaterThan(0);
      expect(info.boyfriendAdvice.sweetMessageSuggestion).toBeTruthy();
    });

    it('correctly calculates countdown to next cycle and progress percent', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const info = calculateCycleInfo(fiveDaysAgo, 5, 28);

      expect(info.dayOfCycle).toBe(6);
      expect(info.phase).toBe('follicular');
      expect(info.daysUntilNextPeriod).toBe(22);
      expect(info.progressPercent).toBeGreaterThan(0);
    });
  });

  describe('Cycle DAL Operations & Strict Cryptographic Scoping', () => {
    let loggedCycleId: string;

    it('logs a new cycle for Couple A via DAL', async () => {
      const dalA = createCoupleDal({ userId: userA1Id, coupleId: coupleAId });
      const today = new Date().toISOString().split('T')[0];

      const record = await dalA.cycles.logCycle({
        startDate: today,
        periodLength: 5,
        cycleLength: 28,
        flow: 'medium',
        symptoms: ['cramps', 'fatigue'],
        mood: 'sensitive',
        comfortRequest: 'Hot water bottle and chocolate please',
        notes: 'Feeling a bit low energy today',
      });

      expect(record).toBeDefined();
      expect(record.coupleId).toBe(coupleAId);
      expect(record.flow).toBe('medium');
      expect(record.comfortRequest).toBe('Hot water bottle and chocolate please');
      loggedCycleId = record.id;
    });

    it('allows boyfriend (userA2) to read latest cycle and comfort request of his couple space', async () => {
      const dalA_partner = createCoupleDal({ userId: userA2Id, coupleId: coupleAId });
      const latest = await dalA_partner.cycles.getLatest();

      expect(latest).toBeDefined();
      expect(latest?.id).toBe(loggedCycleId);
      expect(latest?.comfortRequest).toBe('Hot water bottle and chocolate please');
    });

    it('updates comfort request signal via DAL', async () => {
      const dalA = createCoupleDal({ userId: userA1Id, coupleId: coupleAId });
      const updated = await dalA.cycles.updateComfortRequest(
        loggedCycleId,
        'Warm chamomile tea & gentle forehead kisses'
      );

      expect(updated.comfortRequest).toBe('Warm chamomile tea & gentle forehead kisses');
    });

    it('STRICT ISOLATION: proves Couple B cannot read or access Couple A cycle records', async () => {
      const dalB = createCoupleDal({ userId: userB1Id, coupleId: coupleBId });
      const bCycle = await dalB.cycles.getLatest();

      // Couple B has not logged any cycle, must be null
      expect(bCycle).toBeNull();

      // Trying to update Couple A's cycle using Couple B's DAL must fail / throw
      await expect(
        dalB.cycles.updateComfortRequest(loggedCycleId, 'Hacked request')
      ).rejects.toThrow();
    });

    it('verifies cycle data is included in exportAllData', async () => {
      const dalA = createCoupleDal({ userId: userA1Id, coupleId: coupleAId });
      const exportData = await dalA.couple.exportAllData();

      expect(exportData.cycles).toBeDefined();
      expect(exportData.cycles.some((c: any) => c.id === loggedCycleId)).toBe(true);
    });
  });
});
