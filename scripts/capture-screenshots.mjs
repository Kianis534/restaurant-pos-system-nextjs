#!/usr/bin/env node
// Regenerates the README screenshots in docs/screenshots/ from a running build.
//
//   npm run build
//   npm start                      # serves out/ on http://localhost:3000
//   npm run screenshots            # in a second terminal
//
// Options (environment variables):
//   BASE_URL    where the app is running (default http://localhost:3000)
//   PW_CHANNEL  use an installed browser instead of Playwright's: msedge or chrome
//   OUT_DIR     where to write the PNGs (default docs/screenshots)
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const OUT_DIR = path.resolve(process.env.OUT_DIR ?? 'docs/screenshots');
const channel = process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {};

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch(channel);

async function signIn(page, no, password, home) {
  await page.goto(`${BASE_URL}/login/`);
  await page.getByLabel('Employee number').fill(no);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(`**${home}`);
}

async function signOut(page) {
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.waitForURL('**/login/');
}

async function add(page, name, times = 1) {
  for (let i = 0; i < times; i++) await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
}

async function pay(page, method = 'Cash') {
  await page.getByRole('button', { name: 'Take payment' }).click();
  if (method !== 'Cash') await page.locator('label').filter({ hasText: new RegExp(`^${method}$`) }).click();
  await page.getByRole('button', { name: 'Confirm payment' }).click();
  await page.getByRole('button', { name: 'New order' }).click();
}

async function shot(page, name) {
  await page.waitForTimeout(300); // let fonts and transitions settle
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
  console.log(`saved ${name}.png`);
}

// ---------- desktop ----------
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await desktop.newPage();

await page.goto(`${BASE_URL}/login/`);
await page.getByRole('heading', { name: 'Restaurant POS' }).waitFor();
await shot(page, 'login');

// A few sales so the dashboards and reports have something to show.
await signIn(page, 'cashier001', 'cashier123', '/cashier/dashboard/');
await page.goto(`${BASE_URL}/cashier/takeaway/`);
await add(page, 'Classic Burger', 2);
await add(page, 'Fries', 2);
await add(page, 'Cola', 2);
await pay(page);
await add(page, 'Burger Combo');
await add(page, 'Chocolate Cake');
await pay(page, 'Card');

await page.goto(`${BASE_URL}/cashier/dine-in/`);
await page.getByRole('button', { name: /^T03/ }).click();
await add(page, 'Margherita Pizza', 2);
await add(page, 'Caesar Salad');
await add(page, 'Fresh Lemonade', 3);
await pay(page, 'Split');

await page.getByRole('button', { name: /^T02/ }).click();
await add(page, 'Grilled Steak');
await add(page, 'Hot Wings');
await add(page, 'Mineral Water', 2);
await page.getByRole('button', { name: 'Keep open' }).click();

await page.getByRole('button', { name: /^T05/ }).click();
await add(page, 'Chicken Alfredo');
await add(page, 'Vanilla Ice Cream', 2);
await add(page, 'Fresh Lemonade');
await page.evaluate(() => document.querySelectorAll('ul').forEach((el) => el.scrollTo(0, 0)));
await shot(page, 'dine-in');

await page.getByRole('button', { name: 'Take payment' }).click();
await page.getByLabel('Cash received').fill('40');
await shot(page, 'payment');
await page.getByRole('button', { name: 'Confirm payment' }).click();
await page.getByTestId('receipt').waitFor();
await shot(page, 'receipt');
await page.getByRole('button', { name: 'New order' }).click();

await page.goto(`${BASE_URL}/cashier/dashboard/`);
await page.getByRole('heading', { name: /Hello/ }).waitFor();
await shot(page, 'cashier-dashboard');

// Kitchen: move one ticket along so different states are visible.
await signOut(page);
await signIn(page, 'kitchen001', 'kitchen123', '/kitchen/');
await page.getByRole('button', { name: 'Start preparing' }).first().click();
await page.getByRole('button', { name: 'Start preparing' }).first().click();
await page.getByRole('button', { name: 'Mark ready' }).first().click();
await shot(page, 'kitchen');

await signOut(page);
await signIn(page, 'admin001', 'admin123', '/admin/dashboard/');
await shot(page, 'admin-dashboard');
await page.goto(`${BASE_URL}/admin/products/`);
await page.getByRole('heading', { name: 'Menu' }).waitFor();
await shot(page, 'menu');
await page.goto(`${BASE_URL}/admin/reports/`);
await page.getByRole('heading', { name: 'Reports' }).waitFor();
await shot(page, 'reports');
await page.goto(`${BASE_URL}/admin/discounts/`);
await page.getByRole('heading', { name: 'Discounts' }).waitFor();
await shot(page, 'discounts');

// ---------- phone (same data, copied over) ----------
const state = await desktop.storageState();
await desktop.close();
const phone = await browser.newContext({ ...devices['Pixel 7'], storageState: state });
const mobile = await phone.newPage();
await mobile.goto(`${BASE_URL}/cashier/takeaway/`);
await mobile.getByRole('heading', { name: 'Takeaway order' }).waitFor();
await add(mobile, 'Classic Burger');
await add(mobile, 'Cola');
await mobile.evaluate(() => window.scrollTo(0, 0));
await shot(mobile, 'mobile-takeaway');
await mobile.getByRole('link', { name: /View order/ }).click();
await mobile.waitForTimeout(400);
await shot(mobile, 'mobile-order');
await mobile.goto(`${BASE_URL}/admin/dashboard/`);
await mobile.getByRole('heading', { name: 'Dashboard' }).waitFor();
await shot(mobile, 'mobile-dashboard');

await browser.close();
console.log(`done: ${OUT_DIR}`);
