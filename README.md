# fittyresume

Write your resume in markdown. The preview finds the largest font size and line
spacing that still fits everything on exactly one A4 page — no DOM measuring, no
flickering, no layout shifts.

- **Auto-fit** — a two-pass binary search picks the font size, then the line height
- **Markdown editor** — `#`, `##`, `###`, `-`, `---`
- **Live A4 preview** — updates as you type
- **Resume library** — several named resumes, each with its own typography settings
- **PDF export** — the browser's own print pipeline, sized for A4
- **No server, no account** — everything stays in your browser's storage

## Status

Under construction. See `.hermes/plans/` for the build plan.

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

## Stack

React 19 · Vite · Tailwind · [pretext](https://github.com/chenglou/pretext) for
DOM-free text measurement · Vitest + Testing Library · ESLint + Prettier.

## License

MIT — see [LICENSE](./LICENSE).
