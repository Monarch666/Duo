import crypto from 'crypto';
import { db } from '@/lib/db';
import { couples, coupleMembers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Generate a friendly, readable 6-character invite code (e.g., DUO-7K2M).
 */
export function generateInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
  }
  return `DUO-${code}`;
}

export interface PairingResult {
  success: boolean;
  coupleId?: string;
  inviteCode?: string;
  error?: string;
}

/**
 * Create a new couple space. Creator is automatically assigned 'creator' role.
 */
export async function createCoupleSpace(
  userId: string,
  anniversaryDate?: string
): Promise<PairingResult> {
  // Check if user is already in a couple
  const existingMembership = db
    .select()
    .from(coupleMembers)
    .where(eq(coupleMembers.userId, userId))
    .get();

  if (existingMembership) {
    return {
      success: false,
      error: 'You are already a member of a couple space. Leave or unlink your current space first.',
    };
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = db
      .select({ id: couples.id })
      .from(couples)
      .where(eq(couples.inviteCode, inviteCode))
      .get();
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const coupleId = crypto.randomUUID();
  const memberId = crypto.randomUUID();

  // Run in transaction
  const result = db.transaction((tx) => {
    tx.insert(couples)
      .values({
        id: coupleId,
        inviteCode,
        anniversaryDate: anniversaryDate || null,
        status: 'pending',
      })
      .run();

    tx.insert(coupleMembers)
      .values({
        id: memberId,
        coupleId,
        userId,
        role: 'creator',
      })
      .run();

    return { coupleId, inviteCode };
  });

  return {
    success: true,
    coupleId: result.coupleId,
    inviteCode: result.inviteCode,
  };
}

/**
 * Join an existing couple space via invite code with strict 2-member limit.
 */
export async function joinCoupleSpace(
  userId: string,
  inviteCode: string
): Promise<PairingResult> {
  const cleanedCode = inviteCode.trim().toUpperCase();

  // Check if user is already in a couple
  const existingMembership = db
    .select()
    .from(coupleMembers)
    .where(eq(coupleMembers.userId, userId))
    .get();

  if (existingMembership) {
    return {
      success: false,
      error: 'You are already a member of an existing couple space.',
    };
  }

  // Find couple by invite code
  const couple = db
    .select()
    .from(couples)
    .where(eq(couples.inviteCode, cleanedCode))
    .get();

  if (!couple) {
    return {
      success: false,
      error: 'Invalid invite code. Please check with your partner.',
    };
  }

  // Strict hard limit check: count current members
  const memberCountResult = db
    .select({ count: sql<number>`count(*)` })
    .from(coupleMembers)
    .where(eq(coupleMembers.coupleId, couple.id))
    .get();

  const count = memberCountResult?.count ?? 0;
  if (count >= 2) {
    return {
      success: false,
      error: 'This couple space is already full (strictly limited to 2 partners).',
    };
  }

  // Add partner to couple and update status to 'paired'
  const memberId = crypto.randomUUID();

  db.transaction((tx) => {
    tx.insert(coupleMembers)
      .values({
        id: memberId,
        coupleId: couple.id,
        userId,
        role: 'partner',
      })
      .run();

    tx.update(couples)
      .set({
        status: 'paired',
        updatedAt: new Date(),
      })
      .where(eq(couples.id, couple.id))
      .run();
  });

  return {
    success: true,
    coupleId: couple.id,
    inviteCode: couple.inviteCode,
  };
}
