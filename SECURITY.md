# Security policy

## Supported versions

Only the latest version on the `main` branch (and the live demo built from it) receives fixes.

## What this project is

The POS runs entirely in the browser and keeps its data in `localStorage`. Role checks keep staff on the right screens, but anyone with access to the browser can read or change that data with the developer tools. That's a known limit, described in the README's [security notes](README.md#security-notes), not a vulnerability.

Things that would count as security issues, for example:

- passwords stored or leaked in a recoverable form
- a way to run script in the page from data someone else can control (an imported backup, a product name, a CSV export)
- secrets committed to the repository
- a dependency with a known vulnerability that affects the app

## Reporting a problem

Please don't post exploit details in a public issue. Instead, open an issue that says you'd like to report a security problem (no details), or contact me through my GitHub profile, [@Kianis534](https://github.com/Kianis534). I'll reply and arrange a private way to share the details.

Please include what you found, the steps to reproduce it, and what an attacker could do with it. I'll confirm the report, work on a fix, and credit you in the fix's pull request if you'd like.
