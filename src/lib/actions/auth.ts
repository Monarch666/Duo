'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginRateLimit,
} from '@/lib/auth/rate-limit';
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getCurrentAuth,
} from '@/lib/auth/session';
import { createCoupleSpace, joinCoupleSpace } from '@/lib/auth/pairing';
import { createCoupleDal } from '@/lib/dal';
import {
  signUpSchema,
  logInSchema,
  createCoupleSchema,
  joinCoupleSchema,
} from '@/lib/validations';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
}

/**
 * Sign up a new user with email, password, and display name.
 */
export async function signUpAction(formData: unknown): Promise<ActionResponse> {
  const parsed = signUpSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return { success: false, error: 'Please fix the errors below.', fieldErrors };
  }

  const { email, password, displayName } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already registered
  const existing = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .get();

  if (existing) {
    return {
      success: false,
      error: 'An account with this email already exists.',
      fieldErrors: { email: 'Email is already taken.' },
    };
  }

  // Hash password with Argon2id
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  db.insert(users)
    .values({
      id: userId,
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
    })
    .run();

  // Create session and set cookie
  const reqHeaders = await headers();
  const userAgent = reqHeaders.get('user-agent') || undefined;
  const ip = reqHeaders.get('x-forwarded-for') || '127.0.0.1';

  const { token, expiresAt } = await createSession(userId, userAgent, ip);
  await setSessionCookie(token, expiresAt);

  return { success: true };
}

/**
 * Log in an existing user with rate-limiting protection.
 */
export async function logInAction(formData: unknown): Promise<ActionResponse> {
  const parsed = logInSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Invalid email or password format.' };
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const reqHeaders = await headers();
  const userAgent = reqHeaders.get('user-agent') || undefined;
  const ip = reqHeaders.get('x-forwarded-for') || '127.0.0.1';

  // Enforce SQLite rate limiting
  const rateLimit = await checkLoginRateLimit(normalizedEmail, ip);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many failed login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  // Find user
  const user = db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .get();

  if (!user) {
    await recordFailedLoginAttempt(normalizedEmail, ip);
    return { success: false, error: 'Invalid email or password.' };
  }

  // Verify Argon2 password hash
  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) {
    const failedResult = await recordFailedLoginAttempt(normalizedEmail, ip);
    const msg = failedResult.lockedUntil
      ? `Account temporarily locked due to multiple failed attempts. Try again in ${failedResult.retryAfterSeconds} seconds.`
      : `Invalid email or password. (${failedResult.remainingAttempts} attempts remaining)`;
    return {
      success: false,
      error: msg,
      retryAfterSeconds: failedResult.retryAfterSeconds,
    };
  }

  // Clear failed attempts counter on success
  await resetLoginRateLimit(normalizedEmail, ip);

  // Create session & cookie
  const { token, expiresAt } = await createSession(user.id, userAgent, ip);
  await setSessionCookie(token, expiresAt);

  return { success: true };
}

/**
 * Log out current user and clear cookie.
 */
export async function logOutAction(): Promise<ActionResponse> {
  await clearSessionCookie();
  return { success: true };
}

/**
 * Create a new couple space (generates invite code).
 */
export async function createCoupleAction(formData: unknown): Promise<ActionResponse> {
  const auth = await getCurrentAuth();
  if (!auth) {
    return { success: false, error: 'You must be logged in to create a couple space.' };
  }

  const parsed = createCoupleSchema.safeParse(formData || {});
  if (!parsed.success) {
    return { success: false, error: 'Invalid anniversary date format.' };
  }

  const result = await createCoupleSpace(
    auth.user.id,
    parsed.data.anniversaryDate || undefined
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/', 'layout');
  return { success: true, data: result };
}

/**
 * Join an existing couple space via invite code.
 */
export async function joinCoupleAction(formData: unknown): Promise<ActionResponse> {
  const auth = await getCurrentAuth();
  if (!auth) {
    return { success: false, error: 'You must be logged in to join a couple space.' };
  }

  const parsed = joinCoupleSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Please enter a valid invite code.' };
  }

  const result = await joinCoupleSpace(auth.user.id, parsed.data.inviteCode);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/', 'layout');
  return { success: true, data: result };
}

/**
 * Unlink couple space after export.
 */
export async function unlinkCoupleAction(): Promise<ActionResponse> {
  const auth = await getCurrentAuth();
  if (!auth || !auth.couple) {
    return { success: false, error: 'No active couple space found.' };
  }

  const dal = createCoupleDal({
    userId: auth.user.id,
    coupleId: auth.couple.coupleId,
  });

  await dal.couple.unlinkAndDestroy();
  revalidatePath('/', 'layout');
  return { success: true };
}
