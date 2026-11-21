#!/usr/bin/env node
/**
 * Link checker.
 *
 * 1. Markdown (README.md, CONTRIBUTING.md, docs/**): every relative link and image must
 *    point to a file that exists, every #anchor must match a heading, and no link may be
 *    root-absolute ("/docs/x.png" breaks on GitHub and on Pages sub-paths).
 * 2. Source (src/**): no hard-coded root-absolute asset paths in raw <a>, <img>, <script>
 *    or CSS url(). next/link and the router add the base path for you; raw tags don't.
 * 3. Built site (optional, `--site out`): every href/src in the exported HTML and every
 *    url() in its CSS resolves to a real file, taking NEXT_PUBLIC_BASE_PATH into account.
 *
 * Usage:
 *   node scripts/check-links.mjs                 # markdown + source
 *   node scripts/check-links.mjs --site out      # ...plus the static export
 * Exit code is 1 when anything is broken.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'out', 'test-results', 'playwright-report', 'coverage']);
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i; // http:, https:, mailto:, data:, //cdn...

const problems = [];
let checked = 0;
const report = (kind, file, line, detail) => problems.push(`${kind.padEnd(8)} ${relative(ROOT, file)}:${line}  ${detail}`);
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

function walk(dir, keep, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, keep, out);
    else if (keep(full)) out.push(full);
  }
  return out;
}

// GitHub's heading -> anchor rules (close enough for our headings).
function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

function anchorsOf(markdown) {
  const seen = new Map();
  const anchors = new Set();
  const body = markdown.replace(/```[\s\S]*?```/g, '');
  for (const m of body.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = slugify(m[1]);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    anchors.add(n === 0 ? base : `${base}-${n}`);
  }
  for (const m of body.matchAll(/<a\s+(?:name|id)=["']([^"']+)["']/g)) anchors.add(m[1]);
  return anchors;
}

// ---------- 1. markdown ----------
const markdownFiles = [
  ...['README.md', 'CONTRIBUTING.md', 'SECURITY.md'].map((f) => join(ROOT, f)).filter(existsSync),
  ...walk(join(ROOT, 'docs'), (f) => f.endsWith('.md')),
];

for (const file of markdownFiles) {
  const text = readFileSync(file, 'utf8');
  const prose = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' ')); // ignore code blocks
  const anchors = anchorsOf(text);
  const refs = [
    ...[...prose.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)].map((m) => ({ value: m[1], index: m.index })),
    ...[...prose.matchAll(/<(?:img|a|source)\b[^>]*\s(?:src|href|srcset)=["']([^"']+)["']/g)].map((m) => ({ value: m[1], index: m.index })),
  ];
  for (const { value, index } of refs) {
    if (EXTERNAL.test(value)) continue;
    checked++;
    const line = lineOf(text, index);
    if (value.startsWith('#')) {
      if (!anchors.has(decodeURIComponent(value.slice(1)))) report('ANCHOR', file, line, `${value} (no matching heading)`);
      continue;
    }
    if (value.startsWith('/')) {
      report('ABSOLUTE', file, line, `${value} (use a relative path)`);
      continue;
    }
    const [path, hash] = value.split('#');
    const target = resolve(dirname(file), decodeURIComponent(path));
    if (!existsSync(target)) {
      report('BROKEN', file, line, value);
      continue;
    }
    if (hash && target.endsWith('.md') && !anchorsOf(readFileSync(target, 'utf8')).has(hash)) {
      report('ANCHOR', file, line, `${value} (no matching heading in ${relative(ROOT, target)})`);
    }
  }
}

// ---------- 2. source ----------
const sourceFiles = walk(join(ROOT, 'src'), (f) => /\.(tsx?|jsx?|css)$/.test(f));
const rawAbsolute = [
  /<(?:a|img|script|source|link)\b[^>]*\s(?:href|src)=["']\/(?!\/)[^"']*["']/g, // <img src="/x.png">
  /url\(\s*["']?\/(?!\/)[^)"']*["']?\s*\)/g, // url(/x.png)
];
for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of rawAbsolute) {
    for (const m of text.matchAll(pattern)) {
      checked++;
      report('ABSOLUTE', file, lineOf(text, m.index), `${m[0].slice(0, 80)} (breaks under a base path; use next/link or a relative path)`);
    }
  }
}

// ---------- 3. built site ----------
const siteFlag = process.argv.indexOf('--site');
if (siteFlag !== -1) {
  const siteDir = resolve(process.argv[siteFlag + 1] ?? 'out');
  if (!existsSync(siteDir)) {
    console.error(`--site: ${relative(ROOT, siteDir)} does not exist. Run "npm run build" first.`);
    process.exit(2);
  }
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');
  const resolveSitePath = (value) => {
    let clean = decodeURIComponent(value.split('#')[0].split('?')[0]);
    if (basePath && (clean === basePath || clean.startsWith(`${basePath}/`))) clean = clean.slice(basePath.length) || '/';
    else if (basePath) return null; // root-absolute path that skips the base path: broken on Pages
    return join(siteDir, clean);
  };
  const exists = (target) => {
    if (existsSync(target) && statSync(target).isFile()) return true;
    return existsSync(join(target, 'index.html')) || existsSync(`${target}.html`);
  };

  for (const file of walk(siteDir, (f) => ['.html', '.css'].includes(extname(f)))) {
    const text = readFileSync(file, 'utf8');
    const refs =
      extname(file) === '.html'
        ? [...text.matchAll(/<(?:a|link|script|img|source)\b[^>]*?\s(?:href|src)="([^"]*)"/g)]
        : [...text.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/g)];
    for (const m of refs) {
      const value = m[1].trim();
      if (!value || value.startsWith('#') || EXTERNAL.test(value)) continue;
      checked++;
      const target = value.startsWith('/') ? resolveSitePath(value) : resolve(dirname(file), value.split('#')[0].split('?')[0]);
      if (target === null) report('BASEPATH', file, lineOf(text, m.index), `${value} (missing base path ${basePath})`);
      else if (!exists(target)) report('BROKEN', file, lineOf(text, m.index), value);
    }
  }
}

for (const p of problems) console.log(p);
console.log(`\nChecked ${checked} references: ${problems.length} problem(s).`);
process.exit(problems.length ? 1 : 0);
