# Contributing

Thanks for taking the time to help. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug or suggesting a feature

Open an issue using one of the templates. For bugs, include the steps to reproduce, what you expected, what happened, and your browser and device. A screenshot helps a lot.

If the problem is a security issue, please read [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Setting up

You need Node.js 22.12 or newer (there's an `.nvmrc`, so `nvm use` picks the right version).

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000 and sign in with `admin001` / `admin123`.

## Making a change

1. Fork the repository and create a branch from `main`, for example `fix/receipt-totals` or `feature/table-transfer`.
2. Keep business rules in `src/lib/` as plain functions with unit tests in `tests/`. Pages and components should stay thin and call into `src/lib`.
3. Only `src/lib/storage.ts` talks to `localStorage`. Read data in components with `useStoredData()` so screens refresh when data changes.
4. Use relative paths for assets and `next/link` for links, so the app keeps working under a sub-path such as GitHub Pages.
5. If you add an npm script, document it in the README's script table (`npm run check:scripts` enforces this).

## Before you open a pull request

Run the same checks as CI:

```bash
npm run lint && npm run typecheck && npm test
```

```bash
npm run check:links && npm run check:scripts
```

```bash
npm run build && npm run check:site && npm run test:e2e
```

On Windows or macOS you can run the end-to-end tests with a browser you already have: `PW_CHANNEL=msedge npm run test:e2e` (or `chrome`).

Then open a pull request that explains what changed and why. Screenshots help for UI changes, and the template has a short checklist.

## Style

- TypeScript, strict mode. Prefer small, named functions over clever one-liners.
- Tailwind for styling; reuse the components in `src/components/ui/`.
- Write user-facing text in plain language and say what will happen ("Delete table T04?").
- Keep pull requests focused on one change.
