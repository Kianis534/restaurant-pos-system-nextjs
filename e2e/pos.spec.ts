import { addToCart, answerConfirm, expect, login, logout, test } from './helpers';

test('takeaway order: cash payment, change, receipt and the kitchen ticket', async ({ page }) => {
  await login(page, 'cashier');
  await page.getByRole('link', { name: 'Open takeaway' }).click();
  await expect(page).toHaveURL(/\/cashier\/takeaway\/$/);

  // Burger: 12.99 + 10% tax = 14.29. Cola: 2.50 + 0.25 = 2.75.
  await addToCart(page, 'Classic Burger', 2);
  await addToCart(page, 'Cola');
  await expect(page.getByTestId('cart-total')).toHaveText('$31.33');

  await page.getByRole('button', { name: 'Take payment' }).click();
  await page.getByLabel('Cash received').fill('40');
  await expect(page.getByTestId('change-due')).toHaveText('$8.67');
  await page.getByRole('button', { name: 'Confirm payment' }).click();

  const receipt = page.getByTestId('receipt');
  await expect(receipt).toContainText('ORD-000001');
  await expect(receipt).toContainText('Takeaway');
  await expect(receipt).toContainText('$31.33');
  await expect(receipt).toContainText('$8.67');
  await page.getByRole('button', { name: 'New order' }).click();
  await expect(page.getByText('Tap a menu item to start a takeaway order.')).toBeVisible();

  // The kitchen sees the paid order and works it through to served.
  await logout(page);
  await login(page, 'kitchen');
  const ticket = page.getByTestId('kitchen-ticket').filter({ hasText: 'ORD-000001' });
  await expect(ticket).toContainText('Classic Burger');
  await expect(ticket).toContainText('x2');
  await ticket.getByRole('button', { name: 'Start preparing' }).click();
  await ticket.getByRole('button', { name: 'Mark ready' }).click();
  await ticket.getByRole('button', { name: 'Mark served' }).click();
  await expect(page.getByText('No active orders.', { exact: false })).toBeVisible();

  // A mis-tap on "Mark served" can be undone from the toast.
  await page.getByTestId('toast').getByRole('button', { name: 'Undo' }).click();
  await expect(ticket).toContainText('ready');
});

test('dine-in tab survives a reload, then is paid by card and shows up in bills', async ({ page }) => {
  await login(page, 'cashier');
  await page.goto('cashier/dine-in/');

  await expect(page.getByRole('button', { name: /^Margherita Pizza/ })).toBeDisabled(); // no table yet
  await page.getByRole('button', { name: /^T01/ }).click();
  await addToCart(page, 'Margherita Pizza');
  await expect(page.getByTestId('cart-total')).toHaveText('$17.59');

  await page.reload();
  await expect(page.getByRole('button', { name: /^T01/ })).toContainText('Open');
  await page.getByRole('button', { name: /^T01/ }).click();
  await expect(page.getByTestId('cart-total')).toHaveText('$17.59');

  await page.getByRole('button', { name: 'Take payment' }).click();
  await page.locator('label').filter({ hasText: /^Card$/ }).click();
  await page.getByRole('button', { name: 'Confirm payment' }).click();
  await expect(page.getByTestId('receipt')).toContainText('Dine-in (T01)');
  await expect(page.getByTestId('receipt')).toContainText('Card');
  await page.getByRole('button', { name: 'New order' }).click();
  await expect(page.getByRole('button', { name: /^T01/ })).toContainText('Free');

  await page.goto('cashier/bills/');
  await page.getByRole('link', { name: /ORD-000001/ }).click();
  await expect(page).toHaveURL(/\/cashier\/bills\/view\/\?id=REC-000001$/);
  await expect(page.getByTestId('receipt')).toContainText('Margherita Pizza');
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
});

test('discounts and tax exemptions are applied at the till', async ({ page }) => {
  await login(page, 'cashier');
  await page.goto('cashier/takeaway/');
  // Seeded "Dessert Week": 15% off desserts. 6.50 - 0.98 = 5.52, + 0.55 tax = 6.07.
  await addToCart(page, 'Chocolate Cake');
  await expect(page.getByTestId('cart-total')).toHaveText('$6.07');
  // Mineral water is tax-free in the seed settings.
  await addToCart(page, 'Mineral Water');
  await expect(page.getByTestId('cart-total')).toHaveText('$7.57');
});

test('split payments must add up to the total', async ({ page }) => {
  await login(page, 'cashier');
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Fries'); // 3.99 + 0.40 = 4.39
  await page.getByRole('button', { name: 'Take payment' }).click();
  await page.locator('label').filter({ hasText: /^Split$/ }).click();
  await page.locator('#split-cash').fill('2');
  await expect(page.locator('#split-card')).toHaveValue('2.39');
  // Typing more cash than the bill leaves the card at 0, so the parts no longer match.
  await page.locator('#split-cash').fill('10');
  await expect(page.locator('#split-card')).toHaveValue('0.00');
  await page.getByRole('button', { name: 'Confirm payment' }).click();
  await expect(page.getByText('Cash and card amounts must add up to the total.')).toBeVisible();
});

test('"/" jumps to the menu search and items show how many are in the order', async ({ page, isMobile }) => {
  await login(page, 'cashier');
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Cola', 2);
  await expect(page.getByRole('button', { name: /^Cola/ })).toContainText('2 in order');
  test.skip(isMobile, 'keyboard shortcut is for keyboards');
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('/');
  await expect(page.getByLabel('Search the menu')).toBeFocused();
  await page.keyboard.type('lemon');
  await expect(page.getByRole('button', { name: /^Fresh Lemonade/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Cola/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Search the menu')).toHaveValue('');
});

test('a takeaway order in progress survives leaving the screen', async ({ page }) => {
  await login(page, 'cashier');
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Fries', 2);
  await expect(page.getByTestId('cart-total')).toHaveText('$8.78');
  await page.goto('cashier/dashboard/');
  await page.goto('cashier/takeaway/');
  await expect(page.getByTestId('cart-total')).toHaveText('$8.78');
});

test('an item deleted from the menu must be removed from a held order before paying', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('cashier/dine-in/');
  await page.getByRole('button', { name: /^T04/ }).click();
  await addToCart(page, 'Caesar Salad');
  await addToCart(page, 'Cola');

  await page.goto('admin/products/');
  await page.getByRole('button', { name: 'Delete Caesar Salad' }).click();
  await answerConfirm(page, 'Delete');
  await expect(page.getByRole('cell', { name: /Caesar Salad/ })).toHaveCount(0);

  await page.goto('cashier/dine-in/');
  await page.getByRole('button', { name: /^T04/ }).click();
  await expect(page.getByText('No longer on the menu. Remove it to continue.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Take payment' })).toBeDisabled();
  await page.getByRole('button', { name: 'Remove Caesar Salad' }).click();
  await expect(page.getByRole('button', { name: 'Take payment' })).toBeEnabled();
  await expect(page.getByTestId('cart-total')).toHaveText('$2.75');
});

test('held takeaway orders can be resumed', async ({ page }) => {
  await login(page, 'cashier');
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Hot Wings');
  await page.getByRole('button', { name: 'Hold order' }).click();
  await expect(page.getByTestId('toast')).toContainText('Order put on hold.');
  await expect(page.getByRole('button', { name: /On hold #1/ })).toBeVisible();
  await page.getByRole('button', { name: /On hold #1/ }).click();
  await expect(page.getByTestId('cart-total')).toHaveText('$10.45');
  await expect(page.getByText('No orders on hold.')).toBeVisible();
});
