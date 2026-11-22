import { addToCart, expect, login, test } from './helpers';

// Regression tests for issue #6.

test('scrolling over a focused number field leaves its value alone', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mouse wheel only');
  await login(page, 'admin');
  await page.goto('admin/settings/');
  const rate = page.getByLabel('Tax rate (%)');
  await rate.fill('10');
  await rate.hover();
  await page.mouse.wheel(0, 300);
  await expect(rate).not.toBeFocused();
  await expect(rate).toHaveValue('10');
});

test('form fields use 16px text on phones so iOS does not zoom in', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  await page.goto('login/');
  const size = await page.getByLabel('Employee number').evaluate((el) => getComputedStyle(el).fontSize);
  expect(size).toBe('16px');
});

test('the payment dialog is ready to type the cash amount', async ({ page }) => {
  await login(page, 'cashier');
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Classic Burger'); // 14.29
  await page.getByRole('button', { name: 'Take payment' }).click();
  const cash = page.getByLabel('Cash received');
  await expect(cash).toBeFocused();
  await page.keyboard.type('20');
  await expect(cash).toHaveValue('20');
  await expect(page.getByTestId('change-due')).toHaveText('$5.71');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('receipt')).toContainText('$5.71');
});

test('cart quantities have a label for screen readers', async ({ page }) => {
  await login(page, 'cashier');
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Cola', 2);
  await expect(page.getByTestId('line-quantity')).toHaveText('Quantity 2');
});

test('settings show a live receipt preview', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/settings/');
  const preview = page.getByTestId('receipt-preview');
  await expect(preview).toContainText('Restaurant POS');
  await page.getByLabel('Header').fill('Lahore Grill\nMM Alam Road');
  await page.getByLabel('Footer').fill('Come back soon');
  await expect(preview).toContainText('Lahore Grill');
  await expect(preview).toContainText('MM Alam Road');
  await expect(preview).toContainText('Come back soon');
  await expect(preview).not.toContainText('Restaurant POS');
});

test('a failed sign-in clears the password and puts the cursor back in it', async ({ page }) => {
  await page.goto('login/');
  await page.getByLabel('Employee number').fill('admin001');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid employee number or password.')).toBeVisible();
  await expect(page.getByLabel('Password')).toHaveValue('');
  await expect(page.getByLabel('Password')).toBeFocused();
});
