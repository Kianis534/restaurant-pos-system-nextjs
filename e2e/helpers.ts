import { expect, type Page, test as base } from '@playwright/test';

/**
 * Every test gets a fresh browser context (empty localStorage, so the demo data loads) and
 * fails if the page logs an error or throws.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(err.message));
      await use(errors);
      expect(errors, 'console errors on the page').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const ACCOUNTS = {
  admin: { no: 'admin001', password: 'admin123', home: /\/admin\/dashboard\/$/ },
  cashier: { no: 'cashier001', password: 'cashier123', home: /\/cashier\/dashboard\/$/ },
  kitchen: { no: 'kitchen001', password: 'kitchen123', home: /\/kitchen\/$/ },
} as const;

export async function login(page: Page, who: keyof typeof ACCOUNTS) {
  const account = ACCOUNTS[who];
  await page.goto('login/');
  await page.getByLabel('Employee number').fill(account.no);
  await page.getByLabel('Password').fill(account.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(account.home);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login\/$/);
}

/** Taps a menu item on a POS screen. */
export async function addToCart(page: Page, name: string, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  }
}

/** Fails if the page is wider than the viewport (sideways scrolling on phones). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page should not scroll sideways').toBeLessThanOrEqual(1);
}
