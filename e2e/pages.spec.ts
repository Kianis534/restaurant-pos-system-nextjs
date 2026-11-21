import { expect, expectNoHorizontalScroll, login, test } from './helpers';

/** Every screen, its main heading, and the role that can open it. */
const PAGES = [
  { path: 'admin/dashboard/', heading: 'Dashboard', as: 'admin' },
  { path: 'admin/products/', heading: 'Menu', as: 'admin' },
  { path: 'admin/products/new/', heading: 'New menu item', as: 'admin' },
  { path: 'admin/products/edit/?id=p-burger', heading: 'Edit menu item', as: 'admin' },
  { path: 'admin/products/deals/new/', heading: 'New deal', as: 'admin' },
  { path: 'admin/products/deals/edit/?id=deal-burger-combo', heading: 'Edit deal', as: 'admin' },
  { path: 'admin/employees/', heading: 'Employees', as: 'admin' },
  { path: 'admin/employees/new/', heading: 'New employee', as: 'admin' },
  { path: 'admin/employees/edit/?id=user-cashier-1', heading: 'Edit employee', as: 'admin' },
  { path: 'admin/tables/', heading: 'Tables', as: 'admin' },
  { path: 'admin/tables/new/', heading: 'New table', as: 'admin' },
  { path: 'admin/tables/edit/?id=t-01', heading: 'Edit table T01', as: 'admin' },
  { path: 'admin/discounts/', heading: 'Discounts', as: 'admin' },
  { path: 'admin/discounts/new/', heading: 'New discount', as: 'admin' },
  { path: 'admin/discounts/edit/?id=disc-desserts', heading: 'Edit discount', as: 'admin' },
  { path: 'admin/reports/', heading: 'Reports', as: 'admin' },
  { path: 'admin/settings/', heading: 'Settings', as: 'admin' },
  { path: 'cashier/dashboard/', heading: 'Hello, Front Desk Cashier', as: 'cashier' },
  { path: 'cashier/dine-in/', heading: 'Tables', as: 'cashier' },
  { path: 'cashier/takeaway/', heading: 'Takeaway order', as: 'cashier' },
  { path: 'cashier/bills/', heading: 'Bills', as: 'cashier' },
  { path: 'kitchen/', heading: 'Kitchen display', as: 'kitchen' },
] as const;

for (const role of ['admin', 'cashier', 'kitchen'] as const) {
  test(`every ${role} screen renders without errors or sideways scrolling`, async ({ page }) => {
    await login(page, role);
    for (const p of PAGES.filter((x) => x.as === role)) {
      await page.goto(p.path);
      await expect(page.getByRole('heading', { name: p.heading, exact: true }), p.path).toBeVisible();
      await expectNoHorizontalScroll(page);
    }
  });
}

test('edit pages explain when the record does not exist', async ({ page }) => {
  await login(page, 'admin');
  for (const path of ['admin/products/edit/?id=nope', 'admin/employees/edit/?id=nope', 'admin/tables/edit/?id=nope', 'admin/discounts/edit/?id=nope', 'cashier/bills/view/?id=nope']) {
    await page.goto(path);
    await expect(page.getByText(/doesn.t exist/), path).toBeVisible();
  }
});

test('the mobile menu opens and navigates', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  await login(page, 'admin');
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Reports' }).click();
  await expect(page).toHaveURL(/\/admin\/reports\/$/);
});

test('unknown addresses show the not-found page', async ({ page, consoleErrors }) => {
  const response = await page.goto('this/does/not/exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  // The browser logs the 404 response itself; that's expected here.
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((e) => !e.includes('404')));
});
