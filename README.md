# Fitsume

Write a resume in markdown. The preview finds the largest font size and line
spacing that still fits everything on exactly one A4 page.

**Live at [fitsume.fajarwz.com](https://fitsume.fajarwz.com).**

- **Auto-fit** — a two-pass binary search: biggest font size first, then the widest
  line spacing that still fits
- **No layout thrashing** — text is measured without touching the DOM, so the
  preview does not flicker or shift as you type
- **Markdown editor** — `#`, `##`, `###`, `-`, `---`, links, and the two conventions that
  make a resume header read the way it should
- **Resume library** — as many named resumes as you like, each with its own
  typography settings
- **Print to PDF** — the browser's own print pipeline, sized for A4, named after
  the resume on screen
- **No server, no account, nothing uploaded** — your resumes live in your browser,
  and one file backs all of them up
- **Works offline** — the font is bundled, so the fit is measured against the font
  that actually renders

## The markdown dialect

Five rules. The two that are easy to miss are what make a header come out right:
the line after your name is your role, and the line after that is the faint contact
line. The line under a `### ` job title is its dates.

```markdown
# Your Name

Your Role
City · you@example.com · github.com/you
---

A short summary.

## EXPERIENCE

### Job Title — Company

2020 — Present

- What you did, and what it changed

## EDUCATION

### Degree — University

Details
```

Blank lines are ignored, so space the source out however you like. There is a
cheat sheet in the editor, and a toolbar for section headings, job titles, bullets,
rules and links.

**Email and web addresses are links.** Write one and it is clickable, in the preview and
in the exported PDF — `you@example.com`, `https://yoursite.com`, and a bare domain like
`github.com/you`. To show a label instead of the address, write `[GitHub](github.com/you)`;
the **Link** button in the editor toolbar drops in `[label](example.com)` as a placeholder
to type over, and it renders as a real link while you do. A label that the line breaker
splits in two loses only its click, never its text, which is also why a one-word label is
the safe choice.

## How the fit works

Measuring text normally means `getBoundingClientRect()` or `offsetHeight`, each of
which forces the browser to re-lay-out the document. A binary search that runs
hundreds of measurements per frame is not possible that way.

So the text is prepared once per string with a canvas — normalise, segment, read
glyph advances — and after that, line breaking and height are arithmetic. The fit
search then does two passes: the largest font size at the tightest line spacing,
then the widest line spacing at that size. Prepared text is cached, so a repeat
measurement is a lookup rather than a re-measure.

That cache is measured, not assumed. On the densest sample (34 blocks, 2,324
characters), one fit run went from **7,590 text preparations to 396**, and from
**51.4 ms to 6.2 ms** — with the real engine, on a real canvas. Run it yourself:

```bash
npx vitest run scripts/profile-measurement.test.js
```

The measurement engine only appears in one file (`src/lib/textMetrics.js`).
Everything else in `lib/` takes the metrics it is given, which is why the fit engine
can be tested exhaustively without a canvas.

## Your data

Everything is stored in your browser's `localStorage`. There is no server, no
account, and no upload. That has two consequences worth knowing:

- **A backup file is the only copy that survives clearing browser data.** The
  library screen writes the whole library to a `.json` file, and restoring it
  merges by default — restoring the same backup twice cannot overwrite the resume
  you have been editing since.
- **If your browser refuses storage** (private mode, a hardened profile), the app
  still works, but only for the session, and it says so rather than pretending to
  save.

Each resume can also be exported as a `.md` file, which is what the import does.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
```

## Checks

```bash
npm run verify     # lint + tests with coverage + production build
```

`verify` is the same gate CI runs, so a failure should never be discovered for the
first time on CI.

## How the code is arranged

```
src/
  lib/         pure: markdown, measurement, fit search, layout, storage, files
  hooks/       React glue over lib
  components/  ui primitives, layout, builder, library, samples
  pages/       route-level screens
  state/       providers
```

Two rules keep it that way, and ESLint enforces both:

1. **`lib/` never imports React**, a hook, a component, or a page. It is pure
   functions and data, which is what makes it testable without a DOM.
2. **A page is never imported by a component.** Pages compose; components do not
   reach upward.

## Tests

- **`lib/`** is covered exhaustively: the parser's block styles, the fit search's
  bounds and fallbacks, the measurement cache, storage round-trips, corruption,
  migration, quota failures, and file import/export.
- **Components** are tested through the DOM as a person would use them.
- **The app end to end**: it renders, types a resume, waits for the fit, reloads
  and checks the work survived, and asserts the export is named after the resume on
  screen.
- **Every shipped sample** is fitted against the real measurement engine, and the
  geometry that gets _rendered_ is checked against the page — so the preview cannot
  silently disagree with the fit that produced it.
- Coverage thresholds apply to `lib/` only, on purpose: component tests exist to
  catch behaviour regressions, not to chase a number.

`canvas` is an **optional** dependency. It gives jsdom a real font engine, so the
tests that need true glyph metrics actually run; without it they skip themselves
rather than failing, which keeps installs working on a machine with no prebuilt
binary.

## Stack

- **React 19**
- **TypeScript** (strict)
- **Vite**
- **Tailwind CSS**
- **[pretext](https://github.com/chenglou/pretext)** — DOM-free text measurement
- **Vitest + Testing Library** — testing
- **ESLint + Prettier** — linting and formatting

Geist Sans and Geist Mono are bundled via `@fontsource-variable/geist` and
`@fontsource-variable/geist-mono`.

## Design

The shell follows Vercel's system: a `#fafafa` page, hairline `#eaeaea` borders,
near-black text, one near-black primary button, one blue for links and focus, all set
in Geist. Every colour lives in `src/styles/tokens.css`, so the whole look is a token
swap rather than an edit across twenty components.

The A4 sheet is deliberately excluded from that: it stays paper-white with ink-black
text in both themes, because it is a document that prints. A dark-grey resume is a
broken resume, not a dark mode.

The values were taken from the public account of Vercel's design system
([design-bites](https://github.com/educlopez/design-bites), MIT) rather than vendored
into this repo as a spec document.

Fitsume is inspired by [vladartym/always-fit-resume](https://github.com/vladartym/always-fit-resume).

## License

MIT — see [LICENSE](./LICENSE).
