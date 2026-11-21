import { describe, expect, it } from 'vitest';
import { hashPassword, isPasswordHash, validatePassword, verifyPassword } from '@/lib/password';
import { DEMO_ACCOUNTS, seedUsers } from '@/lib/seed';

describe('password hashing', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('correct horse', { iterations: 1000 });
    expect(isPasswordHash(hash)).toBe(true);
    expect(hash).not.toContain('correct horse');
    expect(await verifyPassword('correct horse', hash)).toBe(true);
    expect(await verifyPassword('Correct horse', hash)).toBe(false);
  });

  it('uses a random salt, so the same password hashes differently', async () => {
    const a = await hashPassword('same-password', { iterations: 1000 });
    const b = await hashPassword('same-password', { iterations: 1000 });
    expect(a).not.toBe(b);
  });

  it('rejects malformed or plain-text values', async () => {
    expect(await verifyPassword('admin123', 'admin123')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2-sha256:abc:00:00')).toBe(false);
    expect(await verifyPassword('x', `pbkdf2-sha256:999999999:00:${'0'.repeat(64)}`)).toBe(false);
  });

  it('ships demo hashes that match the documented demo passwords', async () => {
    const users = seedUsers();
    for (const account of DEMO_ACCOUNTS) {
      const user = users.find((u) => u.employeeNo === account.employeeNo);
      expect(user, account.employeeNo).toBeDefined();
      expect(await verifyPassword(account.password, user!.passwordHash)).toBe(true);
    }
  });
});

describe('hashes in .env files', () => {
  it('survive Next.js env loading unchanged (no $ expansion)', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { loadEnvConfig } = await import('@next/env');
    const hash = await hashPassword('env-check-1', { iterations: 1000 });
    const dir = mkdtempSync(join(tmpdir(), 'pos-env-'));
    writeFileSync(join(dir, '.env'), `NEXT_PUBLIC_TEST_PASSWORD_HASH=${hash}\n`);
    loadEnvConfig(dir, false, { info: () => {}, error: () => {} }, true);
    expect(process.env.NEXT_PUBLIC_TEST_PASSWORD_HASH).toBe(hash);
  });
});

describe('validatePassword', () => {
  it('enforces length and no spaces', () => {
    expect(validatePassword('abc')).toMatch(/at least 6/);
    expect(validatePassword('has space')).toMatch(/spaces/);
    expect(validatePassword('fine-one')).toBeNull();
  });
});
