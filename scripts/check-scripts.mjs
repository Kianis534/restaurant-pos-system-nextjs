#!/usr/bin/env node
/**
 * Keeps package.json, the helper scripts and the README honest:
 *
 * - every npm script runs something that exists (a file in scripts/, or a CLI that is
 *   installed in node_modules/.bin),
 * - every helper script in scripts/ parses (node --check),
 * - every npm script is documented in the README, and every `npm run x` / `npm x` the
 *   README tells people to type actually exists.
 *
 * Usage:  node scripts/check-scripts.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const scripts = pkg.scripts ?? {};
const readme = existsSync(join(ROOT, 'README.md')) ? readFileSync(join(ROOT, 'README.md'), 'utf8') : '';
const problems = [];

// npm runs these on its own around `npm run build`; they don't need to be typed by anyone.
const LIFECYCLE = /^(pre|post)/;
const BUILTIN_NPM = new Set(['install', 'ci', 'test', 'start', 'run', 'i', 'audit', 'outdated', 'approve-scripts', 'exec']);

// 1. Each script points at something real.
const binDir = join(ROOT, 'node_modules', '.bin');
const haveBins = existsSync(binDir);
for (const [name, command] of Object.entries(scripts)) {
  for (const part of command.split(/&&|\|\||;/)) {
    const [bin, ...args] = part.trim().split(/\s+/);
    if (!bin) continue;
    if (bin === 'node') {
      const file = args.find((a) => !a.startsWith('-'));
      if (file && !existsSync(join(ROOT, file))) problems.push(`npm script "${name}" runs ${file}, which does not exist`);
    } else if (bin === 'npm' || bin === 'npx') {
      const target = args[0] === 'run' ? args[1] : null;
      if (target && !scripts[target]) problems.push(`npm script "${name}" calls missing script "${target}"`);
    } else if (haveBins && !existsSync(join(binDir, bin)) && !existsSync(join(binDir, `${bin}.cmd`))) {
      problems.push(`npm script "${name}" needs "${bin}", which is not installed (is it in devDependencies?)`);
    }
  }
}

// 2. Helper scripts parse.
const scriptFiles = readdirSync(join(ROOT, 'scripts')).filter((f) => /\.(mjs|cjs|js)$/.test(f));
for (const file of scriptFiles) {
  try {
    execFileSync(process.execPath, ['--check', join(ROOT, 'scripts', file)], { stdio: 'pipe' });
  } catch (error) {
    problems.push(`scripts/${file} has a syntax error:\n${String(error.stderr ?? error.message).trim()}`);
  }
}

// 3. README and package.json agree.
if (readme) {
  // Commands live in code blocks and `inline code`; prose like "npm scripts" is ignored.
  const code = [...readme.matchAll(/```[\s\S]*?```|`[^`\n]+`/g)].map((m) => m[0]).join('\n');
  for (const name of Object.keys(scripts)) {
    if (LIFECYCLE.test(name)) continue;
    const mentioned = code.includes(`npm run ${name}`) || (['test', 'start'].includes(name) && code.includes(`npm ${name}`));
    if (!mentioned) problems.push(`npm script "${name}" is not documented in README.md`);
  }
  for (const m of code.matchAll(/\bnpm run ([\w:-]+)/g)) {
    if (!scripts[m[1]]) problems.push(`README.md mentions "npm run ${m[1]}", but package.json has no such script`);
  }
  for (const m of code.matchAll(/\bnpm ([a-z][\w-]*)\b/g)) {
    if (!BUILTIN_NPM.has(m[1]) && !scripts[m[1]]) problems.push(`README.md mentions "npm ${m[1]}", which is not an npm command or script`);
  }
}

for (const p of [...new Set(problems)]) console.log(`PROBLEM  ${p}`);
console.log(`\nChecked ${Object.keys(scripts).length} npm scripts and ${scriptFiles.length} helper scripts: ${new Set(problems).size} problem(s).`);
process.exit(problems.length ? 1 : 0);
