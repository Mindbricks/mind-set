---
title: Shopping cart
---

# Shopping cart

A first-class cart pattern. Declare it once at the service level
(`services[*].shoppingCartConfig`) and the compiler generates the
`Cart` + `CartItem` data objects (Redis-first), the CRUD APIs, the
validation/checkout actions, and the cart-to-order conversion plumbing.

Support for the cart varies by compiler and target language; where this page says a behaviour
belongs to the contract it applies to every conforming compiler. See
[the compiler specification](../../compiler/index.md).

## Campaign cache identity

The platform campaign catalog is isolated by resolved project, service,
campaign data object and cart. A conforming service uses one Redis key for load, write and
invalidation: the authored nonempty prefix (otherwise `promo:`), followed by
`campaigns:` and those four components encoded individually with
`encodeURIComponent` and joined by colons. For project `p`, service `s`,
store `cartCampaign` and cart `cart`, prefix `shared:` produces
`shared:campaigns:p:s:cartCampaign:cart`.

Tenant and user are intentionally absent: campaigns remain platform-level
within the service. `cacheInRedis` and the configured TTL are unchanged
(defaults: true and 3000 seconds). Old unqualified cache entries expire by TTL.

## Enabling it

```json
{
  "serviceSettings": { "serviceBasics": { "name": "commerce" } },
  "shoppingCartConfig": {
    "basicSettings": {
      "useShoppingCartFeature": true,
      "supportGuestCart":       true,
      "currency":               "USD"
    }
  }
}
```

`useShoppingCartFeature: true` is the on switch. The other config
sections below are optional — defaults are sensible.

## Config sections

[`ShoppingCartConfig`](../../spec/ShoppingCartConfig.md) is a chapter with multiple typed sub-sections:

| Section | Purpose |
|---------|---------|
| `basicSettings` | Activation, naming, currency, guest cart support. |
| `pricingSettings` | VAT, rounding, discounts, shipment, extra charges. |
| `itemSettings` | Which item-level properties to generate. |
| `productCatalogSettings` | Optional binding to a product catalogue data object — the server then prices every line (see below). |
| `logisticsSettings` | Weight, dimensions, volume tracking. |
| `loyaltySettings` | Points earning + redemption. |
| `promotionSettings` | Static and dynamic promotions. |
| `redisSettings` | Redis caching config (cart is Redis-first by default). |
| `apiSettings` | Which generated API routes to enable. |
| `checkoutSettings` | Cart-to-order conversion behaviour. |

## Redis lifetime

`redisSettings.cartTtlSeconds` defaults to 86400 seconds.
Every successful cart-header write refreshes the header, the items index and
all indexed line keys in the same Redis compare-and-set operation. This also
covers points redemption, checkout claims, freeze, claim release and checkout
reconciliation. A failed compare-and-set changes neither data nor expiry.
An idle cart's header, index and lines expire together; a header-only write
keeps its existing lines readable for the refreshed lifetime. Refreshing expiry
does not recreate line keys that already expired before the write.

Unexpected failures of the cart router answer a 500 `INTERNAL_ERROR` problem
envelope with the request id and the safe message "Internal server error". The
service logs the raw exception once with that same request id; typed cart
errors retain their existing responses.

## Product catalogue binding: the server prices the line

A cart bound to a product catalogue can omit `unitPrice`. A compiler that supports the binding
resolves catalogue price, VAT and display fields; the promotion-qualifier authority described
below is a further capability a compiler may not yet have.

`productCatalogSettings.useProductCatalog: true` binds the cart to a product
data object (`productDataObject`, looked up by `lookupField`: `id` or
`barcode`, with `productMappings` renaming non-standard columns). On a bound
cart the **server is authoritative for the money fields**:

- `addItem` / `updateItem` resolve the line against the catalogue row first.
  `unitPrice` and `vatRate` always come from the catalogue — a client-sent
  price is ignored, never trusted. The client no longer has to send
  `unitPrice` at all.
- Adding an existing product again refreshes its catalogue money fields as
  well as merging the quantity. Recalculate and checkout also resolve every
  catalogue-bound line again, store the current catalogue price, and return
  the changed lines as `priceChanged`. A price retained from an earlier add
  therefore does not fix the eventual checkout price. Clients should display
  these changes when presenting recalculated totals or a checkout result.
- Every field a promotion rule can match a line on is catalogue-authoritative
  the same way: `productId` (the `productList` / `buyXGetY` rules), `category`
  (`productCategory`), `brand` (`brand`), and `productGroup` / `vendor` (read by
  project rules registered with `registerRule()`). They are read from the
  columns `productMappings` names (`categoryField`, `brandField`,
  `productGroupField`, `vendorField`, defaults `category`, `brand`,
  `productGroup`, `vendor`; `productId` is the row's `id`). A client-sent value
  is **ignored**, and a column the row leaves empty leaves the line field
  empty, so a client cannot move a line into a discounted category or brand.
  `updateItem` and the add-time quantity merge re-apply them to the stored
  line. Only the display fields (`productName`, `description`) still fill from
  the catalogue when the client left them blank.
- A client-sent line `discountAmount` is **ignored** on `addItem` and
  `updateItem`: on a bound cart a line's discount comes only from the
  promotions and coupons.
- A product the catalogue does not hold is refused with a typed
  **`404 CART_PRODUCT_NOT_FOUND`** (problem+json, naming the barcode and the
  catalogue object). A bound cart never silently accepts client pricing for
  an unknown product.
- An UNBOUND cart keeps client-supplied pricing, and the strict ingress price
  guard enforces it.
- On every cart a line's own `discountAmount` may equal the line total (the
  line prices to 0) but never exceed it: `addItem`, and `updateItem` after the
  merge (a smaller `quantity` counts), refuse it with
  `400 CART_ITEM_DISCOUNT_EXCEEDS_LINE`. Pricing also caps every discount,
  promotion and coupon shares included, at the line, so no line goes negative.
- The binding survives every `orderCreationMode`, including `none`: a cart
  that creates no order still prices from the catalogue.

### Inclusive-VAT catalogues price gross-first

With `pricingSettings.catalogPricesIncludeVat: true` the customer-facing
truth is `unitPrice × quantity` — a 250-inclusive ticket twice is exactly
`500.00`. Any line discount comes off that gross, and the ex-VAT/VAT split is
**derived** from the discounted gross (the same rounding-exact extraction the
invoice layer uses). An ex-VAT-first path would leak a cent on every
multi-quantity line (`208.33 × 2 = 416.66 → 499.99`).

The ex-VAT amount is `gross / (1 + vatRate)` rounded half-up to the cart's
`roundingPrecision`, and the half-up is decided on the exact decimal quotient,
not on its binary floating-point approximation. An exact tie therefore
rounds up, as half-up says: `7 × 0.10 − 0.01 = 0.69` at 20% is `0.575`, so the
line is net `0.58` + VAT `0.11`, and `13 × 99.99 = 1299.87` at 20% is net
`1083.23` + VAT `216.64`. The VAT is still the remainder, so net + VAT is
always exactly the gross. The exclusive-VAT path is unchanged.

### The vatRate unit contract (percent at every boundary)

`vatRate` speaks **percent at every public boundary** — the blueprint's
`pricingSettings.defaultVatRate`, a client-sent `vatRate` on add/update-item,
and a bound catalogue's vat column — and the engine computes with a
**fraction** internally, converted exactly once at cart-manager ingress. The
heuristic:

- a value `>= 1` is a percent and is divided by 100 (`20 → 0.20`,
  `100 → 1.0`, `1 → 0.01`);
- a value `< 1` is already a fraction and passes through unchanged
  (`0.18` stays 18%), which keeps every fraction-speaking config computing
  byte-identical totals;
- **a bare `1` means one percent, never 100%** — author 1% VAT as `1`
  (or `0.01`); 100% VAT is only expressible as `100`;
- a sub-1% rate has no percent spelling — author it as a fraction
  (`0.005` = 0.5%).

## Carts and capacity: opt-in stock reservation

By default the catalogue binding is **pricing-only**: the cart does not
read, reserve or verify availability, so a buyer can cart more units than
remain. `reservationSettings` turns on a TTL stock reservation (a compiler may
not implement it for every target language):

```json
"reservationSettings": {
  "enabled":                  true,
  "ttlSeconds":               900,
  "guestTtlSeconds":          300,
  "guestQuota":               { "maxLines": 20, "maxUnits": 100 },
  "reconcileIntervalSeconds": 300
}
```

(the values shown are the defaults). It works on a catalogue-bound cart
whose `productMappings` names a stock column: `stockField` (units still
available), or `capacityField` with an optional `soldCountField`
(availability = capacity − sold). Without such a mapping, or for a product
row with no value in it, nothing is reserved. See
[`ShoppingCartReservationSettings`](../../spec/ShoppingCartReservationSettings.md).

- **Holds.** Adding a line, or raising its quantity, reserves the units
  against a per-product counter in Redis, seeded from the catalogue row and
  re-seeded from it once `reconcileIntervalSeconds` have passed. A hold
  expires on its own after `ttlSeconds` (`guestTtlSeconds` for a guest cart,
  which is also capped at `guestQuota.maxLines` lines and
  `guestQuota.maxUnits` units). Removing a line or clearing the cart
  releases its holds. The DB cart mirror is never read for availability.
- **Refusals.** A request for more units than remain answers
  `409 CART_CAPACITY_EXCEEDED`, naming every short line
  (`{ barcode, requested, available }`) so the client can show "only N
  left"; a guest over its quota answers `409 CART_GUEST_HOLD_QUOTA_EXCEEDED`;
  a counter under heavy concurrent update answers the retryable
  `409 CART_CAPACITY_CONFLICT`.
- **Checkout.** Inside the checkout claim the holds are consumed (a line
  whose hold expired and whose units were sold meanwhile is refused with the
  same `409 CART_CAPACITY_EXCEEDED`); a checkout whose order create fails
  gives the units back as holds.

The counter is the runtime's view; the catalogue row stays the durable
truth. The cart does not write the row's stock or sold count: the order
flow does (for example a conditional update such as `soldCount + qty <=
capacity`, written as an `$incIf` numeric mutation with a `$col` guard -
see [Numeric mutation](../mscript/numeric-mutation.md)), and the next
reconcile re-anchors the counter to it. Without `reservationSettings`, a
scarce-stock deployment enforces capacity in that same blueprint flow or in
a refusing checkout hook. A WaitingRoom throttles *entry* and reserves
nothing. For a blueprint-side reservation, a [Ledger](ledger.md) with
`fefo` consumption and reservations is the building block.

## Redis is the cart; the DB rows are a mirror

The live cart is Redis-first; the `cart` / `cartItem` DB rows are a
best-effort **mirror** written after each mutation (a DB blip is logged and
swallowed — Redis is the primary, so the mirror may lag). The mirror has
full delete parity: removing a line purges its mirrored row in
the same request, and clearing the cart purges the cart's **whole** mirrored
line set — including any ghost row an earlier delete-blind build left
behind, so the mirror self-heals on the next clear. Reporting and bridge
flows may read the mirror; live cart state always comes from the cart
routes.

The live cart id and the mirror row id are the same value. A new
cart id is a random id in the shape the service database uses for a row id:
a UUID on SQL services, 24 hex characters on MongoDB. The mirror row is
created with that id, so a get-by-id Business API on the cart object (an
`inspectCart` at `GET /carts/:cartId/inspect`) reads the cart the cart routes
return. The cart that replaces a checked-out one gets an id derived from the
old one with a per-service secret key the backend keeps in Redis. Concurrent
requests still agree on that id, but a consumer of the checkout event cannot
compute the next cart's id. Carts created by an older build keep their
`cart_<ms>_<random>` id until checkout; their rows are still found by
`cartKey`.

Every mirror write carries the request's identity. The cart create, update
and status writes and the line create and delete writes all hand the db layer
the request session, the request id and the request's resolved tenant, so
their db-change events and search-index writes name the shopper and the
tenant. In a multi-tenant project the cart's tenant is always a tenant id:
the session's own tenant, or for a guest the tenant the backend resolved from
the tenant header. The raw codename in that header is never used, not even
when the tenant is named `client`. If you write a cart or cart item data
object yourself and make it tenant-level (`objectDataIsInTenantLevel: true`),
each new mirror row is stamped with that tenant id when it is created.
Updates never write the tenant column, so a row keeps the tenant it was
created with. Rows written by an older build without a tenant are not
repaired automatically.

### The cart is tenant-level in a multi-tenant project

In a multi-tenant project the whole shopping flow belongs to a tenant. The
cart and cart item objects the cart chapter generates are therefore
tenant-level: they carry the `<tenantName>Id` column (for example
`organizationId`), exactly like a data object you mark
`objectDataIsInTenantLevel: true`. This is decided when the code is
generated, from the project's tenancy. A single-tenant project is unchanged.
The campaign store (`cartCampaign`) stays platform-level in every project.

What that means for your service:

- Every cart row and every line row is created with the tenant of the
  request that created it (the rule above). A later update never changes it.
- In `local` checkout mode, when the order data object is tenant-level too,
  the order row is written into that same tenant. The request's tenant wins
  over a value a property mapping, the order data clause or the checkout body
  puts in the tenant column, so an order never lands in another tenant. In
  `remote` mode the checkout event carries the tenant on its actor, and the
  consuming order service creates the order in that tenant.
- A get / list Business API you write on `cart` or `cartItem` runs the tenant
  filter. So `tenantOwner` / `tenantAdmin` are accepted as operators on it
  and read only their own tenant's carts (see "A tenant administrator rides
  the tenant filter" below). An API that declares `apiInSaasLevel: true`
  drops the filter, and there they are still refused.
- Existing rows get the new column from the boot-time schema sync with no
  value. There is no automatic backfill: such a row has no
  tenant and a tenant-filtered read does not return it.

A compiler whose target language has not implemented tenant-level carts leaves the two objects
platform-level, and validation applies the same rule, so it never accepts a tenant administrator
on a cart read that runs no tenant filter.

The mirror is wired only when the cart data object has a `cartKey` column.
The auto-generated cart object always has one. A cart data object you write
yourself under the same name replaces the generated one. Without `cartKey`,
the mirror hooks would do nothing and no cart row would ever be written, so
validation refuses this case with the ERROR `SHOPPING_CART_MIRROR_WITHOUT_CARTKEY`
on validateProject, validateService and every build, saved projects
included. A save of the cart data object alone (the object, the `dataObjects`
collection or anything below the object) reports it on the save result too,
under `siblingErrors` next to `success: true`: it is never refused at save
(validate and build refuse it), so it shows up before the next validate. To fix it, add a `cartKey` property to your cart data object, the
same column the generated object declares:

```json
{
  "basicSettings": { "name": "cartKey", "type": "String", "isRequired": true, "isFilterParameter": true },
  "indexSettings": { "unique": true, "indexedInDb": true }
}
```

Keep `ownerId` (type `ID`, `sessionSettings.isOwnerField: true`) next to it,
plus `sessionId` when guest carts are on. Or remove your cart data object and
let ShoppingCartConfig generate it.

The same contract check covers every generated cart object you replace. A
hand-authored cart object that has `cartKey` but no `ownerId` (or no
`sessionId` while guest carts are on) gets the WARNING
`SYSTEM_OBJECT_CONTRACT_MISSING_COLUMN`: the mirror rows would carry no owner.
A hand-authored line object (`{cartObjectName}{itemObjectSuffix}`, by default
`cartItem`) must declare the parent foreign key `{cartObjectName}Id` and
`barcode`, the two columns the item mirror is wired on; without them no line
row is ever written, and validation reports the ERROR
`SYSTEM_OBJECT_CONTRACT_MISSING_COLUMN`. A column declared with another type
than the generated one is `SYSTEM_OBJECT_CONTRACT_COLUMN_TYPE`: an ERROR where
the generated code is shown to misread it (campaign `rules` or `rewards`
declared as a String: the loader drops them), otherwise a WARNING that says
what the generated code expects (for example a String `isEnabled` on the
campaign store). `rules` / `rewards` declared as one `Object` without `isArray`
are a WARNING: the loader reads a stored array, but such a column also takes a
single object, which loads as no rules / no rewards; declare them
`isArray: true` as generated.
Each finding prints the generated property definition to add.

## Checkout settings

```json
"checkoutSettings": {
  "orderCreationMode":  "local",
  "orderDataObjectName": "Order",
  "autoMapProperties":   true,
  "publishCheckoutEvent": true,
  "checkoutEventTopic":  "cart-checkout-completed",
  "initialOrderStatus":  "pending"
}
```

`orderCreationMode`:

- `local` — Create the Order row in the same service. Requires
  `orderDataObjectName` pointing at a data object (auto-detected if any
  data object has the `isOrder` flag). The order row's money is the
  **server's** checkout snapshot: on a catalogue-bound cart every line was
  server-priced, and money keys smuggled into the request's
  `checkoutData` cannot move it. A successful checkout settles the
  cart as `convertedToOrder` — terminal, every further mutation refused
  with `409 CART_ALREADY_CHECKED_OUT` (adding an item rotates onto a fresh
  basket instead). A **failed** order create answers a typed
  `502 ORDER_CREATION_FAILED` (problem+json), publishes no checkout event,
  and leaves the cart mutable and retryable.
- `remote` — Publish a Kafka event for an external order service to
  pick up. `publishCheckoutEvent` is forced to true. Checkout answers
  `orderId: null`, and no order exists until an order service consumes
  the topic and creates it. When no Business API of the project creates
  an order from that topic and the cart does not declare its order
  service external, every remote checkout is lost, so validation refuses
  it with the ERROR `CART_CHECKOUT_TOPIC_NO_CONSUMER` on
  validateProject, validateService and every build, saved projects
  included; a save of the service or of its `shoppingCartConfig` reports
  it on the save result (`siblingErrors`) without refusing the save. Only an
  order-creating consumer counts: a create Business API on the order
  object with `controllers.kafkaSettings: { "hasKafkaController": true,
  "requestTopicName": "<the checkout topic>" }` (exact topic). An event
  subscription, an event notification (a receipt mail) or any other
  subscriber of the topic creates no order and does not satisfy it. When
  the order service lives outside this project, declare it with
  `checkoutSettings.externalCheckoutConsumer: true` (ignored in `local` /
  `none`). Or switch to `local` or `none`.
- `none` — Don't create an order. Useful when checkout is just
  "freeze the cart" and your app does the rest.

Property mapping is auto-detected via `autoMapProperties: true`; for
overrides, populate `propertyMappings[]` or inject custom MScript via
`orderDataClause`. These four order-building settings (`autoMapProperties`,
`propertyMappings`, `orderDataClause`, `initialOrderStatus`) apply **only in
`local` mode**: a `remote` cart builds no order, so they are not
applied to the checkout event, and validation warns
(`SHOPPING_CART_REMOTE_MODE_LOCAL_ONLY_SETTING`) when one is set to a
non-default value on a remote cart. The consuming order service maps the
order from the event instead. See
[`ShoppingCartCheckoutSettings`](../../spec/ShoppingCartCheckoutSettings.md).

### The checkout event and the checkout body

- **Topic.** The default topic is `<serviceCodename>-cart-checkout-completed`.
  An explicit `checkoutEventTopic` is **project-scoped on the wire** like a
  PublishEventAction topic: it is published as
  `<projectCodename>-<topic>` (a name that already starts with
  `<projectCodename>-` is unchanged), so separate deployments of
  one project never share it. A consumer in the project may name it with or
  without the prefix.
- **Payload.** The event rides the standard event envelope (`type`
  `<cartObjectName>.checkoutCompleted`) and carries exactly
  `{ cartId, checkoutId, cart, items, rewards, orderId, orderCreationMode, checkoutData }`
  under `data`.
- **Body.** The `POST /<cart>/checkout` request body **is** the checkout
  data: send `{ "shippingMethod": "express" }`, read it in a
  `propertyMappings` entry as `checkoutData.shippingMethod`, and a consumer
  sees `data.checkoutData.shippingMethod`. A body whose only key is
  `checkoutData` (`{ "checkoutData": { ... } }`) is unwrapped once, so the
  event never carries `checkoutData.checkoutData`.

## Checkout is single-flight: the claim, the 409 and the outcome query

Two checkouts racing on one basket (a double click, a retried request, a
REST call and a `CartCheckoutAction` on the same cart) must not run the order
handoff twice. The checkout header write therefore also takes a **claim**
(`checkoutClaim` on the cart snapshot, written by the same compare-and-set
that writes the priced totals), BEFORE the handoff runs:

- Exactly one checkout per basket gets the claim and runs the handoff. Its
  response carries the claim's `checkoutId` (server-generated; never taken
  from the request).
- The other one is refused with **`409 CHECKOUT_IN_PROGRESS`**, a
  problem+json body whose `checkoutId` is the in-flight identity. Every
  other mutation of a claimed basket (add / update / remove / clear items,
  coupons, recalculate, redeem points, delete) answers the same 409 while
  the claim's **lease** is live. That includes a line mutation that read
  the basket just BEFORE the claim landed: its line write rides the same
  compare-and-set as the header (which also compares the index and every
  line it read), so the refused request leaves no line behind and the
  claimed basket stays exactly what the order consumed.
- The same shopper reads what happened with
  `GET /{cartObjectName}?checkoutId=<id>` (or `?checkoutId=latest` for the
  most recent checkout of this shopper): `status` is `succeeded`, `partial`
  (the order exists but the checkout event did not reach the broker),
  `failed` (a wired local order create failed: the claim was released and
  the cart is retryable) or `inProgress` (with the lease state), plus
  `orderId`, `outcome` and `orderCreationMode`. Both entry points (the REST
  router and `CartCheckoutAction`) write the same record, so an action-path
  checkout is queryable through the cart router too, including after
  `clearCartAfterCheckout: true` deleted the cart itself.
- **A client POLLS this query; it does not re-`checkout` to find out.**
  `succeeded`, `partial` and `failed` are final answers. `inProgress` is the
  only one that waits, and a fresh `POST /checkout` is a recovery step in
  exactly two states: `failed` with `retryable: true` (no order exists), and
  `inProgress` with `leaseExpired: true` (the runner that held the claim is
  gone, and the backend reconciles before any side effect). Calling
  `checkout` on a settled cart answers `409 CART_ALREADY_CHECKED_OUT`, so
  "wait and retry the checkout" is never the recipe for a checkout that is
  already over.
- A settled checkout whose outcome record is no longer readable - its write
  is best effort (a Redis blip is logged as
  `CartCheckoutOutcomeRecordFailed` and swallowed, because the order row is
  the truth), and it is written with the cart TTL before the freeze
  refreshes the header's - answers a terminal shape derived from the frozen
  header instead, marked `recordUnavailable: true`. It is never reported as
  `inProgress` (the claim member survives the freeze, so "the cart still
  carries a claim" does not mean "the checkout is still running") and never
  as `404` (the identity is known and owned). On that shape `outcome`,
  `orderCreationMode` and `checkoutEventPublished` are unknown rather than
  false, and `orderId` is answered only where the order object declares the
  `checkoutId` column described below.
- The record is scoped by the caller's OWNER SLOT, the same slot the active
  cart pointer uses: `user:<id>` for an authenticated shopper, so their own
  second device or fresh login reads their own outcome, and `session:<sid>`
  for a guest, where the session IS the owner and no other session may read
  it. Another shopper's identity answers `404 CHECKOUT_NOT_FOUND` - never
  403, never their record.
- The claim's lease is derived from `redisSettings.cartTtlSeconds`, not
  configured: `min(cartTtlSeconds, 60)` seconds (60 s at the default
  `cartTtlSeconds` of 86400). Expiry alone never permits a second order: a
  checkout that finds an expired claim first **reconciles** it - the recorded
  outcome, then an order row carrying the `checkoutId` - and only runs the
  handoff again (under the SAME `checkoutId`) when nothing exists. A found
  order completes the terminal stamp without a second insert
  (`reconciled: true` on the response).
- To make a crashed checkout reconcilable, declare a `checkoutId` String
  column (unique index recommended) on the order data object: the generated
  cart manager then stamps the identity onto every order row and looks it up
  during reconciliation. Without the column an expired claim cannot be
  told apart from an order that exists, so it is refused
  (`CHECKOUT_IN_PROGRESS`, `reason: unreconciled`) until the cart's own TTL
  lapses; the shopper's explicit cart delete is allowed past an expired
  claim. That delete writes `abandoned` to the cart's DB mirror row even
  when the crashed checkout HAD created an order - the delete is the
  shopper's exit from an unreconcilable basket, not a verdict on the order -
  so read the order row and the outcome record, both of which survive it,
  rather than the cart row's label. The checkout event carries `checkoutId`
  as well, so a `remote` consumer can key on it.
- An `onCheckout` hook receives `checkoutId` in its context; a hook that
  creates the order itself should carry it for the same reason.

## Cart-side REST routes

When the feature is on, the compiler emits a system router mounted at
`/{cartObjectName}`. The service publishes the public cart routes in its
machine-readable API description and OpenAPI document. Each descriptor
follows the emitted router, including request requirements and responses.
Both declare `409 CHECKOUT_IN_PROGRESS` on checkout and every cart mutator, and
`502 ORDER_CREATION_FAILED` on checkout. The `getCart` reader declares
neither refusal. These responses use `application/problem+json` and include
`X-Request-Id`; the 409 carries the in-flight `checkoutId`.
The route set is controlled by `apiSettings.enabledRoutes` (all default to
`true`; see [`ShoppingCartApiSettings`](../../spec/ShoppingCartApiSettings.md)):

- `getCart` — `GET /` — current cart with items; `GET /?checkoutId=<id|latest>`
  answers one of the caller's checkout outcomes instead (see above). The
  published OpenAPI document lists `checkoutId` as an optional
  query parameter.
- `addItem` — `POST /items`.
- `updateItem` — `PUT /items/:barcode`.
- `removeItem` — `DELETE /items/:barcode`.
- `clearCart` — `DELETE /items` — clear all items.
- `recalculate` — `POST /recalculate` — price the cart again.
- `redeemPoints` — `POST /redeemPoints` — only when
  `loyaltySettings.supportLoyalty` and `loyaltySettings.supportPointsRedemption`
  are both on.
- `checkout` — `POST /checkout`.
- `applyCoupon` / `removeCoupon` — `POST /coupons` / `DELETE
  /coupons/:code` — only when `promotionSettings.supportPromotions`,
  `promotionSettings.dynamicPromotions.enabled` and
  `promotionSettings.dynamicPromotions.supportCoupons` are all on.

Every answer is `{ "success": true, "data": ... }`; a refusal is
`application/problem+json` with the machine code in `errorCode`. Bodies and
answers:

| Route | Body | `data` of the answer |
|---|---|---|
| `GET /` | — | `{ cart, items }`, or `null` when the shopper has no active cart; with `?checkoutId=` the outcome, `{ checkout }` |
| `POST /items` | `{ barcode, quantity?, unitPrice, productName?, vatRate?, discountAmount?, ... }`: `barcode` required, `quantity` default 1, `unitPrice` required unless the cart is catalogue-bound; other item fields are stored on the line | `{ cart, items }` (status 201) |
| `PUT /items/:barcode` | `{ quantity, ... }`: `quantity` required, the other line fields optional | `{ cart, items }` |
| `DELETE /items/:barcode`, `DELETE /items` | — | `{ cart, items }` |
| `POST /recalculate` | — | `{ cart, items, rewards }` |
| `POST /redeemPoints` | `{ points }`, a positive number | `{ cart, items }` |
| `POST /coupons` | `{ couponCode }` | `{ cart, items, rewards }` |
| `DELETE /coupons/:code` | — | `{ cart, items }` |
| `POST /checkout` | the checkout data (see [above](#the-checkout-event-and-the-checkout-body)) | `{ cart, items, rewards, orderCreationMode, orderId, order, checkoutEventPublished, checkoutId, reconciled? }` |

`cart` is the header (`id`, `status`, `currency`, `subtotal`,
`discountTotal`, `vatTotal`, `grossTotal`, `total`, `couponCodes`, and the
loyalty fields when loyalty is on); `items` are the priced lines. A missing
or malformed field answers `400`: `VALIDATION_ERROR` for a missing
`barcode`, `quantity` or `couponCode`, `CART_ITEM_PRICE_REQUIRED` /
`CART_ITEM_PRICE_NOT_NUMERIC` / `CART_ITEM_PRICE_NOT_FINITE` /
`CART_ITEM_PRICE_NEGATIVE` / `CART_ITEM_QUANTITY_NOT_POSITIVE` for a bad
price field, `CART_POINTS_NOT_NUMERIC` / `CART_POINTS_NOT_POSITIVE` for bad
`points`. Without `basicSettings.supportGuestCart` every route answers `401`
to a caller with no user session.

These routes delegate directly to the service's cart manager. Cart-aware actions
([`CartValidationAction`](../../spec/CartValidationAction.md),
[`CartCheckoutAction`](../../spec/CartCheckoutAction.md),
[`CouponValidationAction`](../../spec/CouponValidationAction.md)) are also available
inside any custom Business API workflow.

## Guest carts: login is rotation, not adoption

With `basicSettings.supportGuestCart: true` an anonymous shopper **is** its
session id (the `X-Session-Id` header, or the auth middleware's session).
The active-cart pointer is owner-sliced — `user:{userId}` when a user
exists, else `session:{sessionId}` — and `user:` wins the moment the
session carries a userId. So the guest→login transition is **rotation, not
adoption**: logging in moves the shopper to a
*different* owner slot, the freshly logged-in shopper starts from "no
cart", and the guest basket is neither merged nor adopted — it stays
intact under its `session:{sid}` slot until the cart TTL expires, and
dropping back to the same session id finds it again. If cart adoption on
login is ever wanted, it is a new feature against this contract, not a bug fix.

## Actions

### `CartValidationAction`

Declared in the API's `actions.cartValidationActions`:

```json
{
  "name":        "validate",
  "validations": ["itemsExist", "stockAvailable", "pricesValid", "minimumOrderMet", "shippingAddressValid"],
  "failFast":    false
}
```

`validations` picks which checks run. `failFast: false` collects every
failure before returning — better UX for forms; `true` is right when
the cart is server-side only.

### `CartCheckoutAction`

Declared in the API's `actions.cartCheckoutActions`:

```json
{
  "name":                  "checkout",
  "stage":                 "process",
  "clearCartAfterCheckout": true,
  "recordPromotionUsage":   true
}
```

`stage`:

- `validate` — validation only.
- `process` — full checkout (validation + consuming the stock holds when
  [reservation](#carts-and-capacity-opt-in-stock-reservation) is on +
  promotion-usage recording + order creation per `checkoutSettings`).
  `recordPromotionUsage: true` increments each used campaign's `usageCount`
  inside the checkout claim (see "Usage limits" below).
- `finalize` — final order creation only (when an upstream step has
  already validated and reserved).

## Wiring to payment

The cart doesn't *itself* call a payment provider. The flow is:

1. `CartCheckoutAction.stage="process"` creates the `Order` row with
   `initialOrderStatus` (e.g. `pending`).
2. A subsequent business API on the `Order` runs `PaymentAction.stage="start"`
   — that's where the provider call happens.
3. The provider's webhook drives the `Order.paymentStatus` to `paid`
   via the `CheckoutConfig.mapPaymentResultToOrderStatus`.

See the [Payment workflow](payment-workflow.md).

## Coupons and promotions

`promotionSettings.supportPromotions` turns promotions on. The promotions
that price a cart are the **dynamic** ones: the campaigns of the
`{cartObjectName}Campaign` store (`dynamicPromotions.enabled`, below).
`promotionSettings.staticPromotions` (`freeShippingThreshold`,
[`cartTotalDiscount`](../../spec/CartTotalDiscountPromotion.md),
[`cartQuantityDiscount`](../../spec/CartQuantityDiscountPromotion.md),
[`membershipDiscounts`](../../spec/MembershipDiscountPromotion.md),
`loyaltyPointsMultiplier`) is accepted by the schema, but no generated
service reads it, in any language: a static promotion changes no price.
Author the same tiers as campaigns instead (a `tieredDiscount` reward, a
`minQuantity` rule with a `percentDiscount` reward).

Coupons are campaigns that require a code; validate one with
[`CouponValidationAction`](../../spec/CouponValidationAction.md), declared
in the API's `actions.couponValidationActions`:

```json
{
  "actions": {
    "couponValidationActions": [
      {
        "name":                "validateCoupon",
        "checkUsageLimits":    true,
        "calculateDiscount":   true,
        "contextPropertyName": "couponCheck"
      }
    ]
  }
}
```

The action reads the code from the API's `couponCode` parameter and judges
it against the caller's active cart; it answers
`{ valid, couponCode, discountAmount?, rewards?, reason? }`. Validation
reports whether the code applies and what it would take off; it does not
change the cart. Applying the code (`POST /coupons`) puts it on the cart,
and every pricing recomputation from then on reflects the discount. An empty
or missing `couponCode` is `400 "couponCode is required"`, and a caller with
no active cart is `404`; an unknown or ineligible code is `valid: false`
with a `reason`.

### Where campaigns and coupons live

Dynamic promotions have exactly ONE data object: the generated campaign store
`{cartObjectName}Campaign`. There is no Coupon object and no usage-log object:
a coupon is the `couponCode` of a campaign row whose `requiresCoupon` is true.
The generated loader reads the enabled rows (`{ isEnabled: true }`) and maps
`name`, `priority`, `exclusive`, `stackable`, `requiresCoupon`, `couponCode`,
`rules` and `rewards` onto the engine.

You may author `{cartObjectName}Campaign` yourself (it replaces the generated
one), but it must declare `isEnabled`, `rules` and `rewards` - validation
reports `SHOPPING_CART_CAMPAIGN_STORE_SHAPE` (ERROR) otherwise, because such a
store loads an empty catalog - and should declare `couponCode` and
`requiresCoupon` (`SHOPPING_CART_CAMPAIGN_STORE_COUPON_COLUMNS`, WARNING).

Do not author a `{cartObjectName}Coupon`, `{cartObjectName}CampaignUsageLog`
or `{cartObjectName}CampaignUsage` object for the promotion engine: nothing
generated reads it. While dynamic promotions are on, validation reports each
one as the WARNING `SYSTEM_OBJECT_UNREAD_EXTRA_OBJECT`. Delete it and keep its
data on the campaign row, or rename it if it is your own data with its own
APIs.

### Authoring a campaign

A campaign row is `{ name, description?, isEnabled, priority, exclusive,
stackable, requiresCoupon, couponCode?, rules, rewards, usageCount }`
(defaults: `isEnabled` true, `priority` 0, `exclusive` false, `stackable`
true, `requiresCoupon` false, `usageCount` 0). The engine evaluates enabled
campaigns by descending `priority`; a campaign applies when **every** rule
passes, and then contributes every reward. An `exclusive` campaign that
applies stops the evaluation; once one `stackable: false` campaign applied,
the other non-stackable ones are skipped. A campaign with
`requiresCoupon: true` applies only through its `couponCode`.

`rules` is `[{ ruleType, config }]`:

| `ruleType` | `config` | Passes when |
|---|---|---|
| `minCartTotal` | `{ minTotal }` | the cart `subtotal` is at least `minTotal` |
| `minQuantity` | `{ minQuantity }` | the cart holds at least that many units |
| `productCategory` | `{ categories: [...] }` | a line's `category` is listed (those lines qualify) |
| `brand` | `{ brands: [...] }` | a line's `brand` is listed (those lines qualify) |
| `productList` | `{ productIds: [...] }` | a line's `productId` is listed (those lines qualify) |
| `buyXGetY` | `{ buyQuantity, targetProductIds? }` | the matching lines hold at least `buyQuantity` units |
| `dateRange` | `{ startDate?, endDate? }` | now is inside the window |
| `timeOfDay` | `{ fromHour?, toHour? }` | the server's hour is in `[fromHour, toHour)` (default 0 to 24) |
| `usageLimit` | `{ maxUses }` | the campaign's `usageCount` is below `maxUses` (see Usage limits) |
| `customerTag`, `firstPurchase`, `membershipLevel` | — | no built-in evaluator: the rule fails with `RULE_NOT_IMPLEMENTED` until project code registers one with `registerRule()` |

`rewards` is `[{ rewardType, config }]`; a reward applies to the lines the
rules marked as qualifying (all lines when none were marked;
`tieredDiscount` always prices the whole cart):

| `rewardType` | `config` | Effect |
|---|---|---|
| `percentDiscount` | `{ percent }` | that percentage off the qualifying lines |
| `fixedDiscount` | `{ amount, allocation? }` | `amount` off, split `proportional` (default), `equal` or onto the `firstItem` |
| `buyXGetY` | `{ getQuantity }` | the `getQuantity` cheapest qualifying lines are free (one unit each) |
| `bundlePrice` | `{ bundleTotal }` | the qualifying lines cost `bundleTotal` together |
| `tieredDiscount` | `{ tiers: [{ minTotal, percent }] }` | the percentage of the highest tier the `subtotal` reaches |
| `freeShipping` | — | no discount; the reward carries `metadata.freeShipping: true` for the order flow |
| `freeItem` | `{ items: [...] }` | no discount; the reward lists the items to add (`addedItems`) |
| `pointsMultiplier` | `{ multiplier }` | no discount; the reward carries `metadata.pointsMultiplier` |

`registerRule(ruleType, evaluator)` and `registerReward(rewardType,
evaluator)` add or replace an evaluator in project code; an unregistered type
fails the evaluation with `UNKNOWN_RULE` / `UNKNOWN_REWARD`.

The campaign operator manages the store through the cart router:

| Route | Body | Answer |
|---|---|---|
| `GET /{cartObjectName}/campaigns` | — | `{ success: true, data: [rows] }` |
| `POST /{cartObjectName}/campaigns` | a campaign row; `name` required | `201 { success: true, data: row }` |
| `GET /{cartObjectName}/campaigns/:campaignId` | — | `{ success: true, data: row }`, or `404 NOT_FOUND` |
| `PATCH /{cartObjectName}/campaigns/:campaignId` | the columns to change | `{ success: true, data: row }`, or `404 NOT_FOUND` |
| `DELETE /{cartObjectName}/campaigns/:campaignId` | — | `{ success: true, data: row }`: the row is archived (soft delete), or `404 NOT_FOUND` |

A body key that is not a column of the store is dropped (logged as
`CartCampaignPropertiesDropped`); `rules` and `rewards` must be arrays and
`priority` a number, else `400 VALIDATION_ERROR`. Every write drops the
campaign cache, so the next pricing pass reads the store again. Example:

```json
{
  "name": "Summer 10",
  "priority": 10,
  "requiresCoupon": true,
  "couponCode": "SUMMER10",
  "rules":   [{ "ruleType": "minCartTotal", "config": { "minTotal": 100 } },
              { "ruleType": "dateRange", "config": { "startDate": "2026-06-01", "endDate": "2026-08-31" } }],
  "rewards": [{ "rewardType": "percentDiscount", "config": { "percent": 10 } }]
}
```

### Usage limits

A campaign row carries a `usageCount` counter. Turn on
`promotionSettings.dynamicPromotions.campaignSettings.supportUsageLimits` and
give a campaign the rule `{ "ruleType": "usageLimit", "config": { "maxUses": 100 } }`:

- every cart-router checkout records usage **inside the checkout claim**: the
  `usageCount` of each campaign the checkout used (its automatic promotions
  and the coupon campaigns of the cart's codes) goes up by one;
- a capped campaign's step is ONE guarded database statement
  (`usageCount + 1 <= maxUses`), so two baskets racing for the last use cannot
  both win - the loser answers `409 PROMOTION_USAGE_LIMIT_REACHED` with its
  cart unchanged and retryable (claim released, stock holds restored);
- coupon evaluation reads the counter: a used-up coupon answers
  `400 COUPON_NOT_ELIGIBLE`;
- a checkout whose order create fails definitely gives the use back.

With `supportUsageLimits` off the cart router records nothing and a
`usageLimit` rule fails loud (`USAGE_LIMITS_DISABLED`). A `CartCheckoutAction`
records per its own `recordPromotionUsage` (default `true`), and a
`CouponValidationAction` enforces (`checkUsageLimits: true`, the default) or
skips (`false`) the cap for that one validation. Per-customer, budget and
daily limits (`supportCustomerLimits`, `supportBudgetLimits`,
`supportDailyLimits`) are **not implemented**; setting one is a validation
warning (`SHOPPING_CART_CAMPAIGN_LIMIT_NOT_IMPLEMENTED`).

### Coupon verdicts are typed

The coupon routes answer rejections with typed verdicts, never a generic
500 and never a silent no-op:

- an **unknown** coupon code answers `404 COUPON_NOT_FOUND`;
- a code whose campaign matched but whose rules refuse the cart — expired
  window, minimum not met, usage cap reached — answers
  **`400 COUPON_NOT_ELIGIBLE`**. An ineligible coupon is never silently
  "applied" with a zero discount (auto-applied promotions keep
  empty-reward-is-normal semantics; only the explicit coupon path refuses);
- **removing one coupon re-applies the rest**: `removeCoupon` re-evaluates
  every remaining applied code, so on a two-coupon cart removing one keeps
  the other's discount priced in, and a line's own discount stays;
- **applying a code already on the cart changes nothing**: a coupon is a code
  in `couponCodes`, and its reward is derived from the basket on every pricing
  pass (add, update, remove, recalculate, checkout), never accumulated in the
  stored lines. A quantity change re-fits it, and a code the basket no longer
  qualifies for is dropped from `couponCodes` (logged as `CartCouponDropped`).
  The usage cap is judged when the code is applied and by the checkout's
  usage step, not by every re-pricing.

On a VAT-inclusive catalogue a coupon discount applies **before** the
gross-first VAT extraction: `250-inc × 2` minus a 50 coupon is `450.00`
gross, of which VAT (20%) is exactly `75.00` — not the `83.33` of the
undiscounted line.

### The campaign store is platform-operator-only in a multi-tenant project

With `promotionSettings.dynamicPromotions.enabled`, the compiler generates the
`{cartObjectName}Campaign` object (the campaign store the promotion engine
loads) and five campaign admin routes on the cart router: `GET` / `POST
/campaigns`, `GET` / `PATCH` / `DELETE /campaigns/:campaignId`.

**The campaign store of a multi-tenant cart is service-wide and
platform-operator-only; every write surface on it must be restricted to the
platform operator.** The object has no tenant column, and the promotion
engine applies every enabled row to every tenant's cart, so a tenant role
that could write it would set promotions for all tenants.

- The generated admin routes enforce it: in a multi-tenant project they mount
  a platform-operator requirement behind the campaign-operator gate, so
  `tenantOwner` / `tenantAdmin` get `403 PLATFORM_OPERATOR_REQUIRED` and only
  `superAdmin` / `saasAdmin` pass (a multi-tenant project has no role
  named `admin`).
- An author-written write surface has to state it. The following are
  refused with the validation error
  `CART_CAMPAIGN_WRITE_NOT_PLATFORM_OPERATOR` unless they are restricted to
  the platform operator:
  - a create / update / delete Business API on the campaign object;
  - a `createCrudAction` / `createBulkCrudAction` / `updateCrudAction` /
    `deleteCrudAction` whose `childObject` is the campaign object, in any
    Business API (the action runs under that API's gate);
  - an AI agent with `enableCrudTools` whose `crudScopes` name the campaign
    object. A write op with no Business API behind it becomes a raw-database
    tool with no role gate, so every write op needs a platform-operator-only
    API of its crudType on the object. (In a multi-tenant project
    `crudScopes` resolves the generated campaign object like an authored
    object, so an agent that meets this rule validates clean.)
    This includes an `agentHub.aiAgents[]` agent whose
    `agentBasics.assignedService` is the cart service: it is emitted into
    that service and gets the same tools;
  - an internal call. `API.<x>` always runs the called API as the system,
    with no session and no role gate, so a Business API that writes the
    campaign store must not declare
    `controllers.internalCallSettings.hasInternalCallController: true`, and
    an API that is not restricted to the platform operator must not call
    `API.<x>` on an API that writes the store (both APIs are named).

  "Restricted to the platform operator" means: `loginRequired: true`,
  `checkRoles` made of `superAdmin` / `saasAdmin` only (`admin` is not
  available in multi-tenant projects),
  `absoluteRoles` (if any) from the same roles, and `M2MAllowed: false` (an
  API named like the default CRUD API, such as `createCartCampaign`, defaults
  `M2MAllowed` to `true`, so set it explicitly). A `permissionCheck` alone does
  not restrict it, because a project may grant the permission to a tenant
  role.

- An author-written READ surface has to state it too, because the rows
  carry every tenant's coupon codes. The following are refused with the
  validation error `CART_CAMPAIGN_READ_NOT_PLATFORM_OPERATOR` unless they are
  restricted to the platform operator, by the same rule:
  - a get / list Business API on the campaign object;
  - a `fetchObjectAction` / `fetchStatsAction` / `searchObjectAction` /
    `fetchFromElasticAction` / `fetchParentAction` that reads the campaign
    object, in any Business API of any service (a `cartService:cartCampaign`
    reference from another service included; the action runs under that
    API's gate);
  - an AI agent `crudScopes` entry whose `get_` / `list_` tool is bound to a
    get / list API on the object that is not restricted (a read tool with no
    API behind it is checked at run time, see below);
  - a `graphQueryAction` that reads the store's graph projection. The
    generated store is not projected into a graph; it is only when the cart
    service authors the campaign object itself with an
    `objectSettings.graphProjection`. A graph action then reads the store when
    its inline Cypher, or the `graphLayer.queries[]` entry it names, names the
    projection's label (by default the capitalized object name, such as
    `CartCampaign`) on the same provider. The action runs under its API's gate;
  - an API that serves a bffService DataView reading the store: a get /
    list API whose `apiOptions.dataViewName` names a view whose `mainObject`,
    an aggregate or a stat `childObject` is the campaign object, directly or
    through an upstream view. There is no other DataView read route, and the
    API's REST, MCP and agent `apiTools` doors all run the same gate, so that
    gate must be platform-operator-only;
  - an internal call onto an API that reads the store (any of the above): such
    an API must not declare `hasInternalCallController: true`, and an API that
    is not restricted must not call `API.<x>` on it;
  - an event notification whose `eventDataSettings.dataViewName` names a
    DataView reading the store. The notification listener writes the
    fetched view document into the notification metadata (the stored
    notification, its delivery logs and the template scope), so it reaches
    every recipient. Its audience must be platform-only: every target a
    `targetKind: 'role'` target of `superAdmin` / `saasAdmin`. A `userId` or
    direct-handle target (the recipient comes from the event data) and a
    `userGroup` target (runtime membership) are refused; a notification with
    no target sends nothing and is not judged.

- If the cart service authors the campaign object itself (an authored object
  of the same name replaces the generated one), two of its settings are
  refused:
  - `objectSettings.graphProjection`, with the validation error
    `CART_CAMPAIGN_STORE_GRAPH_PROJECTED`. A projection copies every tenant's
    campaigns and coupon codes into the graph provider, where any Cypher on
    that provider reads them; a query that names no store label (`MATCH (n)`,
    a variable-length path, a `labels(n)` filter, a ComputeJob `graphIO`
    read) cannot be tied to the store, so the projection itself is refused.
    The `graphQueryAction` check above stays as a second line.
  - `authorization.objectDataIsInTenantLevel: true`, with the validation
    error `CART_CAMPAIGN_STORE_TENANT_LEVEL`. The promotion engine loads the
    store with no tenant filter (one cache entry per cart), so the flag is
    not honoured: every enabled campaign still applies to every tenant's
    cart.

The write, read and graph-projection codes are security findings a forced
build cannot skip: a build that skips ordinary validation findings is still
refused on them. `CART_CAMPAIGN_STORE_TENANT_LEVEL` is an ordinary error: the
flag is ignored, so it gives no tenant role access. In a single-tenant project
the same surfaces are restricted to the campaign operator instead of the
platform operator, under codes of their own (below); its AI agent CRUD tools
on the store follow the campaign-operator rule.

The agent CRUD tools that have no Business API behind them also check it at
run time: in a multi-tenant project, the `create_` / `get_` / `update_` /
`delete_` / `list_` tools on the campaign object run the same
platform-operator check before any read or write (the generated
`/campaigns` routes gate reads too; the rows carry coupon codes) and answer a
tenant role `403 PLATFORM_OPERATOR_REQUIRED`, even in a build that skipped
validation.

**In a single-tenant project, every author-written surface on the campaign
store is restricted to the campaign operator.**
The store holds every
promotion and coupon code of the cart and the promotion engine applies every
enabled row to every cart, so a shopper who could write it could create a
100 percent coupon, and one who could read it would see every coupon code.
The generated `/campaigns` routes admit the campaign operator only (below), and
the surfaces listed for the multi-tenant store above are held to the same
gate:

- a create / update / delete Business API on the campaign object, a
  `createCrudAction` / `createBulkCrudAction` / `updateCrudAction` /
  `deleteCrudAction` whose `childObject` is the campaign object (in any
  Business API; it runs under that API's gate), and the internal-call doors (a
  Business API that writes the store must not declare
  `hasInternalCallController: true`, and an API that is not restricted must not
  call `API.<x>` on one): refused with the validation error
  `CART_CAMPAIGN_WRITE_NOT_CAMPAIGN_OPERATOR`;
- a get / list Business API on the campaign object, a read action or a
  `graphQueryAction` reading it, an API serving a DataView that reads it, the
  same internal-call doors onto a reading API, and an event notification whose
  `eventDataSettings.dataViewName` names such a view (every target must be a
  `role` target of an operator role): refused with
  `CART_CAMPAIGN_READ_NOT_CAMPAIGN_OPERATOR`;
- an authored campaign object with `objectSettings.graphProjection`: refused
  with `CART_CAMPAIGN_STORE_GRAPH_PROJECTED` (`objectDataIsInTenantLevel` is
  not judged in a single-tenant project: no tenant column is injected there);
- custom code calling `LIB.dataViews.<view>` on a view reading the store: the
  warning `CART_CAMPAIGN_LIB_DATAVIEW_READ`; answer the rows to the campaign
  operator only.

"Restricted to the campaign operator" means: `loginRequired: true`,
`checkRoles` made of the operator roles `superAdmin` / `admin` / `saasAdmin` /
`tenantOwner` / `tenantAdmin` only (the roles the `/campaigns` routes admit;
`tenantOwner` / `tenantAdmin` do not exist in a single-tenant project, the list
mirrors the runtime one), `absoluteRoles` (if any) from the same roles, and
`M2MAllowed: false` (an API named like the default CRUD API, such as
`createCartCampaign`, defaults it to `true`). A `permissionCheck` alone does not
count at design time. Both codes are security findings a forced build cannot
skip. The multi-tenant codes never fire in a single-tenant project, and the
single-tenant codes never fire in a multi-tenant one.

**In a single-tenant project, the agent CRUD tools on the campaign store are
gated to the campaign operator.** The generated `/campaigns` routes
admit the campaign operator: an operator role (`superAdmin` / `admin` /
`saasAdmin` / `tenantOwner` / `tenantAdmin`) or a session granted the
`campaignOperator` permission. An AI agent with `enableCrudTools` whose
`crudScopes` name the campaign object (a service agent of the cart service,
or an `agentHub.aiAgents[]` agent whose `agentBasics.assignedService` is the
cart service) must be gated the same way:

- Each `create_` / `update_` / `delete_` tool must be bound to a create /
  update / delete Business API on the object that is restricted to the
  campaign operator: `loginRequired: true`, `checkRoles` made of those
  operator roles only, `absoluteRoles` (if any) from the same roles, and
  `M2MAllowed: false` (an API named like the default CRUD API defaults it to
  `true`). A write op with no API behind it is a raw-database tool with no role
  gate of its own and is refused. A `permissionCheck` alone does not count at
  design time.
- A `get_` / `list_` tool bound to a get / list API on the object must be
  bound to a restricted API too. A read op with no API behind it is accepted:
  it is checked at run time (below).

Otherwise validation refuses the agent with
`CART_CAMPAIGN_AGENT_TOOL_NOT_CAMPAIGN_OPERATOR`, a security finding a forced
build cannot skip. The raw-database tools on the store also check it at run
time, in every build: before any read or write they run the routes' own
operator check with the `campaignOperator` permission, so a caller without an
operator role or the grant gets `403 OPERATOR_REQUIRED` (`401 LOGIN_REQUIRED`
without a session). The grant is asked of the session of the HTTP request that
started the run; a run with none (a kafka or cron trigger, a resumed run)
admits the operator roles only. Other data objects and multi-tenant projects
are not affected by this rule.

**Custom code that calls the campaign database functions directly is outside
every gate and must check the platform operator itself.** A library
function, an edge controller, or an agent `customTools` / `libraryTools`
handler that creates, updates or deletes campaign rows (or writes the table
any other way) passes no route guard, no Business API gate and no validation
rule; refuse every caller that is not `superAdmin` / `saasAdmin` before the
write. The same holds for reads: custom code that calls `LIB.dataViews.<view>`
on a DataView reading the campaign store (as `mainObject`, an aggregate or a
stat, directly or through an upstream view) gets every tenant's campaigns and
coupon codes with no gate, so it must answer them only to `superAdmin` /
`saasAdmin`. Validation warns on such a reference in any service's custom
code (`CART_CAMPAIGN_LIB_DATAVIEW_READ`); it is a warning, not an
error, because a static scan cannot see who receives what the code computes.

## Extension points

There is no blueprint-level hook list. The former `eventSettings` section
and its five `Cart*Events` sub-groups were retired: no runtime in any language
ever resolved a configured Service Library function name into a function, and
the runtime's own event vocabulary shared no name with the list, so a
configured hook could never fire. The automatic churning / abandonment periods
were retired with them: no scheduler exists, and `churning` / `abandoned` are
written only by hand or by an explicit delete. Both successors (cart lifecycle
and recovery automation, and a narrow cart extension-hook contract) are
postponed features.

What does run is the cart manager's runtime event handlers (`onCreateCart`,
`onAddItem`, `onUpdateItem`, `onRemoveItem`, `onClearItems`, `onApplyCoupon`,
`onRemoveCoupon`, `onCheckout`), wired by hand in project code rather than in
the blueprint. A handler may abort the operation with a curated 400, and its
return value replaces the context it received (`onCheckout` may hand back an
`orderId`). See [the compiler specification](../../compiler/index.md).

### Legacy blueprints

A stored blueprint that still carries the retired keys keeps importing,
validating and building. Exactly these paths are dropped from the
validated input before the strict checks run, each with a
`RETIRED_SETTING` warning that names the key and the reason (never the
value):

- `services[].shoppingCartConfig.basicSettings.churningPeriodDays`
- `services[].shoppingCartConfig.basicSettings.abandonmentPeriodDays`
- `services[].shoppingCartConfig.eventSettings` (the whole section:
  `lifecycleEvents.*`, `itemEvents.*`, `pricingEvents.*`,
  `promotionEvents.*`, `checkoutEvents.*`)

The stored document is not rewritten on read or build, and the general
unknown-property check is not relaxed: any other unknown key next to a
retired one is still an error.

## Cart reads are owner-scoped

A get / list Business API on the cart object (the auto-generated one or a
hand-authored object named by `basicSettings.cartObjectName`) must declare
`authOptions.ownershipCheck: true` with `loginRequired: true`; anything else
is the validation error `CART_READ_API_NOT_OWNER_SCOPED` on validate and on
every build, for saved projects too, and a build that skips ordinary
validation findings does not get past it. The owner column is `ownerId` (the
auto-generated cart declares it; a hand-authored cart object adds an `ownerId`
ID property with `sessionSettings: { isOwnerField: true, sessionParam: "userId" }`).
A get then answers 403 to anyone but the cart's owner and a list returns the
caller's own carts.

`absoluteRoles` bypasses the ownership gate, so on a cart get / list API it
holds operator roles only: `superAdmin`, `admin`, `saasAdmin` in a
single-tenant project; `superAdmin`, `saasAdmin` in a multi-tenant one, plus
the tenant administrators `tenantOwner`, `tenantAdmin` where the API's tenant
filter is in force (role names compare case- and separator-insensitively).
Any other entry - `user`, `tenantUser`, `saasUser` or a role the project
defines - lets every holder of that role read every shopper's cart, and is the
validation error `CART_READ_API_SHOPPER_ABSOLUTE_ROLE` on validate and on every
build (saved projects too; a build that skips ordinary validation findings does
not get past it), whatever `ownershipCheck` says.

**A tenant administrator rides the tenant filter.** `absoluteRoles`
never bypasses the tenant scope, so `tenantOwner` / `tenantAdmin` listed there
read the carts of their own tenant only - but only when a tenant filter runs on
the API. That is the case when the cart object is tenant-level (the
auto-generated cart of a multi-tenant project, or a hand-authored cart
object with `objectSettings.authorization.objectDataIsInTenantLevel: true`)
and the API does not declare `apiInSaasLevel: true` - the same rule the
generated where clause and the automatic `tenantOwner` absolute follow. On a
hand-authored cart object that is not tenant-level, on an `apiInSaasLevel`
API, and on the auto-generated cart of a service whose language has not
implemented tenant-level carts yet, a tenant administrator in `absoluteRoles` would read every
tenant's carts: it is reported with the same error, and the message names the
missing tenant scope. `superAdmin` / `saasAdmin` are accepted
everywhere. The fix is to remove that role from
`absoluteRoles`: an operator who must read every cart is listed there, and a
shopper reads their own cart through `ownershipCheck: true`.

### The cart's lines and the other read doors

The other ways to read a cart row or its lines are operator-only, and each is
the validation error `CART_READ_SURFACE_NOT_SCOPED` (on validate and on every
build, saved projects included; a build that skips ordinary validation
findings does not get past it) unless it is restricted to the project's
operator roles (`superAdmin`, `admin`, `saasAdmin` single-tenant; `superAdmin`,
`saasAdmin` multi-tenant, plus `tenantOwner`, `tenantAdmin` where the read's
tenant filter is in force, see below) - `loginRequired: true`,
a non-empty `checkRoles` made of operator roles only, `absoluteRoles` (if
any) from the same roles, and `M2MAllowed: false` (an auto-named CRUD API
defaults it to true, which lets any service of the project read it without a
user role):

- a get / list Business API on the cart item object (`cartItem`, or
  `<cartObjectName><itemObjectSuffix>`). Its rows carry the live `cartId` and
  no owner column, so `ownershipCheck` cannot scope them, and
  `parentOwnershipChecks` does not either (it checks the cart id the request
  names, not the cart of the rows read). A hand-authored item object that
  declares its own owner field may instead be owner-scoped like the cart;
- a read action (`fetchObjectActions`, `fetchStatsActions`,
  `searchObjectActions`, `fetchFromElasticActions`, `fetchParentActions`)
  whose target is the cart or the cart item object, in any API: the host API
  must be operator-only;
- an AI agent's `crudScopes` naming the cart or the cart item object when a
  `get_` / `list_` op has no Business API of that crudType behind it (the
  registry would register a raw database tool with no gate). Author an
  owner-scoped (cart) or operator-only (cart item) get / list API so the tool
  is bound to it, or drop the scope;
- a DataView whose `mainObject`, an aggregate or a stat `childObject` is the
  cart or the cart item object. A DataView has no access gate of its own, so
  there is no operator-only form: do not project cart rows into a view.

The same code covers the remaining doors:

- an AI agent's `crudScopes` entry naming the cart or the cart item object:
  every `create_` / `update_` / `delete_` op must be bound to a create /
  update / delete Business API restricted to the operator roles. A write op
  with no API behind it would register a raw database tool with no gate, so
  it is refused (the generated registry also restricts such a tool to the
  operator roles at run time, for a build that skipped validation). A service
  agent and a hub agent assigned to the cart service are both judged; reads
  bound to an owner-scoped cart get / list API stay accepted. In a
  multi-tenant project `tenantOwner` / `tenantAdmin` count as operators of a
  write op only where its tenant filter is in force: the generated cart and
  cart item objects (tenant-level), or a hand-authored tenant-level cart
  object, written by an API without `apiInSaasLevel`;
- a `query.selectClause.selectJoins[]` or `query.listOptions.jointFilters`
  entry whose `joinedDataObject` is the cart or the cart item object: the join
  reads the rows its key names, so the host API must be operator-only, and in
  a multi-tenant project restricted to the platform operators (`superAdmin`,
  `saasAdmin`) - the join fetch carries no tenant filter, not even onto a
  tenant-level cart object (the generated cart of a multi-tenant project
  included), so a tenant administrator would read other tenants' carts;
- a `graphQueryActions` entry whose query names the graph projection of a
  cart object: the host API must be operator-only;
- an API that calls `API.<name>(...)` on an API that reads the cart or its
  lines (a get / list on them, owner-scoped or not, a read action, a join or a
  graph read): the internal call runs as the system, so the caller's own gate
  must be operator-only, whatever the called API declares;
- refused outright, because no reader gate can be tied to them:
  `objectSettings.graphProjection` on the cart or the cart item object, a
  `staticJoin` in another object whose `jointSource` is one of them (it copies
  cart columns into that object's rows), and
  `controllers.internalCallSettings.hasInternalCallController` on an API that
  reads them;
- an event-subscription topic that carries cart or cart item rows (its
  `dataObjectName` names one, or it is one's database-event or index topic, or
  the cart checkout topic): accepted only when its delivery filter is proven -
  it names a cart object AUTHORED in this service (the auto-generated objects
  are added after the subscription resolves its topics) that declares an
  owner field, it is not `accessPublic`, and `auth.absoluteRoles` (which
  bypass the filter) holds operator roles only (platform operators in a
  multi-tenant project). The checkout event carries no owner marker and is
  refused.

Custom code (library and edge functions, hooks, action scripts) that reads the
cart or its lines directly - through the generated database readers, or an
indexer on the cart index - runs outside every API gate; it draws the warning
`CART_LIB_DIRECT_READ`: make sure it answers a shopper their own cart only, or
operators only.

A shopper reads their own cart and its lines through the live cart route
(`GET /<cartObjectName>`, `GET /cart` by default) or an owner-scoped get / list
API on the cart object.

**A tenant administrator rides the tenant filter here too.** The rule above
applies to these doors: in a multi-tenant project `tenantOwner` /
`tenantAdmin` count as operators of a cart read only where that read's tenant
filter is in force, because the tenant filter, not the role gate, is what
confines them to their own tenant. `superAdmin` / `saasAdmin` are accepted
everywhere, and single-tenant projects are unchanged. Which filter decides:

- a get / list API on the cart item object: the API's own tenant filter over
  the item object - the item object is tenant-level (the auto-generated cart
  item object of a multi-tenant project, or a hand-authored item
  object with `objectSettings.authorization.objectDataIsInTenantLevel: true`)
  and the API does not declare `apiInSaasLevel: true`. On an item object that
  is not tenant-level a tenant administrator in `checkRoles` or
  `absoluteRoles` (the owner-scoped alternative included) is refused;
- a read action: the action's own tenant pin on its target (the cart or the
  cart item object), not the host API's filter over its own object - the
  target is tenant-level and the host API does not declare `apiInSaasLevel`.
  The host's effective `absoluteRoles` are judged, including the `tenantOwner`
  the generated gate adds on its own to an API whose own tenant filter is in
  force: a host API over a tenant-level object admits `tenantOwner` past its
  `checkRoles`, so a read action in it onto a cart or cart item object with no
  tenant pin is refused even when the authored roles are platform operators.
  Move such a read to an API over a non-tenant-level object, to an
  `apiInSaasLevel` API restricted to the platform operators, or make the
  target tenant-level.

The finding is the same `CART_READ_SURFACE_NOT_SCOPED`; its message names the
missing tenant filter, and `details` carries `operatorRoles`,
`tenantFilterInForce` and `tenantScopeField`.

## See also

- [Payment workflow](payment-workflow.md)
- Spec: [`ShoppingCartConfig`](../../spec/ShoppingCartConfig.md), [`ShoppingCartCheckoutSettings`](../../spec/ShoppingCartCheckoutSettings.md), [`CartCheckoutAction`](../../spec/CartCheckoutAction.md), [`CartValidationAction`](../../spec/CartValidationAction.md)
