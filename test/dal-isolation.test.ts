import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import * as schema from '@/lib/db/schema';
import { createCoupleDal, UnauthorizedCoupleAccessError } from '@/lib/dal';
import { createCoupleSpace, joinCoupleSpace } from '@/lib/auth/pairing';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginRateLimit,
} from '@/lib/auth/rate-limit';
import crypto from 'crypto';

describe('Duo DAL Isolation and Security Suite', () => {
  let userA1Id: string;
  let userA2Id: string;
  let userB1Id: string;
  let userB2Id: string;
  let userCId: string;

  let coupleAId: string;
  let coupleBId: string;
  let coupleAInviteCode: string;

  beforeAll(async () => {
    // Setup test users in DB
    const { db } = await import('@/lib/db');

    userA1Id = crypto.randomUUID();
    userA2Id = crypto.randomUUID();
    userB1Id = crypto.randomUUID();
    userB2Id = crypto.randomUUID();
    userCId = crypto.randomUUID();

    const passHash = await hashPassword('SecretPass123!');

    // Insert users
    await db.insert(schema.users)
      .values([
        { id: userA1Id, email: `a1_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Alice' },
        { id: userA2Id, email: `a2_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Aaron' },
        { id: userB1Id, email: `b1_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Beth' },
        { id: userB2Id, email: `b2_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Bob' },
        { id: userCId, email: `c_${Date.now()}@test.com`, passwordHash: passHash, displayName: 'Charlie' },
      ]);

    // Couple A
    const resA = await createCoupleSpace(userA1Id);
    expect(resA.success).toBe(true);
    coupleAId = resA.coupleId!;
    coupleAInviteCode = resA.inviteCode!;

    const joinA = await joinCoupleSpace(userA2Id, coupleAInviteCode);
    expect(joinA.success).toBe(true);

    // Couple B
    const resB = await createCoupleSpace(userB1Id);
    expect(resB.success).toBe(true);
    coupleBId = resB.coupleId!;

    const joinB = await joinCoupleSpace(userB2Id, resB.inviteCode!);
    expect(joinB.success).toBe(true);
  });

  it('proves hard limit of exactly 2 members per couple is strictly enforced', async () => {
    // User C tries to join Couple A which already has User A1 & User A2
    const joinAttempt = await joinCoupleSpace(userCId, coupleAInviteCode);
    expect(joinAttempt.success).toBe(false);
    expect(joinAttempt.error).toContain('strictly limited to 2 partners');
  });

  it('proves User A cannot read, query, or leak Couple B events', async () => {
    const dalB = createCoupleDal({ userId: userB1Id, coupleId: coupleBId });
    const dalA = createCoupleDal({ userId: userA1Id, coupleId: coupleAId });

    // Couple B creates a private date night event
    const eventB = await dalB.events.create({
      title: "Secret Paris Anniversary Trip",
      category: 'trip',
      startAt: '2026-11-01T10:00:00Z',
      description: 'Private hotel reservation #999',
    });

    // 1. User A lists events -> Couple B event MUST NOT be present
    const eventsForA = await dalA.events.getAll();
    expect(eventsForA.some((e) => e.id === eventB.id)).toBe(false);

    // 2. User A attempts to directly fetch Couple B event by ID
    const singleEventForA = await dalA.events.getById(eventB.id);
    expect(singleEventForA).toBeNull();

    // 3. User A attempts to update Couple B event by ID
    await expect(
      dalA.events.update(eventB.id, { title: 'Compromised Title' })
    ).rejects.toThrow(UnauthorizedCoupleAccessError);

    // Verify original event was not modified
    const verifiedEventB = await dalB.events.getById(eventB.id);
    expect(verifiedEventB?.title).toBe('Secret Paris Anniversary Trip');

    // 4. User A attempts to delete Couple B event by ID
    await expect(dalA.events.delete(eventB.id)).rejects.toThrow(
      UnauthorizedCoupleAccessError
    );

    // Verify original event is still intact
    const intactEventB = await dalB.events.getById(eventB.id);
    expect(intactEventB).not.toBeNull();
  });

  it('proves User A cannot read, tamper with, or insert into Couple B lists and items', async () => {
    const dalB = createCoupleDal({ userId: userB1Id, coupleId: coupleBId });
    const dalA = createCoupleDal({ userId: userA1Id, coupleId: coupleAId });

    // Couple B creates a list and an item
    const listB = await dalB.lists.create({
      title: 'Our Intimate Bucket List',
      category: 'bucket_list',
    });

    const itemB = await dalB.listItems.addItem(listB.id, 'Hot air balloon ride');

    // 1. User A lists lists -> Couple B list must not appear
    const listsForA = await dalA.lists.getAll();
    expect(listsForA.some((l) => l.id === listB.id)).toBe(false);

    // 2. User A attempts to get list by ID
    const directListForA = await dalA.lists.getById(listB.id);
    expect(directListForA).toBeNull();

    // 3. User A attempts to inject an item into Couple B list
    await expect(
      dalA.listItems.addItem(listB.id, 'Malicious injection')
    ).rejects.toThrow(UnauthorizedCoupleAccessError);

    // 4. User A attempts to toggle completion on Couple B item
    await expect(
      dalA.listItems.toggleItem(itemB.id, true)
    ).rejects.toThrow(UnauthorizedCoupleAccessError);

    // 5. User A attempts to delete Couple B item
    await expect(
      dalA.listItems.deleteItem(itemB.id)
    ).rejects.toThrow(UnauthorizedCoupleAccessError);
  });

  it('proves User A cannot read Couple B memories', async () => {
    const dalB = createCoupleDal({ userId: userB1Id, coupleId: coupleBId });
    const dalA = createCoupleDal({ userId: userA1Id, coupleId: coupleAId });

    const memoryB = await dalB.memories.create({
      title: 'First date at the lake',
      memoryDate: '2026-05-20',
      note: 'Very emotional night',
    });

    // 1. User A lists memories -> none of B's memories appear
    const memoriesForA = await dalA.memories.getAll();
    expect(memoriesForA.some((m) => m.id === memoryB.id)).toBe(false);

    // 2. User A fetches memory by ID
    const directMemoryForA = await dalA.memories.getById(memoryB.id);
    expect(directMemoryForA).toBeNull();

    // 3. User A attempts to delete B's memory
    await expect(dalA.memories.delete(memoryB.id)).rejects.toThrow(
      UnauthorizedCoupleAccessError
    );
  });

  it('proves User A cannot read or modify Couple B partner preferences', async () => {
    const dalB = createCoupleDal({ userId: userB1Id, coupleId: coupleBId });
    const dalA = createCoupleDal({ userId: userA1Id, coupleId: coupleAId });

    const prefB = await dalB.preferences.upsert({
      category: 'favorite_food',
      title: 'Favorite Dessert',
      content: 'Triple Chocolate Lava Cake',
    });

    // 1. User A lists preferences -> Couple B's preferences excluded
    const prefsForA = await dalA.preferences.getAll();
    expect(prefsForA.some((p) => p.id === prefB.id)).toBe(false);

    // 2. User A attempts to update B's preference
    await expect(
      dalA.preferences.upsert({
        id: prefB.id,
        category: 'favorite_food',
        title: 'Tampered Title',
        content: 'Tampered Content',
      })
    ).rejects.toThrow(UnauthorizedCoupleAccessError);

    // 3. User A attempts to delete B's preference
    await expect(dalA.preferences.delete(prefB.id)).rejects.toThrow(
      UnauthorizedCoupleAccessError
    );
  });

  it('proves check-in answers remain strictly private until both partners submit', async () => {
    const dalB1 = createCoupleDal({ userId: userB1Id, coupleId: coupleBId });
    const dalB2 = createCoupleDal({ userId: userB2Id, coupleId: coupleBId });

    // Create checkin for week 42
    const checkin = await dalB1.checkins.getOrCreateWeek(2026, 42, {
      promptOne: 'What brought you joy this week?',
      promptTwo: 'What can I do to support you better?',
    });

    // Partner 1 submits answers
    await dalB1.checkins.submitAnswers(checkin!.id, {
      mood: 5,
      answerOne: 'Our morning coffee together.',
      answerTwo: 'Just hold me close tonight.',
    });

    // Partner 2 views check-in before submitting
    const checkinForPartner2 = await dalB2.checkins.getCheckinDetails(checkin!.id);
    expect(checkinForPartner2?.isRevealed).toBe(false);
    expect(checkinForPartner2?.partnerSubmitted).toBe(true);
    // Partner 2 MUST NOT be able to see Partner 1's actual answers or mood yet!
    expect(checkinForPartner2?.partnerAnswer).toBeNull();

    // Now Partner 2 submits answers
    const submitResult2 = await dalB2.checkins.submitAnswers(checkin!.id, {
      mood: 4,
      answerOne: 'Laughing over dinner.',
      answerTwo: 'A back rub would be heavenly.',
    });

    expect(submitResult2.revealedNow).toBe(true);

    // Both can now see revealed answers
    const revealedForPartner1 = await dalB1.checkins.getCheckinDetails(checkin!.id);
    expect(revealedForPartner1?.isRevealed).toBe(true);
    expect(revealedForPartner1?.partnerAnswer).not.toBeNull();
    expect(revealedForPartner1?.partnerAnswer?.answerOne).toBe('Laughing over dinner.');
  });

  it('proves rate limiting locks out attacker after 5 failed login attempts', async () => {
    const testEmail = `attacker_${Date.now()}@test.com`;
    const ip = '192.168.1.100';

    // 4 failed attempts: still allowed
    for (let i = 1; i <= 4; i++) {
      const res = await recordFailedLoginAttempt(testEmail, ip);
      expect(res.allowed).toBe(true);
      expect(res.remainingAttempts).toBe(5 - i);
    }

    // 5th failed attempt: triggers lockout
    const fifth = await recordFailedLoginAttempt(testEmail, ip);
    expect(fifth.allowed).toBe(false);
    expect(fifth.remainingAttempts).toBe(0);
    expect(fifth.lockedUntil).toBeDefined();

    // Check rate limit check directly
    const check = await checkLoginRateLimit(testEmail, ip);
    expect(check.allowed).toBe(false);
    expect(check.retryAfterSeconds).toBeGreaterThan(0);

    // Reset rate limit (simulating successful login or manual unlock)
    await resetLoginRateLimit(testEmail, ip);
    const afterReset = await checkLoginRateLimit(testEmail, ip);
    expect(afterReset.allowed).toBe(true);
  });
});
