# Changelog

User-facing changes, newest first.

## Unreleased

### Added

- **A page explaining the product** at `/platform` — what it is, what it does,
  what it connects to, what it costs, and the questions people actually ask.

- **The assistant can answer the easy questions by itself** — off by default,
  and switched on per channel with a confidence bar you set. It only ever
  answers delivery charges, delivery times, payment methods, returns and
  opening hours: things the shop's own settings answer. Anything about a
  particular order, price, refund or complaint is always left for a person,
  however certain it claims to be. It never answers a thread a colleague has
  picked up, never replies twice to the same conversation, and every reply is
  marked as the assistant in the Inbox with the thread left unread.

- **Pathao as a courier**, alongside Steadfast. Pathao delivers by its own city
  and area numbers rather than a written address, so each order's address is
  matched against its lists by name — and an address it cannot place is
  refused with a message saying which part, rather than sent as a guess.

- **Online payment.** Cards, bKash, Nagad, Rocket and internet banking through
  SSLCommerz, switched on in Settings once the keys are in. Cash on delivery is
  untouched and stays the default. If the gateway cannot be reached the order
  is still placed — it simply sits unpaid for someone to call about, rather
  than being lost.

- **A blog.** Write articles in the admin with the same editor the pages use,
  give each a cover, a summary and tags, and keep it as a draft until it is
  ready — a draft is readable by you and nobody else. The shop gets `/blog`
  with tag filtering, and three articles ship seeded: how cash on delivery
  works, choosing a rice cooker, and telling a genuine product from a copy.

- **"Often bought with this" in the cart.** One line per suggestion with a
  single Add button, taken from what buyers of the things already in the cart
  actually bought alongside them — never something already in the cart.

### Changed

- **Coupons and bundles** join the shared list shape — search, filters, a row
  action menu and paging. Bundles now say whether each one is actually live,
  which the screen could not show before.
- **Media** gained search and paging. It was capped at the newest 200 images
  with no way to reach anything older.
- **Categories and the Inbox** keep their own shapes — a tree with an order you
  set, and a thread list beside a conversation — but now carry the same page
  heading as everything else.

### Fixed

- **The admin was open to anyone who could post to it.** Pages redirected to
  sign-in, but form actions did not: an unauthenticated request could save
  settings, change products or delete records. Access is now decided for every
  request, whatever its method.
- **The options row on the product editor lines up.** One field carried a hint
  and the other did not, so aligning the row by its bottom dropped one label
  out of line.
- **The heart on a product card now saves it.** It was a button with nothing
  behind it: the wishlist page and the save action both existed, only the card
  was never wired up. It also shows when something is already saved.
- **Scheduled jobs now actually run.** Courier status sync and cart reminders
  answer the kind of request a scheduler makes — they only accepted the other
  kind, so neither would ever have fired. A reminder is claimed before it is
  sent, so a job that runs twice still texts a shopper once.

### Changed

- **The front page is CommerceBD**, and leads with the product itself: a
  near-white page, one accent, and the shop's real interface shown large under
  the headline — the pattern the platforms in this market converge on. Scoped
  to the marketing pages; the shop and admin keep their own themeable palette.
- **The front page now explains the product; the shop moved to `/demo`.**
- **Images carry their own size and load lazily**, and fetch a phone-sized
  picture on a phone rather than a full-width one. Only the hero loads eagerly.
- **Pages arrive compressed** — the shop's home page went from 580KB to 30KB on
  the wire.
- **Security headers on every response**, and a content policy that stops an
  injected script running at all.
- **Connections is now Integrations**, laid out as a catalogue you can browse:
  filter by category, search it, or show only what is not set up yet.
- **Runs under Docker**, with its own Postgres and its own Typesense — one
  command brings up the whole shop, and nothing is published beyond the shop
  itself.
- **No hosting provider is baked in any more.** `pnpm build` produces a plain
  Node server that runs anywhere Node runs, and the two scheduled jobs are
  ordinary HTTP endpoints any scheduler can call — a crontab line, a CI
  schedule, an uptime pinger.

### Added

- **A proper filter panel on search.** Category, price, rating, brand, in-stock
  and on-offer, in a sidebar on a desktop and a sheet on a phone. Every choice
  is in the web address, so a filtered view is a link you can send or come back
  to, and the filtering happens in the database — the page never holds products
  it did not ask for.

- **Search that forgives spelling.** With Typesense connected, "kettel" finds
  the kettle and "washing mashine" finds the washing machine — the database
  search matched only exactly what was typed, and this shop's own numbers show
  a search that finds nothing is the clearest lost sale there is. It is
  optional: with nothing connected the shop searches the database as before.
  A new Search screen shows what is indexed, rebuilds it after a bulk import,
  and lists what shoppers looked for and what came back empty.

- **Insights.** A new screen showing what shoppers searched for, what they
  looked at, and what they actually bought — including the two things sales
  figures cannot tell you apart: searches that found nothing (demand you have
  no product for) and products people look at but never buy. It also shows how
  orders end, with the cash-on-delivery refusal rate called out, since a
  refused parcel is paid for twice and sold none.
- **"Customers also bought"** on the product page, counted from real orders
  rather than guessed — so it can be explained, and needs no second service.

- **Reviews and Questions are now two screens**, each with its own search,
  filters and bulk actions — publishing five reviews at once no longer means
  five clicks in two directions. Answering a question happens in a dialog and
  publishes both the question and the answer on the product.
- **Every admin list works the same way.** Title and count on the left with the
  page's actions on the right, search and filters above the table, an action
  menu on each row, and a footer with rows-per-page and where you are. The
  search, the filters and the page all live in the URL and are applied by the
  database, so a filtered view is a link you can send someone and a long list
  stays fast.
- **Orders export to CSV**, respecting whatever the list is filtered to.
- **Guided tours.** The page builder, the pages list and the menus screen walk
  you through themselves the first time you open them, and a "Show me how"
  button brings the walkthrough back whenever you want it.

- **Compare works from every product grid.** The compare button now sits on all
  card sizes and lights up when a product is already on the shortlist, so the
  compare page in the header can actually be filled.

### Changed

- **Menus and dropdowns no longer get clipped.** Every dropdown is positioned
  against the viewport, opens upward when it is near the bottom of the screen,
  and stays inside the left and right edges.
- **A denser footer.** Contact details, the shop's categories, the menu columns
  you set, and payment badges that can now carry a real logo — bKash, Nagad and
  the rest — uploaded in Settings. The delivery and returns promises come from
  the same reassurances the product page shows, so they are written once.
- **The newsletter strip is now a "talk to us" band** with call and WhatsApp
  buttons. Most shoppers here message rather than subscribe.
- **Homepage categories fit on one row** with clearer labels.
- **Product cards no longer flicker on hover**, their picture is rounded to
  match the card, and the text below lines up with its edge.
- **Softer neutrals.** Tab tracks and other structural greys were heavier than
  they should be; they now sit just above invisible, with contrast saved for
  the things that carry meaning.
- **Banner grids sit on the page** rather than inside a coloured pad, with each
  row on one aspect ratio so the images line up.

### Added

- **Abandoned cart reminders.** Once a shopper types their phone number at
  checkout, a cart they never finish shows up under Sales → Abandoned carts with
  its value, and can be followed up by one text — by hand, or automatically after
  a delay you choose. The link in the message reopens their cart on any device,
  no login. One reminder per cart; ordering removes it from the list.

- **Ads and analytics tracking.** Settings now takes a Meta Pixel, TikTok Pixel,
  Google Tag Manager and Google Analytics ID; fill in the ones you use and leave
  the rest blank. Each gets product views, add-to-cart, checkout starts and
  purchases, in taka, so every ad platform can be judged on the orders it
  actually produced. Meta purchases are additionally sent from the server
  (Conversions API), which recovers the large share of events ad blockers and
  iOS privacy settings hide — under a shared event ID, so they cannot be
  double-counted.

- **Inbox threads say what they are about.** A message that opens with "koto
  taka?" now carries the product the customer was looking at, shown on the thread
  and in the list. It is picked up from a Messenger referral, from a product link
  in the message, or from the page the website widget was opened on.
- **Connections page.** One screen listing every integration, what each is for,
  whether it is set up, and the exact variable names a developer needs — so a
  "not connected" notice is no longer a dead end.

- **Theme picker.** Seven colour presets and a choice of white or warm page
  background, set in Settings and applied across both the storefront and the
  admin without a rebuild. Every palette is checked for legibility before it
  ships, so no choice can make buttons or links unreadable.

### Fixed

- **The product importer offered to accept images.** Its upload area used the
  media library's wording; it now asks for a CSV and accepts only CSV files.

### Changed

- **Product cards give the photo the room.** Images now run to the card edge,
  padding is tighter, discounts shout, and anything down to its last few units
  says so.

- **Status badges are readable.** Five of the seven order statuses failed
  contrast as coloured text. Badges are now neutral tags — grey border, black
  label — with the meaning carried by a coloured icon.

### Added

- **Import formats are stated on the page.** The product importer already
  accepted Shopify and WooCommerce exports; now it says so and names the format
  it detected.

- **Courier dispatch** — hand an order to Steadfast from the order page. The
  consignment and tracking code are stored, the order moves to shipped, and the
  customer is texted. A scheduled job refreshes courier status and advances the
  order when the courier's wording is unambiguous, marking a delivered
  cash-on-delivery parcel as paid.

- **Product bundles** — sell a set of products together for one price. Bundles
  appear on the product page of everything they contain, showing the saving
  against buying separately, and add to the cart as a group that is removed as a
  group. The bundle price is split across its members so order totals need no
  special case.

- **Storefront** — homepage built from CMS blocks, category pages, product pages
  with variants, search, cart, wishlist, product comparison, and a three-step
  animated checkout.
- **Bangladesh delivery model** — cash on delivery, district → area address
  selector covering all 64 districts, and delivery zones that derive the charge
  from the chosen place.
- **Accounts** — phone-number sign-in with an SMS code, switchable to a password
  from the CMS. Order history, saved addresses and wishlist.
- **Order pipeline** — pending → confirmed → packed → shipped → delivered, with
  returns (RTO) as a first-class outcome. Stock is committed on confirmation,
  not at checkout. A4 invoices and 80mm courier labels.
- **CMS** — block-based page editor with draft and publish, menu builder, rich
  text editing, media library, and every piece of storefront copy editable.
- **Catalog management** — products with up to two option axes, categories,
  coupons, CSV import and export, and migration presets for Shopify and
  WooCommerce exports.
- **Reviews and Q&A** — customer reviews held for moderation, questions
  published once answered.
- **Unified inbox** — Website chat, SMS, Telegram, WhatsApp, Messenger and
  Instagram threads in one place, with an AI assistant that drafts replies for a
  human to send.
- **Search engine support** — sitemap, product feed for Facebook and Google, and
  structured data on product pages.
