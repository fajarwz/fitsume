/**
 * Builder screen: editor + A4 preview + settings.
 *
 * Scaffold only. The editor, preview, fit status and settings panel are built in
 * the UI phases; this renders enough to prove the shell, the theme tokens and the
 * routing are wired before any of that lands.
 */
export default function BuilderPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">fittyresume</h1>
      <p className="max-w-prose text-sm leading-relaxed opacity-70">
        Write your resume in markdown and the preview picks the largest font size and line spacing
        that still fits one A4 page. Everything stays in your browser.
      </p>
      <p className="max-w-prose text-xs opacity-50">
        Scaffold in place: the editor, preview and resume library land in the next phases.
      </p>
    </main>
  )
}
