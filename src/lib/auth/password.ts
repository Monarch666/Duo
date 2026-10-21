import { hash, verify } from '@node-rs/argon2';

/**
 * Hash a plain text password using Argon2id with secure defaults.
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password);
}

/**
 * Verify a plain text password against an Argon2 hash.
 */
export async function verifyPassword(
  hashStr: string,
  plainText: string
): Promise<boolean> {
  try {
    return await verify(hashStr, plainText);
  } catch {
    return false;
  }
}
