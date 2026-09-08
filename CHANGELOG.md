# Changelog

User-facing changes, newest first.

## Unreleased

### Changed

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
