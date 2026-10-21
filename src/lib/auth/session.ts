import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { users, sessions, couples, coupleMembers } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const SESSION_COOKIE_NAME = 'duo_session';
export const SESSION_DURATION_DAYS = 30;
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface CoupleContext {
  coupleId: string;
  role: 'creator' | 'partner';
  status: 'pending' | 'paired';
  inviteCode: string;
  anniversaryDate: string | null;
  joinedAt: Date;
  partner?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface AuthContext {
  user: SessionUser;
  sessionId: string;
  couple: CoupleContext | null;
}

/**
 * Generate a cryptographically secure 64-hex-char token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new session in PostgreSQL and store it.
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions)
    .values({
      id: sessionId,
      userId,
      token,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      lastActiveAt: new Date(),
    });

  return { token, expiresAt };
}

/**
 * Set the httpOnly session cookie in the Next.js response context.
 */
export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * Remove session cookie.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Invalidate a session by token in PostgreSQL.
 */
export async function invalidateSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Invalidate all sessions for a specific user (e.g. password reset / logout all).
 */
export async function invalidateAllUserSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Validate session token and retrieve user + couple context.
 */
export async function validateSessionToken(token: string): Promise<AuthContext | null> {
  const now = new Date();

  // Find session
  const [sessionRecord] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (!sessionRecord) {
    return null;
  }

  // Check expiration
  if (sessionRecord.expiresAt < now) {
    await db.delete(sessions).where(eq(sessions.id, sessionRecord.id));
    return null;
  }

  // Update lastActiveAt if more than 5 minutes old
  if (now.getTime() - sessionRecord.lastActiveAt.getTime() > 5 * 60 * 1000) {
    await db.update(sessions)
      .set({ lastActiveAt: now })
      .where(eq(sessions.id, sessionRecord.id));
  }

  // Find user
  const [userRecord] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, sessionRecord.userId));

  if (!userRecord) {
    return null;
  }

  // Find couple membership for this user
  const [membership] = await db
    .select({
      coupleId: coupleMembers.coupleId,
      role: coupleMembers.role,
      joinedAt: coupleMembers.joinedAt,
      coupleStatus: couples.status,
      inviteCode: couples.inviteCode,
      anniversaryDate: couples.anniversaryDate,
    })
    .from(coupleMembers)
    .innerJoin(couples, eq(couples.id, coupleMembers.coupleId))
    .where(eq(coupleMembers.userId, userRecord.id));

  let coupleContext: CoupleContext | null = null;

  if (membership) {
    // Find partner (if any)
    const [partnerRecord] = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(coupleMembers)
      .innerJoin(users, eq(users.id, coupleMembers.userId))
      .where(
        and(
          eq(coupleMembers.coupleId, membership.coupleId),
          sql`${coupleMembers.userId} != ${userRecord.id}`
        )
      );

    coupleContext = {
      coupleId: membership.coupleId,
      role: membership.role as 'creator' | 'partner',
      status: membership.coupleStatus as 'pending' | 'paired',
      inviteCode: membership.inviteCode,
      anniversaryDate: membership.anniversaryDate,
      joinedAt: membership.joinedAt,
      partner: partnerRecord || undefined,
    };
  }

  return {
    user: userRecord,
    sessionId: sessionRecord.id,
    couple: coupleContext,
  };
}

/**
 * Retrieve current authenticated session from server request cookies.
 */
export async function getCurrentAuth(): Promise<AuthContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await validateSessionToken(token);
  } catch {
    return null;
  }
}
