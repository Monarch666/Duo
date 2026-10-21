import { db } from '@/lib/db';
import { loginAttempts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
  retryAfterSeconds?: number;
}

/**
 * Check and enforce rate limiting for login attempts.
 */
export async function checkLoginRateLimit(
  email: string,
  ip: string = '127.0.0.1'
): Promise<RateLimitResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const key = `${normalizedEmail}:${ip}`;
  const now = new Date();

  const record = db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.key, key))
    .get();

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }

  // Check if currently locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil(
      (record.lockedUntil.getTime() - now.getTime()) / 1000
    );
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: record.lockedUntil,
      retryAfterSeconds,
    };
  }

  // If previous lock expired or last attempt was older than lockout window, reset count
  const timeSinceLastAttempt = now.getTime() - record.lastAttemptAt.getTime();
  if (timeSinceLastAttempt > LOCKOUT_MS) {
    db.update(loginAttempts)
      .set({
        attemptCount: 0,
        lockedUntil: null,
        lastAttemptAt: now,
      })
      .where(eq(loginAttempts.key, key))
      .run();

    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attemptCount);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
  };
}

/**
 * Record a failed login attempt. If threshold exceeded, lock out the account.
 */
export async function recordFailedLoginAttempt(
  email: string,
  ip: string = '127.0.0.1'
): Promise<RateLimitResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const key = `${normalizedEmail}:${ip}`;
  const now = new Date();

  const record = db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.key, key))
    .get();

  let newCount = 1;
  let lockedUntil: Date | null = null;

  if (record) {
    const timeSinceLastAttempt = now.getTime() - record.lastAttemptAt.getTime();
    if (timeSinceLastAttempt > LOCKOUT_MS) {
      newCount = 1;
    } else {
      newCount = record.attemptCount + 1;
    }

    if (newCount >= MAX_ATTEMPTS) {
      lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
    }

    db.update(loginAttempts)
      .set({
        attemptCount: newCount,
        lastAttemptAt: now,
        lockedUntil,
      })
      .where(eq(loginAttempts.key, key))
      .run();
  } else {
    db.insert(loginAttempts)
      .values({
        id: crypto.randomUUID(),
        key,
        attemptCount: 1,
        lastAttemptAt: now,
        lockedUntil: null,
      })
      .run();
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - newCount);
  const retryAfterSeconds = lockedUntil
    ? Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000)
    : undefined;

  return {
    allowed: newCount < MAX_ATTEMPTS,
    remainingAttempts: remaining,
    lockedUntil: lockedUntil ?? undefined,
    retryAfterSeconds,
  };
}

/**
 * Reset failed login attempts upon successful login.
 */
export async function resetLoginRateLimit(
  email: string,
  ip: string = '127.0.0.1'
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const key = `${normalizedEmail}:${ip}`;

  db.delete(loginAttempts).where(eq(loginAttempts.key, key)).run();
}
