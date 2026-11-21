#!/usr/bin/env node
// Renders src/app/icon.svg into the PNG sizes phones and the web app manifest need.
// Run it after changing the icon:  npm run icons
//
// Writes:
//   src/app/apple-icon.png         180x180, home-screen icon on iOS
//   public/icons/icon-192.png      manifest icon
//   public/icons/icon-512.png      manifest icon
//   public/icons/maskable-512.png  manifest icon with a safe zone for Android's shape masks
//
// PW_CHANNEL=msedge or chrome uses an installed browser instead of Playwright's.
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const svg = await readFile(path.join(root, 'src/app/icon.svg'), 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const targets = [
  { file: 'src/app/apple-icon.png', size: 180, padding: 0, background: '#2563eb' },
  { file: 'public/icons/icon-192.png', size: 192, padding: 0, background: 'transparent' },
  { file: 'public/icons/icon-512.png', size: 512, padding: 0, background: 'transparent' },
  // Maskable icons get cropped to circles/squircles, so keep the glyph inside the middle 80%.
  { file: 'public/icons/maskable-512.png', size: 512, padding: 0.1, background: '#2563eb' },
];

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const page = await browser.newPage();
for (const t of targets) {
  await mkdir(path.dirname(path.join(root, t.file)), { recursive: true });
  const inner = Math.round(t.size * (1 - t.padding * 2));
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;display:grid;place-items:center;width:${t.size}px;height:${t.size}px;background:${t.background}">` +
      `<img src="${dataUrl}" width="${inner}" height="${inner}"></body></html>`,
  );
  await page.screenshot({ path: path.join(root, t.file), omitBackground: t.background === 'transparent' });
  console.log(`wrote ${t.file} (${t.size}x${t.size})`);
}
await browser.close();
