# AGENTS.md

Guidance for AI coding agents working in this repository. It is a compact
orientation: what the product is, how it is deployed, how the code is arranged,
and the rules that must not be broken.

## What this is

**Fitsume** — an auto-fit resume builder. Markdown in, one A4 page out. The
preview finds the largest font size and line spacing that still fit everything
on exactly one A4 page.

- **Live at https://fitsume.fajarwz.com**
- Runs **entirely in the browser**: no server, no account, no upload.
- All user data lives in `localStorage` under the key `fitsume.library`
  (see `src/lib/stash.ts`). The whole library runtime is pure functions over a
  plain library object — the storage object is passed in, never reached for.

## Deployment

- **Host:** Netlify, custom domain `fitsume.fajarwz.com`. Config in `netlify.toml`.
- Build command `npm run build` → publish `dist/`. Netlify runs this on push.
- **Do not change the domain.** The web stays `fitsume.fajarwz.com`.
- `netlify.toml` rewrites `/*` to `/index.html` so client-side routing
  (BrowserRouter) survives a direct hit/refresh on nested routes.
- Built assets in `/assets/*` are served `immutable` — hashed filenames never collide.

## Commands

```bash
npm install
npm run dev         # local dev at http://localhost:5173
npm run build       # production build to dist/
npm run test:run    # vitest with coverage (lib/: lines/functions/statements >= 95, branches >= 90)
npm run lint        # eslint
npm run typecheck   # tsc (strict TypeScript)
npm run format      # prettier --write .
npm run verify      # lint + typecheck + test:run + build  — the CI gate; run before assuming work is done
```

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS · React Router v7 ·
[pretext](https://github.com/chenglou/pretext) for DOM-free text measurement ·
Vitest + Testing Library · ESLint + Prettier. Geist fonts bundled via
`@fontsource-variable/*`. Node >= 20.

## Architecture — the rules that matter

Arrangement:

```
src/
  lib/         pure: markdown, measurement, fit search, layout, storage, files
  hooks/       React glue over lib
  components/  ui primitives, layout, builder, library, samples
  pages/       route-level screens
  state/       providers
```

Two rules, enforced by ESLint — both will fail CI if broken:

1. **`lib/` never imports React**, a hook, a component, or a page. It is pure
   functions and data, which is what makes it testable without a DOM. The
   measurement engine lives in exactly one file (`src/lib/textMetrics.ts`);
   everything else takes the metrics it is given.
2. **A page is never imported by a component.** Pages compose; components do
   not reach upward.

## Facts an agent gets wrong otherwise

- **There is no backend or database.** Any question about "users", telemetry, or
  server state has no answer in this repo — the app reports nothing anywhere.
  Do not invent one.
- **The fit engine is a deliberate, heavily-tested design.** Don't "simplify" it
  to `getBoundingClientRect`/`offsetWidth` — those force layout and make the
  binary search impossible. The canvas-text-measurement approach is a feature.
- **`canvas` is an optional dev dependency** for real font metrics in tests;
  without it those tests skip themselves, they don't fail. Don't make it required.
- **The A4 sheet is paper-white with ink-black text in both themes** — it is a
  document that prints. A dark-grey resume is a broken resume, not a dark mode.
  Theme colours live in `src/styles/tokens.css`; the sheet is deliberately
  excluded from them.
- **The markdown dialect is small and rules-based**, not CommonMark-Complete.
  Read `src/lib/markdown.ts` and the dialect section of `README.md` before
  touching the parser.
- Samples are seeded once per library (`samplesSeeded` flag). Deleting a sample
  must not bring all of them back on reload; `restore` must never duplicate.