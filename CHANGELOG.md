# Changelog

User-facing changes, newest first.

## Unreleased

### Added

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
- **Product cards no longer flicker on hover.**
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
