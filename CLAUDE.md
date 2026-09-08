# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Working on this project

## Commands

```sh
pnpm dev                    # vite dev on :5199, --strictPort
pnpm check                  # svelte-kit sync && svelte-check — must be clean before anything ships
pnpm lint                   # prettier --check . && eslint .
pnpm format                 # prettier --write .
pnpm test                   # vitest, single run
pnpm test:unit              # vitest watch
pnpm build && pnpm start    # adapter-node build, then server.js (adds compression)
```

Tests are colocated `*.test.ts` beside the code they cover and run in the `node`
environment. One file: `pnpm test src/lib/server/autoReply.test.ts`. One case:
`pnpm test -- -t "refuses a thread a colleague picked up"`.

Database (drizzle-kit, schema-first — there are no checked-in migrations):

```sh
pnpm db:push                # push src/lib/server/db/schema.ts to the database
pnpm db:seed                # demo catalogue, pages, districts, areas; prints the admin sign-in
pnpm db:studio
```

`pg_trgm` must exist before `db:push` will run. Docker does this for you; by
hand it is `CREATE EXTENSION IF NOT EXISTS pg_trgm;`.

`--strictPort` means a stale dev server on 5199 fails the start rather than
sliding to another port. A dev server that was running while `svelte-kit sync`
regenerated `.svelte-kit` will also 500 on client navigation with "Failed to
fetch dynamically imported module" — that is the running process, not the code.
Restart it.

## Architecture

**Three surfaces, one app.** `/` is the marketing page (`src/routes/(marketing)`),
`/demo` is the storefront (`src/routes/demo/(shop)`), `/admin` is the back
office (`src/routes/admin/(app)`), and `/api` holds webhooks, payment callbacks
and cron endpoints. The shop is mounted one level down, so **every shopper-facing
link goes through `SHOP`/`shop()` in `$lib/paths.ts`** — a root-relative
`/checkout` or `/login` is a 404, and that class of bug has bitten this repo
before.

**The admin guard lives in `src/hooks.server.ts`, not in a layout.** A layout
`load` does not run before a form action, so guarding there left every admin
action reachable by an unauthenticated POST. Anything similar belongs in hooks.

**Everything a shopper reads is data.** A page is an array of blocks:
`$lib/blocks/schema.ts` declares each block type, its fields and its defaults;
`server/blocks.ts` resolves the product sources inside them; `BlockRenderer.svelte`
renders them. Store-wide chrome — logo, delivery zones, payment toggles,
assurances, search hints, theme — is one settings record read through
`server/settings.ts`. Adding a shopper-visible feature usually means adding a
block or a setting, not a route.

**Integrations are adapters that report whether they are configured.** Channels
(`server/channels`), couriers (`server/couriers`), payments (`server/payments`),
search (`server/search`) and file storage (`server/storage.ts`) all follow the
same shape: a common contract, and `configured: false` when the credentials are
absent, so the Connections screen can list what is missing instead of the code
failing at send time. Search is the clearest example — Typesense when reachable,
the database when not, behind one function so no caller knows which. Preserve
this when adding an integration: **degrade, never throw.**

**Stock is committed in `confirmOrder`, not at checkout.** `placeOrder` records
the order; staff confirming it on the phone is what takes stock. This is the
domain's central fact and most of the pipeline follows from it — returns and
refusals are real outcomes, and the courier sync is what marks a cash parcel
paid.

**Analytics writes are fire-and-forget.** `server/intent.ts` records searches
and product events with a floating promise and a swallowed catch, because
analytics must never fail a page load. `unmetDemand()` — searches that returned
nothing — is read by both the admin's Insights screen and the marketing page.

**Two jobs run on a schedule**, both plain HTTP endpoints under `/api/cron`
taking a bearer `CRON_SECRET`, both safe to run twice or miss: courier sync and
abandoned-cart reminders.

## Accessibility is not optional

**Every piece of UI must pass WCAG 2.1 AA / WAI-ARIA before it ships.** This is a
hard gate, not a nice-to-have — most shoppers here are on mid-range Android
phones in bright daylight, and non-technical staff use the admin all day.

Specifically:

- **Contrast.** Text and its background clear **4.5:1**; large text (18.66px bold
  or 24px) and meaningful graphics clear **3:1**. Measure it — do not eyeball it.
  A one-line Node script with the WCAG relative-luminance formula is enough, and
  this repo has caught real failures that way (five of seven order statuses once
  ran as low as 2.15:1). Text over a photograph is measured against the rendered
  pixels — draw the image to a canvas with the same crop, apply any mask alpha,
  composite over the ground, and take the worst pixel.
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
- **Every control has an accessible name.** Icon-only buttons need `aria-label`,
  unless a visible label is already inside them.
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
  a component. A surface that wants its own palette overrides the token values
  in its own scope — see `.marketing` and `.shade` in
  `src/routes/(marketing)/marketing.css` — so `text-primary` keeps working
  unchanged.
- **Themes are ramps, not hues.** A store theme supplies a full nine-stop ramp;
  the 700 stop backs button labels and links, so it must clear 4.5:1 both as text
  on white and under white text. Check a new preset before adding it.
- **Soft, never aggressive.** Surfaces, tracks, tints and dividers stay barely
  there — a tab track sits around **1.1:1** against its ground, a border around
  **1.2:1**. If a neutral element announces itself, it is too strong. Saturation
  and contrast are spent on the things that carry meaning: prices, status
  icons, the primary button. This applies everywhere, not just tabs.
- **Borders, not shadows** — with two deliberate exceptions: the shadcn-style tab
  indicator, and the marketing surface, where a shadow sits under something
  pretending to be a window. A border must be visible against its own background
  (~1.3:1); an invisible border is worse than none.
- **Radius scales with size**: `rounded-lg` for small controls, `rounded-xl` for
  standard, `rounded-2xl` for large, `rounded-3xl` for cards and panels.
- **Fonts**: Mona Sans for text, Geist Mono for every number — prices, counts,
  quantities, order numbers — with `tabular-nums`. The marketing pages set their
  own faces, imported inside `marketing.css` so the admin and the storefront
  never download them.
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
