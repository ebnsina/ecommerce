# Store

An ecommerce platform for the Bangladeshi market, built so that the person who
runs the shop — not a developer — can change everything about it.

SvelteKit, Postgres, Tailwind. No hosting provider is baked in: `pnpm build`
produces a plain Node server that runs anywhere Node runs.

## Getting started

```sh
pnpm install
cp .env.example .env       # fill in DATABASE_URL at minimum
pnpm db:push               # create the tables
pnpm db:seed               # demo catalogue, pages, districts and areas
pnpm dev
```

The seed prints the admin sign-in it created.

## Deploying

```sh
pnpm build                 # → build/
node build/index.js        # listens on PORT, default 3000
```

Anything that can run a Node process will do: a VPS, a container, a
platform-as-a-service. Set the environment variables from `.env.example` and
put a reverse proxy in front of it for TLS.

### Scheduled work

Two jobs need calling on a schedule. Both are ordinary HTTP endpoints taking
GET or POST with an `Authorization: Bearer $CRON_SECRET` header, so anything
can drive them — a crontab line, a systemd timer, a CI schedule, an uptime
pinger:

```
0  * * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-shop/api/cron/courier-sync
30 * * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-shop/api/cron/abandoned-carts
```

Both are safe to run twice or to miss entirely: a cart reminder is claimed
before it is sent, and courier sync only reconciles with what the courier
reports.

### What is optional

The shop runs with nothing but a database. Each of these adds something and
degrades cleanly when absent — see the Connections screen in the admin, which
lists what is set up and the exact variables anything missing needs.

|                        | Without it                                                        |
| ---------------------- | ----------------------------------------------------------------- |
| Typesense              | Search matches only what is typed exactly                         |
| S3-compatible storage  | Uploads go to local disk, which a serverless host wipes on deploy |
| SMS gateway            | Codes and notices are logged to the server console                |
| Courier API            | Consignments are entered by hand                                  |
| Meta / TikTok / Google | No ad attribution                                                 |
| An AI key              | The inbox drafts no reply suggestions                             |

## Commands

```sh
pnpm dev            # development server
pnpm build          # production build
pnpm check          # types and Svelte a11y
pnpm test           # unit tests
pnpm db:push        # apply schema changes
pnpm db:studio      # browse the database
pnpm db:seed        # demo data
```

Read `CLAUDE.md` before changing the UI: accessibility and the design tokens
are hard rules here, not preferences.
