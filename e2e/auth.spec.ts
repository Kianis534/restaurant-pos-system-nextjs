import { ACCOUNTS, expect, login, logout, test } from './helpers';

test('signed-out visitors are sent to the sign-in page', async ({ page }) => {
  await page.goto('admin/dashboard/');
  await expect(page).toHaveURL(/\/login\/$/);
  await expect(page.getByRole('heading', { name: 'Restaurant POS' })).toBeVisible();
});

test('a wrong password is rejected', async ({ page }) => {
  await page.goto('login/');
  await page.getByLabel('Employee number').fill('admin001');
  await page.getByLabel('Password').fill('not-the-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid employee number or password.')).toBeVisible();
  await expect(page).toHaveURL(/\/login\/$/);
});

test('demo account buttons fill in the form', async ({ page }) => {
  await page.goto('login/');
  await page.getByRole('button', { name: /^Cashier/ }).click();
  await expect(page.getByLabel('Employee number')).toHaveValue('cashier001');
  await expect(page.getByLabel('Password')).toHaveValue('cashier123');
});

for (const role of Object.keys(ACCOUNTS) as (keyof typeof ACCOUNTS)[]) {
  test(`${role} lands on their home screen and can log out`, async ({ page }) => {
    await login(page, role);
    await logout(page);
    await page.goto('');
    await expect(page).toHaveURL(/\/login\/$/);
  });
}

test('the session survives a reload', async ({ page }) => {
  await login(page, 'admin');
  await page.reload();
  await expect(page).toHaveURL(ACCOUNTS.admin.home);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('a cashier cannot open admin pages', async ({ page }) => {
  await login(page, 'cashier');
  await page.goto('admin/employees/');
  await expect(page).toHaveURL(/\/unauthorized\/$/);
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
});

test('passwords are stored as hashes, never in plain text', async ({ page }) => {
  await login(page, 'admin');
  const stored = await page.evaluate(() => ({
    users: localStorage.getItem('pos_users') ?? '',
    session: localStorage.getItem('pos_session') ?? '',
  }));
  expect(stored.users).toContain('pbkdf2-sha256:');
  expect(stored.users).not.toContain('admin123');
  expect(stored.session).not.toContain('passwordHash');
});
