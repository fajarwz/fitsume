# <img src="public/favicon.svg" alt="" width="28" height="28" style="vertical-align: -6px; display: inline-block" /> Fitsume

![visitors](https://img.shields.io/badge/dynamic/json?url=https://fitsume.goatcounter.com/counter/.json&query=count&label=Visits&color=blue)

Write a resume in Markdown. Fitsume automatically finds the largest font size and line spacing that fit everything on exactly one A4 page.

**Live at [fitsume.fajarwz.com](https://fitsume.fajarwz.com).**

## Demo

<video src="demo/demo.mp4" width="100%" controls></video>

## Features

- **Auto-fit** — two-pass binary search finds the largest font size, then the widest line spacing that fits.
- **Markdown editor** — headings, bullets, rules, links, and resume-specific formatting conventions.
- **Resume library** — create unlimited named resumes with independent typography settings.
- **Print to PDF** — A4-sized output using the browser's print pipeline, named after the current resume.
- **Private by design** — no account or server; resumes stay in your browser.
- **Offline support** — bundled fonts keep text measurements consistent with the rendered preview.
- **Backup and restore** — export and restore your entire resume library as JSON.

## How It Works

Text is measured using canvas glyph metrics rather than repeated DOM layout calculations. Once text is prepared, line breaking and height calculations use arithmetic, allowing the fit engine to search efficiently without flickering the preview.

Prepared text is cached to avoid redundant measurements. On a dense sample of 34 blocks and 2,324 characters, profiling showed:

| Metric | Before | After |
|---|---:|---:|
| Text preparations | 7,590 | 396 |
| Runtime | 51.4 ms | 6.2 ms |

Run the benchmark yourself:

```bash
npx vitest run scripts/profile-measurement.test.ts
```

The measurement engine lives in `src/lib/textMetrics.ts`. The rest of the core library uses the metrics it receives, keeping the fitting logic testable independently of the canvas.

## Markdown Syntax

Fitsume supports a small Markdown dialect tailored for resumes.

```markdown
**# Your Name**

Your Role
City · you@example.com · github.com/you
**---**

A short summary.

**## EXPERIENCE**

**### Job Title — Company**

2020 — Present

- What you did, and what it changed

**## EDUCATION**

**### Degree — University**

Details
```

The conventions are:

- `#` introduces your name.
- The following line is your role; the next is your contact information.
- `##` introduces a section.
- `###` introduces a job title or degree; the following line contains its dates or details.
- `---` creates a horizontal rule.

Blank lines are ignored. The editor also includes a cheat sheet and formatting toolbar.

Email addresses and web addresses are clickable in the preview and exported PDF. Bare domains such as `github.com/you` are supported, as are Markdown links with custom labels.

## Your Data

Resumes are stored in browser `localStorage`. Nothing is uploaded to a server, and no account is required.

- Export your library to a JSON backup and restore it later.
- Restore merges with existing resumes by default.
- If browser storage is unavailable, the app can operate for the current session without persistent saving.
- Individual resumes can be imported and exported as Markdown files.

**Keep a backup:** clearing browser data can erase locally stored resumes.

## Development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173`.

## Checks

```bash
npm run verify
```

This runs linting, tests with coverage, and the production build. It is also the verification gate used by CI.

## Architecture

```text
src/
  lib/         Pure logic: markdown, measurement, fit search, layout, storage, files
  hooks/       React hooks over the core library
  components/  UI primitives, layout, builder, library, samples
  pages/       Route-level screens
  state/       Providers
```

Two architectural rules are enforced by ESLint:

1. `lib/` must not import React, hooks, components, or pages.
2. Components must not import pages; pages compose components instead.

The core library is designed to remain independently testable.

## Testing

- **Core library:** parser behavior, fit-search bounds and fallbacks, measurement caching, storage, migrations, and file import/export.
- **Components:** interaction tests using the DOM and Testing Library.
- **End to end:** resume editing, fit completion, persistence after reload, and PDF export naming.
- **Samples:** each shipped sample is checked against the real measurement engine, including rendered page geometry.

Coverage thresholds apply to `lib/`, where deterministic unit coverage is most useful.

The optional `canvas` dependency provides real font metrics in jsdom for tests that need them. Those tests skip when the dependency is unavailable.

## Stack

- React 19
- TypeScript (strict)
- Vite
- Tailwind CSS
- [pretext](https://github.com/chenglou/pretext) — DOM-free text measurement
- Vitest and Testing Library
- ESLint and Prettier

Geist Sans and Geist Mono are bundled through `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`.

## Design

Fitsume uses a restrained, Vercel-inspired interface: a light background, subtle borders, near-black text, and blue links and focus states. Design tokens are centralized in `src/styles/tokens.css`.

The resume itself always uses a white page and black text, regardless of the interface theme, to preserve print fidelity.

The design was informed by [design-bites](https://github.com/educlopez/design-bites) (MIT).

Fitsume is inspired by [vladartym/always-fit-resume](https://github.com/vladartym/always-fit-resume).

## Deployment

Hosted on Netlify at [fitsume.fajarwz.com](https://fitsume.fajarwz.com).

Deployment configuration lives in `netlify.toml`. The production build publishes `dist/`, client-side routes fall back to `/index.html`, and hashed assets use immutable caching.

## Working on This Repository?

Read [`AGENTS.md`](./AGENTS.md) before making changes. It documents the architecture constraints and non-obvious implementation details that contributors and AI coding agents need to follow.

## License

MIT — see [LICENSE](./LICENSE).
