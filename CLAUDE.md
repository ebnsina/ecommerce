# Working on this project

## Accessibility is not optional

**Every piece of UI must pass WCAG 2.1 AA / WAI-ARIA before it ships.** This is a
hard gate, not a nice-to-have — most shoppers here are on mid-range Android
phones in bright daylight, and non-technical staff use the admin all day.

Specifically:

- **Contrast.** Text and its background clear **4.5:1**; large text (18.66px bold
  or 24px) and meaningful graphics clear **3:1**. Measure it — do not eyeball it.
  A one-line Node script with the WCAG relative-luminance formula is enough, and
  this repo has caught real failures that way (five of seven order statuses once
  ran as low as 2.15:1).
- **Colour is never the only signal.** Pair it with an icon, a label, or a shape.
  Status badges in this codebase are neutral tags with a coloured _icon_ for
  exactly this reason — an icon needs 3:1, so the hue can stay bright and
  distinguishable while the label stays plain ink.
- **Every interactive element is reachable and operable by keyboard**, with a
  visible focus ring (`2px solid var(--color-primary)` at `2px` offset). Do not
  remove outlines.
- **Real semantics.** Use the native element first — `<button>`, `<a>`,
  `<dialog>`, `<label>`. Reach for ARIA only when no element fits, and then
  implement the full pattern: a listbox needs `aria-activedescendant`, roving
  `tabindex`, and arrow-key handling, not just `role="listbox"`.
- **Every control has an accessible name.** Icon-only buttons need `aria-label`.
- **Images**: meaningful ones need real `alt`; decorative ones take `alt=""`.
- **Motion respects `prefers-reduced-motion`** — animations collapse to zero
  duration, never merely shorten.
- **Forms** associate labels with inputs, mark invalid fields with
  `aria-invalid`, and announce errors with `role="alert"`.
- `pnpm run check` must be clean. Svelte's a11y warnings are findings, not noise:
  fix the cause, and only silence one with a comment explaining why the pattern
  is correct.

## Design

- **Tokens are the single source of truth.** Colour, radius, type and motion live
  in the `@theme` block in `src/routes/layout.css`. Never hardcode a hex value in
  a component.
- **Themes are ramps, not hues.** A store theme supplies a full nine-stop ramp;
  the 700 stop backs button labels and links, so it must clear 4.5:1 both as text
  on white and under white text. Check a new preset before adding it.
- **Borders, not shadows** — with one deliberate exception: the shadcn-style tab
  indicator. A border must be visible against its own background (~1.3:1); an
  invisible border is worse than none.
- **Radius scales with size**: `rounded-lg` for small controls, `rounded-xl` for
  standard, `rounded-2xl` for large, `rounded-3xl` for cards and panels.
- **Fonts**: Mona Sans for text, Geist Mono for every number — prices, counts,
  quantities, order numbers — with `tabular-nums`.
- **Motion is professional, not playful**: 180ms for state, 280ms for movement,
  `cubic-bezier(.2,.7,.3,1)`, using `svelte/transition`.

## Content

**Nothing shopper-facing is written in code.** Copy lives in the CMS — settings,
menus, page blocks — and ships with sensible defaults seeded. Interface language
(button labels, validation messages, empty states) may stay in code.

## Money

Integer **poisha** everywhere — never floats, which produce one-poisha order
mismatches. Format through `formatTk()`, which uses `Intl` with the BDT narrow
symbol (৳).

## Conventions

- Commits are per feature, authored as `ebnsina <ebnsina.me@gmail.com>`, with no
  co-author trailer. Keep `CHANGELOG.md` current with user-facing changes.
- Prefer the platform: native `<dialog>`, `Intl`, CSS `aspect-ratio`, a database
  constraint over application code.
- Verify against the running app, not just the type checker. Several bugs in this
  repo's history typechecked cleanly and were still wrong.
