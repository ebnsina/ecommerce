# CommerceBD

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

## Running it with Docker

The whole shop — app, database, search engine — in three containers:

```sh
cp .env.example .env                                       # fill in what you have
docker compose up -d
docker compose run --rm tools pnpm db:push                 # create the tables, once
docker compose run --rm -e SEED_DEMO=1 tools pnpm db:seed  # optional demo catalogue
```

The shop is at `http://localhost:3000/demo`; `/` is the page that explains the
product. Set `APP_PORT` to move it. Postgres and
Typesense are on the internal network only — nothing is published that does not
need to be.

Behind a domain, set `ORIGIN=https://your-shop` in `.env`: SvelteKit refuses a
form post whose origin does not match it. **Serve it over TLS.** Session cookies
are `Secure`, so signing in to the admin over plain HTTP will not work — which
is the point.

## Deploying without Docker

```sh
pnpm build                 # → build/
pnpm start                 # listens on PORT, default 3000
```

`pnpm start` runs `server.js`, which is the adapter's handler with compression
in front of it — the shop's home page is about 640KB of markup and 30KB once
compressed, and adapter-node does not compress rendered HTML by itself.

Anything that can run a Node process will do. Set the environment variables from
`.env.example` and put a reverse proxy in front of it for TLS. One thing Docker
does for you that you must do by hand here: the database needs the `pg_trgm`
extension before `db:push` will run — `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

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
