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
  const [existingMembership] = await db
    .select()
    .from(coupleMembers)
    .where(eq(coupleMembers.userId, userId));

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
    const [existing] = await db
      .select({ id: couples.id })
      .from(couples)
      .where(eq(couples.inviteCode, inviteCode));
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const coupleId = crypto.randomUUID();
  const memberId = crypto.randomUUID();

  // Run in async transaction
  await db.transaction(async (tx) => {
    await tx.insert(couples)
      .values({
        id: coupleId,
        inviteCode,
        anniversaryDate: anniversaryDate || null,
        status: 'pending',
      });

    await tx.insert(coupleMembers)
      .values({
        id: memberId,
        coupleId,
        userId,
        role: 'creator',
      });
  });

  return {
    success: true,
    coupleId,
    inviteCode,
  };
}

/**
 * Join an existing couple space via invite code with strict 2-member limit.
 */
export async function joinCoupleSpace(
  userId: string,
  inviteCode: string
): Promise<PairingResult> {
  let cleanedCode = (inviteCode || '').trim().toUpperCase().replace(/[\s_]+/g, '-');
  cleanedCode = cleanedCode.replace(/-+/g, '-');
  if (!cleanedCode.startsWith('DUO-') && (cleanedCode.length === 4 || cleanedCode.length === 5)) {
    cleanedCode = `DUO-${cleanedCode}`;
  }

  // Check if user is already in a couple
  const [existingMembership] = await db
    .select()
    .from(coupleMembers)
    .where(eq(coupleMembers.userId, userId));

  if (existingMembership) {
    return {
      success: false,
      error: 'You are already a member of an existing couple space.',
    };
  }

  // Find couple by invite code
  const [couple] = await db
    .select()
    .from(couples)
    .where(eq(couples.inviteCode, cleanedCode));

  if (!couple) {
    return {
      success: false,
      error: 'Invalid invite code. Please check with your partner.',
    };
  }

  // Strict hard limit check: count current members
  const [memberCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(coupleMembers)
    .where(eq(coupleMembers.coupleId, couple.id));

  const count = memberCountResult?.count ?? 0;
  if (count >= 2) {
    return {
      success: false,
      error: 'This couple space is already full (strictly limited to 2 partners).',
    };
  }

  // Add partner to couple and update status to 'paired'
  const memberId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(coupleMembers)
      .values({
        id: memberId,
        coupleId: couple.id,
        userId,
        role: 'partner',
      });

    await tx.update(couples)
      .set({
        status: 'paired',
        updatedAt: new Date(),
      })
      .where(eq(couples.id, couple.id));
  });

  return {
    success: true,
    coupleId: couple.id,
    inviteCode: couple.inviteCode,
  };
}
