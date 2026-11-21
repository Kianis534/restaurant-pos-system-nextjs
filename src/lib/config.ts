/**
 * Build-time configuration. Every value comes from a NEXT_PUBLIC_* variable, so it is
 * inlined into the static bundle at `npm run build`. See .env.example for details.
 *
 * Next.js only inlines `process.env.NEXT_PUBLIC_X` when it is written out literally,
 * so don't refactor these into a loop or a dynamic lookup.
 */

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function readString(value: string | undefined, fallback: string): string {
  return value && value.trim() !== '' ? value.trim() : fallback;
}

const adminPasswordHash = readString(process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH, '');
const staffPasswordHash = readString(process.env.NEXT_PUBLIC_STAFF_PASSWORD_HASH, '');

export const config = {
  appName: readString(process.env.NEXT_PUBLIC_APP_NAME, 'Restaurant POS'),
  currency: readString(process.env.NEXT_PUBLIC_CURRENCY, 'USD').toUpperCase(),
  locale: readString(process.env.NEXT_PUBLIC_LOCALE, 'en-US'),
  /** Optional PBKDF2 hash that replaces the demo admin password on first load. */
  adminPasswordHash,
  /** Optional PBKDF2 hash that replaces the demo cashier and kitchen passwords on first load. */
  staffPasswordHash,
  /**
   * Show the demo logins on the sign-in page. Defaults to true, but switches off on its
   * own when you supply your own password hashes, because the hint would be wrong.
   */
  showDemoAccounts: readBool(
    process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS,
    adminPasswordHash === '' && staffPasswordHash === '',
  ),
} as const;
