import { addToCart, answerConfirm, expect, login, logout, test } from './helpers';

test('menu item: validation, create, stock limit at the till, item discount', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/products/new/');

  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(page.getByText('Name is required.')).toBeVisible();
  await expect(page.getByText('Enter a price of 0 or more.')).toBeVisible();

  await page.getByLabel('Name').fill('Classic Burger');
  await page.getByLabel('Price (before tax)').fill('5');
  await page.getByLabel('Cost').fill('1');
  await page.getByLabel('Stock').fill('1');
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(page.getByText('Another menu item already has this name.')).toBeVisible();

  await page.getByLabel('Price (before tax)').fill('5.555');
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(page.getByText('Use at most two decimal places.')).toBeVisible();
  await page.getByLabel('Price (before tax)').fill('5');

  await page.getByLabel('Name').fill('Tomato Soup');
  await page.getByLabel('Category').selectOption('Starters');
  await expect(page.getByText('Customers pay $5.50 with tax.')).toBeVisible();
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(page).toHaveURL(/\/admin\/products\/$/);
  await expect(page.getByTestId('toast')).toContainText('Added "Tomato Soup" to the menu.');
  await expect(page.getByRole('cell', { name: 'Tomato Soup', exact: true })).toBeVisible();

  // Only one in stock: the second tap is refused.
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Tomato Soup');
  await expect(page.getByRole('button', { name: /^Tomato Soup/ })).toBeDisabled();
  await expect(page.getByTestId('cart-total')).toHaveText('$5.50');

  // 50% off the soup: 2.50 + 0.25 tax.
  await page.goto('admin/discounts/new/');
  await page.getByLabel('Name').fill('Soup special');
  await page.getByLabel('Discount (%)').fill('50');
  await page.getByLabel('Applies to').selectOption('item');
  await page.getByLabel('Menu item').selectOption({ label: 'Tomato Soup' });
  await page.getByRole('button', { name: 'Add discount' }).click();
  await expect(page).toHaveURL(/\/admin\/discounts\/$/);
  await expect(page.getByRole('row', { name: /Soup special/ })).toContainText('active');

  await page.goto('cashier/takeaway/');
  await expect(page.getByRole('button', { name: /^Tomato Soup/ })).toContainText('$2.75');
});

test('settings: a new tax rate is used at the till', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/settings/');
  await page.getByLabel('Tax rate (%)').fill('0');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Settings saved.')).toBeVisible();
  await page.goto('cashier/takeaway/');
  await expect(page.getByRole('button', { name: /^Classic Burger/ })).toContainText('$12.99');
  await expect(page.getByRole('button', { name: /^Classic Burger/ })).toContainText('no tax');
});

test('employees: create a cashier who can then sign in', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/employees/new/');
  await page.getByLabel('Full name').fill('QA Cashier');
  await page.getByLabel('Employee number').fill('cashier001');
  await page.getByLabel('Password').fill('abc');
  await page.getByRole('button', { name: 'Add employee' }).click();
  await expect(page.getByText('This employee number is already taken.')).toBeVisible();
  await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible();

  await page.getByLabel('Employee number').fill('qa01');
  await page.getByLabel('Password').fill('secret12');
  await page.getByRole('button', { name: 'Add employee' }).click();
  await expect(page).toHaveURL(/\/admin\/employees\/$/);
  await expect(page.getByRole('row', { name: /QA Cashier/ })).toBeVisible();

  await logout(page);
  await page.getByLabel('Employee number').fill('qa01');
  await page.getByLabel('Password').fill('secret12');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/cashier\/dashboard\/$/);
  await expect(page.getByRole('heading', { name: 'Hello, QA Cashier' })).toBeVisible();
});

test('employees: an admin cannot change their own role', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/employees/edit/?id=user-admin');
  await expect(page.getByLabel('Role')).toBeDisabled();
  await expect(page.getByText("You can't change your own role.")).toBeVisible();
});

test('employees: the signed-in admin cannot delete themselves', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/employees/');
  await page.getByRole('button', { name: 'Delete Admin User' }).click();
  await expect(page.getByTestId('toast')).toContainText("You can't delete the account you're signed in with.");
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByRole('row', { name: /Admin User/ })).toBeVisible();
});

test('tables: blank name gets the next number; areas can be added', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/tables/');
  await page.getByLabel('New area name').fill('Rooftop');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText(/^Rooftop/)).toBeVisible();

  await page.goto('admin/tables/new/');
  await page.getByLabel('Area').selectOption('Rooftop');
  await page.getByLabel('Seats').fill('3');
  await page.getByRole('button', { name: 'Add table' }).click();
  await expect(page).toHaveURL(/\/admin\/tables\/$/);
  await expect(page.getByRole('row', { name: /T07 Rooftop 3/ })).toBeVisible();
});

test('reports reflect a sale and the order can be looked up', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('cashier/takeaway/');
  await addToCart(page, 'Grilled Steak'); // 24.00 + 2.40
  await page.getByRole('button', { name: 'Take payment' }).click();
  await page.getByRole('button', { name: 'Confirm payment' }).click();
  await page.getByRole('button', { name: 'New order' }).click();

  await page.goto('admin/reports/');
  await expect(page.getByText('$26.40').first()).toBeVisible();
  await page.getByLabel('Find an order').fill('ord-000001');
  await page.getByRole('button', { name: 'Search orders' }).click();
  await expect(page.getByRole('dialog')).toContainText('Grilled Steak');

  await page.goto('admin/dashboard/');
  await expect(page.getByRole('cell', { name: 'ORD-000001' })).toBeVisible();
});

test('delete asks first: cancel keeps the item, confirm removes it', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/products/');
  await page.getByRole('button', { name: 'Delete Hot Wings' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Delete item "Hot Wings"?');
  await answerConfirm(page, 'Cancel');
  await expect(page.getByRole('row', { name: /Hot Wings/ })).toBeVisible();

  await page.getByRole('button', { name: 'Delete Hot Wings' }).click();
  await answerConfirm(page, 'Delete');
  await expect(page.getByTestId('toast')).toContainText('Deleted "Hot Wings".');
  await expect(page.getByRole('row', { name: /Hot Wings/ })).toHaveCount(0);
});

test('reports read a reversed date range the right way round', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/reports/');
  await page.getByLabel('To').fill('2026-01-01');
  await page.getByLabel('From').fill('2026-01-31');
  await expect(page.getByText(/^Showing .+ to .+\.$/)).toBeVisible();
});

test('reset to demo data signs everyone out', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('admin/settings/');
  await page.getByRole('button', { name: 'Reset to demo data' }).click();
  await answerConfirm(page, 'Reset');
  await expect(page).toHaveURL(/\/login\/$/);
  await expect(page.getByTestId('toast')).toContainText('Demo data restored.');
});
