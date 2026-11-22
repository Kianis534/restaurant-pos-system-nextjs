import { addToCart, expect, login, logout, test, type ACCOUNTS } from './helpers';
import type { Page } from '@playwright/test';

// Issue #7: voiding a paid order.

async function sellTwoBurgers(page: Page, who: keyof typeof ACCOUNTS = 'cashier') {
  await login(page, who);
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Classic Burger', 2); // 2 x 14.29 = 28.58
  await page.getByRole('button', { name: 'Take payment' }).click();
  await page.getByRole('button', { name: 'Confirm payment' }).click();
  await expect(page.getByTestId('receipt')).toContainText('ORD-000001');
  await page.getByRole('button', { name: 'New order' }).click();
}

test('an admin voids a sale: revenue, stock, bill and kitchen all follow', async ({ page }) => {
  await sellTwoBurgers(page);
  await logout(page);
  await login(page, 'admin');

  await page.goto('admin/reports/');
  await expect(page.getByText('$28.58').first()).toBeVisible();
  await page.getByRole('cell', { name: 'ORD-000001' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('button', { name: 'Void order' }).click();

  const voidDialog = page.getByRole('dialog', { name: 'Void ORD-000001?' });
  await voidDialog.getByRole('button', { name: 'Void order' }).click();
  await expect(voidDialog.getByRole('alert')).toHaveText('Choose a reason.');
  await voidDialog.getByLabel('Reason').selectOption('Wrong order entered');
  await voidDialog.getByLabel('Note (optional)').fill('rang up twice');
  await voidDialog.getByRole('button', { name: 'Void order' }).click();

  await expect(page.getByTestId('toast')).toContainText('ORD-000001 voided. Its items are back in stock.');
  await expect(sheet).toContainText('Voided by Admin User');
  await expect(sheet).toContainText('Reason: Wrong order entered: rang up twice');
  await expect(sheet.getByRole('button', { name: 'Void order' })).toHaveCount(0);
  await page.keyboard.press('Escape');

  // Revenue is back to zero and the void is counted on its own.
  await expect(page.getByText('No sales in this period.').first()).toBeVisible();
  await expect(page.getByText('$28.58 not counted')).toBeVisible();

  // Stock went back: 100 Classic Burgers again.
  await page.goto('admin/products/');
  await expect(page.getByRole('row', { name: /^Classic Burger/ })).toContainText('100');

  // The bill says VOID, and can't be voided again.
  await page.goto('cashier/bills/');
  await expect(page.getByRole('link', { name: /ORD-000001/ })).toContainText('Voided');
  await page.getByRole('link', { name: /ORD-000001/ }).click();
  await expect(page.getByTestId('receipt')).toContainText('*** VOID ***');
  await expect(page.getByTestId('receipt')).toContainText('Wrong order entered: rang up twice');
  await expect(page.getByRole('button', { name: 'Void order' })).toHaveCount(0);

  // The ticket is gone from the kitchen.
  await page.goto('kitchen/');
  await expect(page.getByText('No active orders.', { exact: false })).toBeVisible();
});

test('an admin can void from the bill page; cashiers cannot void', async ({ page }) => {
  await sellTwoBurgers(page);
  await page.goto('cashier/bills/view/?id=REC-000001');
  await expect(page.getByTestId('receipt')).toContainText('ORD-000001');
  await expect(page.getByRole('button', { name: 'Void order' })).toHaveCount(0);

  await logout(page);
  await login(page, 'admin');
  await page.goto('cashier/bills/view/?id=REC-000001');
  await page.getByRole('button', { name: 'Void order' }).click();
  const voidDialog = page.getByRole('dialog', { name: 'Void ORD-000001?' });
  await voidDialog.getByLabel('Reason').selectOption('Customer changed their mind');
  await voidDialog.getByRole('button', { name: 'Void order' }).click();
  await expect(page.getByText('Voided by Admin User')).toBeVisible();
  await expect(page.getByTestId('receipt')).toContainText('*** VOID ***');

  await page.goto('admin/dashboard/');
  await expect(page.getByText("Today's revenue").locator('..').locator('..')).toContainText('$0.00');
});
