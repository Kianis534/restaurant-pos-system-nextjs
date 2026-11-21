#!/usr/bin/env node
// Prints a password hash in the format the app stores, so you can seed your own
// passwords through NEXT_PUBLIC_ADMIN_PASSWORD_HASH / NEXT_PUBLIC_STAFF_PASSWORD_HASH.
//
//   npm run hash-password -- "my long passphrase"
//
// Keep this in sync with src/lib/password.ts.
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, randomBytes } from '@noble/hashes/utils.js';

const ITERATIONS = 100_000;
const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "your password"');
  process.exit(1);
}
if (password.length < 6 || /\s/.test(password)) {
  console.error('The password must be at least 6 characters and contain no spaces.');
  process.exit(1);
}

const salt = randomBytes(16);
const key = await pbkdf2Async(sha256, password, salt, { c: ITERATIONS, dkLen: 32 });
console.log(`pbkdf2-sha256:${ITERATIONS}:${bytesToHex(salt)}:${bytesToHex(key)}`);
