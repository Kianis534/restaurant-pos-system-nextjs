import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';

/**
 * Password hashing for staff accounts.
 *
 * Format: `pbkdf2-sha256:<iterations>:<salt hex>:<hash hex>`
 *
 * Colons rather than `$` on purpose: Next.js expands `$NAME` in .env files, which would
 * silently cut a `$`-separated hash short when it's pasted into .env.local.
 *
 * This uses @noble/hashes rather than window.crypto.subtle because SubtleCrypto only exists
 * in secure contexts. A till or tablet that opens the app over plain http on the local
 * network (http://192.168.x.x:3000) would otherwise be unable to log in at all.
 */

const ALGORITHM = 'pbkdf2-sha256';
export const DEFAULT_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

export const MIN_PASSWORD_LENGTH = 6;

export async function hashPassword(
  password: string,
  options: { iterations?: number; salt?: Uint8Array } = {},
): Promise<string> {
  const iterations = options.iterations ?? DEFAULT_ITERATIONS;
  const salt = options.salt ?? randomBytes(SALT_BYTES);
  const key = await pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: KEY_BYTES });
  return `${ALGORITHM}:${iterations}:${bytesToHex(salt)}:${bytesToHex(key)}`;
}

export function isPasswordHash(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  return (
    parts.length === 4 &&
    parts[0] === ALGORITHM &&
    /^\d+$/.test(parts[1]) &&
    /^[0-9a-f]+$/i.test(parts[2]) &&
    /^[0-9a-f]{64}$/i.test(parts[3])
  );
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isPasswordHash(stored)) return false;
  const [, iterationText, saltHex, hashHex] = stored.split(':');
  const iterations = Number(iterationText);
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 5_000_000) return false;
  const key = await pbkdf2Async(sha256, password, hexToBytes(saltHex), {
    c: iterations,
    dkLen: KEY_BYTES,
  });
  return constantTimeEqual(bytesToHex(key), hashHex.toLowerCase());
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Returns an error message, or null when the password is acceptable. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (/\s/.test(password)) return 'Password cannot contain spaces.';
  return null;
}
