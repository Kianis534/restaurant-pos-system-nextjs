#!/usr/bin/env node
// Runs after `next build` (npm "postbuild").
//
// Next.js 16 writes route-segment prefetch files during static export with names like
// `__next.cashier.dine-in.__PAGE__.txt`. On Windows it builds that name from a path that
// still contains backslashes, so it ends up as folders instead:
//   out/cashier/dine-in/__next.cashier/dine-in/__PAGE__.txt
// The browser then asks for the dotted file name, gets a 404, and client-side navigation
// gets slow or stuck. This script moves those files to the names the browser expects.
// On Linux and macOS there is nothing to fix and the script does nothing.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.argv[2] ?? 'out');

async function exists(p) {
  return fs.access(p).then(
    () => true,
    () => false,
  );
}

async function listFiles(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(full)));
    else files.push(full);
  }
  return files;
}

async function walk(dir, fixes) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith('__next.')) {
      for (const file of await listFiles(full)) {
        const rel = path.relative(full, file).split(path.sep).join('.');
        const target = path.join(dir, `${entry.name}.${rel}`);
        await fs.rename(file, target);
        fixes.count += 1;
      }
      await fs.rm(full, { recursive: true, force: true });
    } else if (entry.name !== '_next') {
      await walk(full, fixes);
    }
  }
}

if (!(await exists(outDir))) {
  console.log(`fix-export-segments: ${outDir} not found, nothing to do.`);
  process.exit(0);
}
const fixes = { count: 0 };
await walk(outDir, fixes);
console.log(fixes.count ? `fix-export-segments: renamed ${fixes.count} prefetch file(s).` : 'fix-export-segments: nothing to fix.');
