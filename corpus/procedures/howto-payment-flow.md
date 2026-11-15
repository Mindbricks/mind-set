# How-to: the payment flow - cart, checkout, capture, refund

Harness-agnostic. The first pattern how-to of the family the patterns
catalog announces: the catalog says WHICH pattern (`checkout`,
`shoppingCartConfig`), `blueprint-authoring.md` says how to write any
service; this document says how a complete one-time-payment flow is
ASSEMBLED and VERIFIED, in the order that validates in one pass. Every
claim below was checked against the pattern ontology
(`CheckoutConfig`, `Checkout`, `PaymentResultMap`, `StripeOrderItemRelation`,
`LifecycleHook`, `ApiInternalCallSettings`, `RefundAction`, `PaymentAction`,
`PublishEventAction`, `ValidationAction`, `ShoppingCartConfig` and its
sections, `CartCheckoutAction`) and against the worked example: the pilot
project's `order` service (AtelierCollective, #4405), authored by a harness
lane, compiled, and exercised on a running system. Where the ontology and an
older cookbook page disagree, the ontology wins, and the pattern pages
(`openappl/spec/<Pattern>.md`) outrank this document.

**Task shape.** The spec (`service-spec-<serviceName>`) describes an order
that is paid once — a basket becomes an order, the customer pays, the
money is captured, the goods ship, a paid order may be refunded. You
author ONE service that carries the domain order, opts into the two
patterns, and wires the payment lifecycle back into the order, then you
validate the blueprint before reporting.

**Prerequisites.** A payment provider declared at
`projectSettings.paymentProvidersSettings.paymentProviders[]`; you
reference it by its `name`. Credentials never belong in the blueprint.
Read `blueprint-authoring.md` first: its write loop, value-source rule and
validation gotchas apply unchanged here.

---

## 1. What you author vs what the pattern emits

Derive the inventory before writing anything (scaffold-then-fill). For a
cart + checkout + refund service the inventory is:

| You author | The pattern emits (never hand-add) |
|---|---|
| The domain `order` object (section 2) and its `orderItem` object | `sys_<Order>Payment` (the payment TICKET), `sys_<Order>Refund`, `sys_paymentEvent`, plus the project-level `sys_paymentCustomer` / `sys_paymentMethod` on the auth service |
| `shoppingCartConfig` (section 3) and the bridge APIs that replace disabled cart routes | The `cart` / `cartItem` objects and the cart router (`GET /cart`, `PUT|DELETE /cart/items/:barcode`, `DELETE /cart/items`, `POST /cart/recalculate`, ...) |
| `objectSettings.checkout` on the order (section 4) | `PATCH /v1/start<order>payment/:orderId`, `PATCH /v1/refresh<order>payment/:orderId`, `GET /v1/<order>paymentbyorderid/:orderId`, `POST /v1/<order>refundpayment/:orderId`, `POST /v1/<order>mockauthenticate/:orderId`, `GET /v1/payments/mock-status`, `POST /v1/payments/webhook/:providerName`, `POST /v1/payments/checkout-return/:providerName` (iyzico hosted-form return), `POST /v1/payments/threeds-return/:providerName` (iyzico saved-card 3-D Secure return, emitted when an iyzico provider is configured), the `/v1/payments/admin/*` operator console incl. `simulate-capture` |
| The internal lifecycle-hook APIs (section 5) and the hooks (section 6) | The webhook verification, the payment state machine, the event dispatcher with its replay worker |
| The refund-bearing business APIs and the retry sweep (section 7) | The `sys_<Order>Refund` row and the ticket's `partially_refunded` / `refunded` transitions |
| Domain events (bare topics) and their notification bindings (section 8) | The wire envelope and the project-codename prefix |

**iyzico subscriptions (fw #6347).** A subscribe on an iyzico-bound
subscription object (`POST /v1/subscribe<order>/:orderId`, or a
`SubscriptionAction` `stage: "subscribe"`) does not create the subscription
at iyzico. It answers `statusLiteral: "pending_provider"`,
`providerSubscriptionId: "pending:checkout:<token>"` and a `checkoutForm`
(`checkoutFormContent`, `paymentPageUrl`, `token`): the frontend shows that
form, the buyer pays on iyzico's page, and the emitted
`POST /v1/payments/subscription-checkout-return/:providerName` reads the result
from iyzico, makes the row `active` (or `provider_failed`), runs
`afterSubscriptionCreated` once (only for an ACTIVE confirmation; another
iyzico status is written to the row with no event) and 303s to the
subscribe's `returnUrl` with `subscriptionId` and `status`. A cancel of a
row still `pending_provider` (raw `DELETE` route or `SubscriptionAction`)
reads the form first: a form that produced no subscription closes locally,
one that did is canceled at iyzico, and a later finish of a canceled form
does not revive the `canceled` row. Grant nothing on `pending_provider`, and author
no "confirm subscription" API. The buyer's email comes from the session (or
`metadata.buyer.email`); without one the subscribe answers
`400 SUBSCRIPTION_BUYER_EMAIL_REQUIRED`. On the mock, the form's
`checkoutFormContent` is a form that POSTs the token to that route, so
rendering it completes the subscription.

**DO-NOT-HAND-ADD list** (each one collides with the injected surface or
duplicates machinery that already exists): a `sys_*` twin of any object
above; a webhook route or a "payment status callback" API (on iyzico this
includes a "3-D Secure complete" API: the emitted threeds-return route calls
`3dsecure/auth` itself and runs the payment hooks once (iyzico's own webhook
for the payment does not run them again), so a design never authors a
`PaymentAction` `stage: "complete"` for iyzico; nor a "reconcile the
hosted form" job: iyzico's Checkout Form webhook settles a hosted-form
payment whose browser never came back, through the checkout-return route's
own row, once, fw #6344 - point the iyzico merchant panel's webhook URL at
`POST /v1/payments/webhook/:providerName`); a
payment-intent / provider-customer / card field family on the order, or a
column for iyzico's `cardUserKey` (the framework keeps ONE key per buyer
on `sys_paymentCustomer.cardStorageKey`, written machine-only on the
buyer's first card save, fw #6342), nor a "save my card" API for the hosted
form (with `checkout.configuration.storePaymentMethod: true` on an
iyzico-bound order - or `subscription.configuration.storePaymentMethod:
true` when the order also has a subscription block - the start opens the
form with the buyer's key and a card saved on it is filed in the ticket
owner's wallet when the payment settles, fw #6346), nor a "file the
webhook's method for the buyer" API (the event dispatcher files a
provider-reported stored method for the user who owns the provider
customer's mapping, through the auth service's machine-only
`attachPaymentMethodByCustomerIdForMachine`) (ONE
business reference column such as `paymentReference` is fine — it is
yours, written by your hook API, never by the pattern); a hand-built
refund library function (the `RefundAction` is the refund); a hand-built
ledger for balances (`ledgerSettings`). The emitted surface is listed by the
compiler contract (`openappl/compiler/09-04-payment.md` and
`openappl/compiler/12-derived-surface.md`): the system-router routes are the
pattern working, and the `sys_<Order>Payment` CRUD APIs the framework
injects (`getOrderPayment`, `listOrderPayments`, `getOrderPaymentByOrderId`,
`listPaymentEvents`, ...) are also not yours to twin.

**Stripe facts that decide what you author (#6346, #6347):**

- A Stripe payment needs NO complete API. Stripe finishes the intent after
  the browser's 3-D Secure step; the emitted webhook route records it and
  runs `afterPaymentCaptured`, `PATCH /v1/refresh<order>payment/:orderId` is
  the backstop. Never author a `PaymentAction` with stage `complete` for
  Stripe.
- Save the card while paying = the opt-in
  `objectSettings.subscription.configuration.storePaymentMethod: true` on
  the order object plus a `PaymentAction` with stage `start` / `simple`: the
  adapter sends `setup_future_usage: "off_session"` and the
  `payment_method.attached` webhook stores the card in `sys_paymentMethod`.
  It is never a request field (`providerOptions.setup_future_usage` is a
  400), and the emitted start route does not store cards.
- Subscriptions: a first payment that needs 3-D Secure answers
  `statusLiteral: "past_due"` plus `nextAction.clientSecret`; the frontend
  runs `stripe.confirmCardPayment(clientSecret)`, and `invoice.paid` makes
  the row `active`. Grant the plan on `active` (`afterInvoicePaid` /
  `afterSubscriptionRenewed`), not on `afterSubscriptionCreated`. A renewal
  needing the buyer reaches `afterInvoicePaymentFailed` with
  `resource.requiresAction` and `resource.hostedInvoiceUrl` (mail that link).
- Off-session Stripe charging is NOT supported: nothing charges a saved
  Stripe card while the buyer is away. Recurring money on Stripe is a
  Stripe subscription.

## 2. The order object — columns the flow needs

Design the domain order as the spec says, then make sure these roles are
covered (pilot names in parentheses; yours may differ, the BINDINGS in
section 4 name them):

- **Money in MAJOR units** (`totalAmount: Double`, `currency: String`).
  Platform money convention (#4085): `250.00`, never `25000` — a bound
  column in minor units charges 100x. The pattern converts to each
  provider's wire encoding itself.
- **Owner** (`customerUserId: ID`) with
  `sessionSettings: { sessionParam: "userId", isOwnerField: true }` — it is
  session-injected on create and it is what `ownershipCheck: true` and the
  payment routes' `403 NOT_OWNER` gate read. Bind it as
  `orderOwnerIdProperty`.
- **Three status columns with three owners** — keep them apart:
  - `status` (Enum: `placed | paid | shipped | delivered | cancelled |
    expired`) — the BUSINESS lifecycle, written only by your APIs;
  - `paymentStatus` (Enum: `unpaid | succeeded | failed | refund_pending |
    refunded`) — the business money state, written by your hook APIs and
    refund APIs;
  - `providerPaymentState` (Enum: `none | started | success | failed |
    canceled`) + `providerPaymentStateUpdatedAt` — the columns you bind as
    `orderStatusProperty` / `orderStatusUpdateDateProperty`. They are
    DECLARATIVE (#4296): the generated payment layer never writes them;
    the ticket (`sys_<Order>Payment.statusLiteral`) carries the provider
    state, and your hook writes whatever the order should show.
- **Provider reference** (`paymentReference: String`, optional) — the
  provider intent id your captured-hook stores so a later refund can
  address it (`RefundAction.paymentIntentIdProperty` reads it). Never card
  data (#4474).
- **Timestamps per transition** (`placedAt`, `paidAt`, `shippedAt`,
  `deliveredAt`, `cancelledAt`, `expiredAt`) and an `expiresAt` for the
  unpaid-order sweep; refund bookkeeping when the spec has a retry policy
  (`refundRetryCount`, `refundEscalated`, `lastRefundRetryAt`).
- **`orderItem`**: `orderId` (relation to `order`, `onDeleteAction:
  doDelete`, indexed), the product reference (a REMOTE ref when the
  catalog lives in another service — `onDeleteAction: doNothing`, the
  commercial line outlives a product archive), the captured `productName`
  / `unitPrice` / `quantity` / `lineTotal` (frozen at checkout — later
  catalog edits must not rewrite history), and a composite index
  `[orderId, productId]` with `onDuplicate: throwError`.

`useSoftDelete: true`, `dataObjectAccess: accessPrivate` and no delete
APIs are the normal choices for an order.

## 3. The cart — `shoppingCartConfig` and the Redis-first idiom

The chapter lives at `services/<name>/shoppingCartConfig`
(an edit of `blueprint.json` at that path). The pilot's knobs, all from the spec:

```json
{
  "basicSettings": { "useShoppingCartFeature": true, "cartObjectName": "cart",
                     "currency": "TRY", "supportGuestCart": false,
                     "supportNotes": false, "supportMetadata": false },
  "pricingSettings": { "defaultVatRate": 0, "catalogPricesIncludeVat": true,
                       "roundingStrategy": "perLine", "roundingPrecision": 2,
                       "discountSettings": { "supportType": "none" },
                       "shipmentSettings": { "supportShipment": false },
                       "extraChargeSettings": { "supportExtraCharges": false } },
  "productCatalogSettings": { "useProductCatalog": false },
  "redisSettings": { "enabled": true, "keyPrefix": "atelier-cart",
                     "cartTtlSeconds": 604800, "itemsTtlSeconds": 604800,
                     "persistStrategy": "onEveryChange",
                     "useHashForCart": true, "useListForItems": true },
  "apiSettings": { "routePrefix": "/cart", "rateLimiting": true, "maxRequestsPerMinute": 60,
                   "enabledRoutes": { "getCart": true, "addItem": false, "updateItem": true,
                                      "removeItem": true, "clearCart": true, "recalculate": true,
                                      "checkout": false, "applyCoupon": false,
                                      "removeCoupon": false, "redeemPoints": false } },
  "checkoutSettings": { "orderCreationMode": "none", "publishCheckoutEvent": false }
}
```

Decisions behind it:

- **Guest carts.** `basicSettings.supportGuestCart` is THE gate that
  decides whether the cart router accepts an anonymous caller
  (`apiSettings.authenticationRequired` is retired and reads nothing). A
  guest is its `X-Session-Id`; login is rotation, not adoption (#4206).
- **Where the catalog lives decides `useProductCatalog` and which routes
  you disable.** A catalog in the SAME service: bind it
  (`productCatalogSettings`) and keep the generated `addItem` — the cart
  prices from the catalog itself. A catalog in ANOTHER service (pilot):
  no binding, disable `addItem` and `checkout`, and author bridge APIs
  that price server-side through an `interserviceCallAction` to the
  catalog (never from client input).
- **`orderCreationMode`.** `local` lets the generated checkout route
  create the order (declare on the order every column `autoMapProperties`
  copies — `ownerId`, `currency`, `subtotal`, `total`, ... — undeclared
  ones are dropped; `orderDataClause` for the rest; `initialOrderStatus`).
  `none` (pilot) when the order needs cross-service pricing/validation
  before it exists: your own `create` API on the order does the work and
  a `cartCheckoutActions` entry with `stage: "finalize"`,
  `clearCartAfterCheckout: true` settles the basket after the main
  create. The validator then warns `CART_ACTION_ON_NON_CART_OBJECT` —
  deliberate, judge it and move on.

**The Redis-first rule.** Redis is the AUTHORITATIVE live cart; the
`cart` / `cartItem` DB rows are a best-effort MIRROR (ontology
`ShoppingCartRedisSettings`). Consequences for the blueprint:

1. **Read and mutate the cart through the generated cart MANAGER, never
   through `dbLayer`.** A dbLayer write touches the mirror only and is
   invisible to `GET /cart`; a `FetchObjectAction` on `cart` reads a
   store the routes never consult. The manager is the class
   `<ServiceNameCap>ShoppingCart` exported from
   `apiLayer/shopping-cart/<ServiceNameCap>ShoppingCart` (verified in the
   nodejs templates; pilot: `OrderShoppingCart`), constructed with
   `(overrides = {}, session)` where the session is `{ userId }` for a
   member cart or `{ sessionId }` for a guest one. Library functions wrap
   it:

   ```js
   // library/functions/listCartLines
   module.exports = async function listCartLines(userId) {
     const { OrderShoppingCart } = require('apiLayer/shopping-cart/OrderShoppingCart');
     const manager = new OrderShoppingCart({}, { userId });
     const cart = await manager.getCart();
     const items = cart && Array.isArray(cart.items) ? cart.items : [];
     return items.map((i) => ({ productId: i.productId ?? i.barcode, productName: i.productName ?? null,
       unitPrice: Number(i.unitPrice), quantity: Number(i.quantity),
       lineTotal: Math.round(Number(i.unitPrice) * Number(i.quantity) * 100) / 100 }));
   };
   // library/functions/upsertCartItem — line = { userId, productId, name, unitPrice, quantity }
   //   from the CATALOG answer, never client input
   const existing = items.find((i) => String(i.barcode) === String(line.productId));
   if (existing) return await manager.updateItem(String(existing.barcode),
     { quantity: Number(existing.quantity) + Number(line.quantity), unitPrice: Number(line.unitPrice) });
   return await manager.addItem({ barcode: String(line.productId), productId: line.productId,
     productName: line.name, unitPrice: Number(line.unitPrice), quantity: Number(line.quantity), vatRate: 0 });
   ```

   The manager auto-creates the cart on first add — no `findMyCart` /
   `createMyCart` APIs.
2. **A bridge "add item" API is `crudType: list` on `cart` with
   `forcePOSTMethod: true`**, not `update`: an update's main operation
   would 404 on a missing mirror row for a live Redis cart; a list is
   row-count-safe and the work is the action chain (catalog fetch ->
   guard -> `LIB.upsertCartItem` with `writeToResponse: true`).
   `dataObjectName: "cart"` is accepted for a pattern-generated object.
3. **The Cart auto-object keys its owner as `ownerId`** (members) /
   `sessionId` (guests) — NOT `userId`. `fullWhereClause` field names are
   not validated against columns: the pilot's every cart API 500'd
   (`column "userId" does not exist`) until the clause became
   `{ ownerId: this.session.userId }`. Confirm names in the pattern page
   (`openappl/spec/<Pattern>.md`) of any pattern-generated object.

**The checkout API in `none` mode** (pilot `checkoutCart`, `crudType:
create` on `order`, `POST /checkout`, `loginRequired: true`), in workflow
order at `afterCheckBasicAuth`: `LIB.listCartLines(this.session.userId)`
-> guard non-empty -> `FetchObjectAction` on the auth `user` for the
delivery snapshot -> guard delivery fields -> interservice
`getProductsForCheckout(productIds[])` -> compute `unavailableProductIds`
(`AddToContextAction`) -> guard empty -> price lines and total from the
CATALOG answer (not the stale cart) -> resolve staff recipients. Then
`dataClauseItems` write the order (`status: 'placed'`, `paymentStatus:
'unpaid'`, `providerPaymentState: 'none'`, `totalAmount: this.pricedTotal`,
`placedAt`, `expiresAt`, `checkoutId: crypto.randomUUID()`, the delivery
snapshot), and `afterMainCreateOperation` runs `createBulkCrudActions`
for the lines, the cart `finalize`, the event payload and the
`publishEventAction`. Every NOT-NULL order column is covered by a data
clause or an activation block — there is no third path.

Two limits met here, both platform-level: a `ValidationAction` message is
a STATIC string — a typed sold-out error cannot carry the computed
`unavailableProductIds[]` (compute it for the log, state the rule in the
message; fw #4446 tracks computed payloads); and the shape of a
cross-service list answer varies (`{ data: [...] }` vs a bare array) —
unwrap shape-tolerantly: `(this.answer.data ?? this.answer) || []`. If
the spec wants counts (open orders per customer, pending refunds) reach
for `FetchStatsAction` and normalize its result through an
`AddToContextAction` before any comparison — its result shape is
undocumented.

## 4. Checkout activation — stage 1, the base block WITHOUT hooks

The section is `services/<name>/dataObjects/<order>/objectSettings/checkout`
(`Checkout`: `objectIsAnOrderObject: true` + `configuration: CheckoutConfig`).
Write it into `blueprint.json` at `.../<order>/objectSettings` (payload
`{ "checkout": { ... } }`). The pilot's stage-1 payload, annotated:

```json
{ "checkout": { "objectIsAnOrderObject": true, "configuration": {
  "providerName": "iyzico",                 // EXACT paymentProviders[].name from Phase 1
  "orderName": "order",                     // REQUIRED display name (provider dashboards)
  "orderIdProperty": "id",                  // REQUIRED
  "amountProperty": "totalAmount",          // MAJOR units
  "currencyProperty": "currency",           // (currencyStaticValue is only the LAST fallback)
  "orderOwnerIdProperty": "customerUserId", // the session-injected owner column
  "orderStatusProperty": "providerPaymentState",                 // declarative (#4296)
  "orderStatusUpdateDateProperty": "providerPaymentStateUpdatedAt",
  "description": { "js": "'Atelier Collective siparisi'" },      // static MScript literal
  "mapPaymentResultToOrderStatus": {        // PaymentResultMap: all four REQUIRED, declarative
    "paymentResultStarted":  { "js": "'started'" },
    "paymentResultSuccess":  { "js": "'success'" },
    "paymentResultFailed":   { "js": "'failed'" },
    "paymentResultCanceled": { "js": "'canceled'" } },
  "orderItemRelation": { "hasOrderItemRelation": true, "orderItemObject": "orderItem",
    "orderForeignKey": "id",            // ORDER-side property the items match on
    "orderItemLocalKey": "orderId",     // ITEM-side FK column
    "quantityProperty": "quantity" },
  "onPaymentError": "throwError",       // or continueRoute
  "idempotencyStrategy": "framework"    // UUIDv4 per intent; adapter = provider-native
} } }
```

- **`orderItemRelation` orientation** is the one specs most often invert:
  `orderForeignKey` is a property of the ORDER (`id`); `orderItemLocalKey`
  is the property of the ITEM that stores the relation (`orderId`). The
  type is `StripeOrderItemRelation` — legacy name, provider-neutral.
- **`description` has no documented slot scope beyond a literal** —
  author a static string; a spec's `payment.orderNumber` binding is not
  expressible here.
- **`PaymentResultMap` and `orderStatusProperty` are documentation of
  intent**: the hook you write in section 6 performs the write they
  describe. Bind them anyway (the pattern's docs render from them).
- **`providerName` auto-binds** only when exactly one stripe-typed
  provider exists; otherwise it is required. The name is looked up
  verbatim — `iyzico`, `defaultStripe`, whatever Phase 1 registered.
- `billingModel` (`reseller` / `intermediary`) matters only with
  invoicing / marketplace on the same object; leave it absent otherwise.

**Why hooks come LAST (the two-stage activation).** `RefundAction`
validates against the checkout block on its data object
(`PAYMENT_NOT_CONFIGURED` when the object is not yet an order object),
while `lifecycleHooks` are statically checked for every `API.<name>` they
call (`INTERNAL_API_NOT_FOUND` / `INTERNAL_API_NO_CONTROLLER` when the
internal API does not exist yet). Neither can go first in a single write,
so: (1) merge the block above WITHOUT `lifecycleHooks`; (2) author the
internal hook APIs and every refund-bearing API (sections 5 and 7); (3)
merge `lifecycleHooks` (section 6). Pilot-verified; the validator messages
name the exact fix if you get the order wrong.

## 5. The lifecycle-hook APIs — internal, fully parametric, idempotent

**Nodejs and rust internal-call sessions:** `await API.<name>(params)` keeps a
null session. A BusinessApi action (and, on nodejs, a hook) that has a caller
session and wants the caller's tenant explicitly uses
`await API.<name>(params, { session: this.session })`; ledger internal APIs
on a tenant-scoped owner object need it too. There is no inheritance through
AsyncLocalStorage or the running manager. Supplying the session preserves
the trusted system role/ownership bypass; the wrapper must enforce access.
Other language targets retain the sessionless signature. The provider
webhook hooks described below have no caller session.

A hook runs from a provider webhook (or the mock / simulate-capture
paths): there is no request, session or user. So every hook delegates to
a same-service Business API that is:

- `controllers.internalCallSettings.hasInternalCallController: true` and
  `controllers.restSettings.hasRestController: false` — a member of the
  in-process `API` namespace and nothing else (the derived surface lists it
  with no method/route); `apiOptions.blockMcp: true` keeps it off
  the MCP tool surface too;
- `authOptions: { loginRequired: false, ownershipCheck: false }` — internal
  calls run `asSystem`; session-injected values, ownership checks and
  role gates on such an API are meaningless and flagged (an `ownershipCheck`
  is refused as `INTERNAL_API_OWNERSHIP_UNENFORCEABLE`, even by a build with
  `skipValidation: true`: the system call would reach any row);
- **fully parametric**: every input is an explicit `requestParameters[]`
  entry (`httpLocation: "body"` is fine — no transport is involved) and
  the selector is `whereClause.fullWhereClause: { "js": "{ id: this.orderId }" }`;
- `apiOptions.onNotFound: "throw404"` — `complete` is refused on an
  internal-call-only API (`API_ONNOTFOUND_TRANSPORT_UNSUPPORTED`); a
  vanished order then lands in the `PaymentLifecycleHookFailed` log, which
  is the right place;
- **idempotent under at-least-once delivery**: the dispatcher can replay
  an event (lease expiry, retries, the replay worker), so every data
  clause must re-apply cleanly — decide the transition from the CURRENT
  row (`this.<order>.status === 'placed' ? ... : this.<order>.status`)
  rather than assuming it;
- a parameter carried only for traceability (a refund id you do not
  store) is `contractOnly: true` — otherwise an `update` with an empty
  `dataClauseItems` is refused (`UPDATE_WRITES_NOTHING`) and a data clause
  onto an `allowUpdate: false` column is refused too (the fw #4444 idiom).

The three the pilot wrote (`crudType: update` on `order`):

| API | Params | What it writes |
|---|---|---|
| `applyPaymentCapture` | `orderId`, `paymentReference`, `providerIntentId` | claims stock at the catalog (interservice, `idempotencyKey: 'claim:' + orderId`), then `status: paid`, `paymentStatus: succeeded`, `paidAt`, `paymentReference` — or, on a refused claim, `status: cancelled`, `cancelReason: sold_out`, `paymentStatus: refund_pending` + a full `RefundAction`; a capture that lands on an already-expired order is refunded in full and stays `expired` |
| `recordPaymentFailed` | `orderId` | `paymentStatus: this.order.status === 'placed' ? 'failed' : this.order.paymentStatus` — the customer may retry until expiry; a late failed webhook on any other state no-ops |
| `recordPaymentRefunded` | `orderId`, `refundReference` (`contractOnly`) | `paymentStatus: 'refunded'` — converges the money state when the provider confirms; never touches `status`, never restores stock |

Two authoring traps inside `applyPaymentCapture`, both caught by the
validator with an exact message: (a) a post-update action that reads
`this.<order>.<field>` sees the PRE-update alias
(`STALE_ALIAS_READ_AFTER_MAIN_UPDATE`) — snapshot the condition you need
into context at `afterFetchInstance` (`AddToContextAction`
`lateExpiredCapture`) and read the written row through `this.result`;
(b) an interservice call that must be skipped on replay carries a
`condition` (`this.captureApplies`) and a default context so the data
clause still resolves (`this.claim || { claimed: true, alreadyProcessed: true }`).
Workflow: `afterCheckParameters: [loadLines]` (a `LIB` read of the order
lines), `afterFetchInstance: [setCaptureApplies, setLateExpired,
claimStock, setClaimDefault]`, `afterMainUpdateOperation: [refundSoldOut,
refundLateExpired, emitPaid, emitSoldOutCancel]`.

## 6. Checkout activation — stage 2, the hooks merge

Merge the SAME `checkout` block again with `lifecycleHooks[]` added
(named items under `configuration`; edit the block in place, so the
stage-1 fields stay). The pilot's three, with the argument shapes that
are correct against the `LifecycleHook` ontology:

```json
"lifecycleHooks": [
  { "name": "captureToOrder", "trigger": "afterPaymentCaptured",
    "description": "Claim stock and flip the order to paid through the idempotent internal API.",
    "script": { "js": "await API.applyPaymentCapture({ orderId: resource.orderId, paymentReference: resource.providerIntentId, providerIntentId: resource.providerIntentId })" } },
  { "name": "failedToOrder", "trigger": "afterPaymentFailed",
    "description": "paymentStatus=failed while still placed.",
    "script": { "js": "await API.recordPaymentFailed({ orderId: resource.orderId })" } },
  { "name": "refundedToOrder", "trigger": "afterPaymentRefunded",
    "description": "Converge paymentStatus to refunded when the provider confirms.",
    "script": { "js": "payment ? await API.recordPaymentRefunded({ orderId: payment.orderId, refundReference: resource.providerRefundId }) : null" } }
]
```

Two more triggers close the mirror (#6496; framework notices, fired by the
nodejs and dotnet targets; java maps them but does not fire them yet, #6564): `afterPaymentStarted` runs once when a start (the
`/v1/start<order>payment` route or a `PaymentAction` start / simple)
records a NEW intent on the ticket, before any synchronous capture hook; a
resumed open intent (`pendingIntentReused: true`) does not run it again.
`afterPaymentAmountMismatch` runs once when a capture is refused into
`amount_mismatch`, on every path that writes it, and never again on a replay.
Both deliver a `NormalizedIntent` with `resource.orderId` = the ticket's
order; the mismatch one also carries `resource.metadata.amountMismatch`
(both figures). Write "under review, do not pay again" on the order there,
never paid or failed:

```json
  { "name": "startedToOrder", "trigger": "afterPaymentStarted",
    "script": { "js": "await API.recordPaymentStarted({ orderId: resource.orderId, providerIntentId: resource.providerIntentId })" } },
  { "name": "mismatchToOrder", "trigger": "afterPaymentAmountMismatch",
    "script": { "js": "await API.recordPaymentUnderReview({ orderId: resource.orderId, amountMismatch: resource.metadata?.amountMismatch })" } }
```

A third notice (nodejs target only) is the push signal of a capture the order
no longer expected: `afterPaymentCapturedAfterCancel` runs once per capture
the framework records on a payment the order left behind (an iyzico hosted
form a start retired, a superseded 3-D Secure step) or on the payment a
`canceled` ticket records, from every path that records one (the returns,
the form webhook, a refresh or the review sweeper, the provider webhook, the
retired-form expiry backstop). `resource` is the CAPTURED payment and
`resource.metadata.lateCapture` carries `case` (`capturedAfterCancel`: the
order was not paid and sits in the `captured_after_cancel` review;
`paidTwice`: the order was already paid, refund this one; `pending`: listed
beside an attempt still being decided, a start claim or an attempt the
provider holds for its review; when it is decided the hook runs once
more with `resolves: 'pending'` and the decided case), `origin`, `orderId`, `ticketId`, `paymentId`, `amount`,
`currency`, `capturedAt` and `source`. It moves nothing and refunds nothing:
hand it to an operator, never mark the order paid or refunded from it:

```json
  { "name": "lateCaptureToOps", "trigger": "afterPaymentCapturedAfterCancel",
    "script": { "js": "await API.openPaymentReviewTask({ orderId: resource.orderId, lateCapture: resource.metadata?.lateCapture })" } }
```

The rules the ontology fixes, which specs routinely get wrong:

- **A hook `script` is ONE EXPRESSION.** `script` and `condition` are MScript
  slots and MScript is expression-only: two statements separated by `;` are
  refused at design time with `INVALID_MSCRIPT_SYNTAX` ("multi-statement
  scripts are not supported — an MScript must be a single expression"). The
  three hooks above are each one `await API.<name>({...})` call, and that is
  the shape to aim for. A ternary (`payment ? await API.x(...) : null`) and
  an inline IIFE (`(async () => { … })()`) both validate — but reach for the
  IIFE only to sequence two awaits you cannot avoid. **Anything with real
  logic belongs inside the called internal API, not in the hook**: a capture
  that has to decide between claiming stock, cancelling, and issuing a refund
  (the orphan / sold-out / late-expired capture of section 5) is a workflow
  with conditions, context and a `RefundAction` — none of which exists in a
  hook slot. The hook stays the one-line delegation; `applyPaymentCapture`
  carries the decision.
- **Bare identifiers.** The body is spliced verbatim: `resource`,
  `event`, `payment`, `LIB`, `API` — never `this.resource`. `this.dispute`
  is the one `this.` name (dispute triggers).
- **`resource` is typed PER TRIGGER** and a field outside its interface is
  refused at design time (`LIFECYCLE_HOOK_UNKNOWN_RESOURCE_FIELD`):
  `afterPaymentCaptured` / `afterPaymentFailed` (and `afterPaymentCanceled`,
  `afterPaymentStarted`, `afterPaymentAmountMismatch`,
  `afterPaymentCapturedAfterCancel`) deliver a
  `NormalizedIntent` — `orderId`, `providerIntentId`, `statusLiteral`,
  `amount`, `currency`, `customerId`, `paymentMethodId`, `failureReason`,
  ...; `afterPaymentRefunded` delivers a `NormalizedRefund` —
  `providerRefundId`, `providerIntentId`, `statusLiteral`, `amount`,
  `currency`, `reason`, `failureReason`, `metadata` — and NO `orderId`.
  So the captured/failed hooks take `orderId: resource.orderId`, and the
  refunded hook takes it from the loaded ticket row: `payment.orderId`
  (`payment` = the `sys_<Order>Payment` row; `order` is its deprecated
  alias). A spec's `resource.refundId` or `resource.id` does not exist:
  the normalized resource never has an `id`; provider-side ids are the
  `provider...Id` members, and `payment.id` is the TICKET id, not the
  order id.
- **Guard the row** (`payment ? ... : null`) — it can be null for an event
  this service does not own.
- **`API.<name>` is exact and case-sensitive** and only
  `hasInternalCallController` APIs are members; the called API's own
  hooks may run but cannot make further `API.*` calls (depth one). A
  non-2xx from the called API raises a typed error into the
  `PaymentLifecycleHookFailed` log (#4089) — it never resolves as data.
- **Hook failure does not roll back the state transition** and the event
  still settles; the log is the operator's reconciliation point. Design
  the called API so a replay converges (section 5).
- **Static checks read literal syntax only** — spell `resource.orderId`
  out; a computed member or a spread is NOT CHECKED, not checked-and-clean.
- Warning after the merge on a nodejs project:
  `PAYMENT_LIFECYCLE_HOOK_NOT_LOWERED` x N — informational (lowered lane),
  not a defect.

## 7. The refund saga and its limits

`RefundAction` (store `refundActions`, on any Business API of the order
object) issues a full refund when `refundAmountProperty` is absent, a
partial one when it is set (the provider must advertise
`supportsRefundsPartial`); it writes the `sys_<Order>Refund` row and
advances the ticket. Its fields: `providerName` (optional — falls back to
the object's checkout block), `paymentIntentIdProperty` (REQUIRED,
PropRefer resolved against the request context), `refundAmountProperty`,
`reasonProperty`. Plus the base-action fields the pilot used:
`condition`, `contextPropertyName`, `onActionError`, `description`.

Where the pilot placed refunds, and how the PropRefer path is spelled in
each context:

| API | Placement | `paymentIntentIdProperty` |
|---|---|---|
| `cancelMyOrder` (`update`, `POST /my-orders/:orderId/cancel`, `ownershipCheck: true`) | `afterCheckInstance: [guardPaidUnshipped]` (`status === 'paid' && paymentStatus === 'succeeded'`, 422, static message), data clause `status: 'cancelled'`, `cancelReason: 'customer_request'`, `paymentStatus: 'refund_pending'`; `afterMainUpdateOperation: [refundFull, loadLines, releaseStock, emitCancelled]` | `order.paymentReference` (the loaded row) |
| `applyPaymentCapture` sold-out / late-expired tails | conditional, `afterMainUpdateOperation` | `providerIntentId` (a request parameter) |
| `sweepPendingRefunds` (`list`, cron `*/5 * * * *`, `fullWhereClause: { paymentStatus: 'refund_pending', refundEscalated: false }`, page 50) | a `loopActions` entry (`loopItemName: pendingOrder`) running `retryRefund` (`onActionError: completeApi`), an `updateCrudActions` bump (`dataClause` items are `{ dataProperty, dataValue }`, `whereClause: { id: pendingOrder.id }`), then at attempt N `markEscalated` + `emitEscalated` | `pendingOrder.paymentReference` (the loop item) |

Limits you design around (all pilot-verified):

- **No idempotency-key field on `RefundAction`.** A spec's
  `refund:<orderId>:cancel` key is not expressible; idempotency rests on
  the ticket state machine, `idempotencyStrategy`, and the provider (an
  already-refunded intent answers success). Keep explicit keys only where
  they ARE a contract — the catalog's `claim:<orderId>` / `release:<orderId>`.
- **The refund is issued AFTER the row is cancelled** (post-main), so the
  order reads `refund_pending` until `afterPaymentRefunded` converges it
  to `refunded` (section 6) — the sweep exists for the gap. Never
  re-release stock from the sweep.
- **`PARAM_UNUSED` is blind to PropRefer reads**: a parameter consumed
  only through `paymentIntentIdProperty` is reported unused; a real read
  in the action's `condition` (`!!this.providerIntentId`) silences the
  false positive.
- **`ValidationAction.description` is REQUIRED** and its `errorMessage`
  is static; `errorStatus` is a string (`"422"`) drawn from a CLOSED
  nine-value set — `"400"` | `"401"` | `"403"` | `"404"` | `"409"` |
  `"422"` | `"429"` | `"500"` | `"503"`. The one a payment flow reaches
  for and does NOT get: `"402"` (payment required). Map a checkout-start /
  payment-precondition failure to `"422"`; a membership or provider
  outage that clears on its own is `"503"` (answered as
  `SERVICE_UNAVAILABLE`, the authored message kept) and a rate or quota
  refusal is `"429"` (`TOO_MANY_REQUESTS`). Callers RETRY both, so never
  use either for a permanent refusal; do not spend a dry-run rediscovering
  this.
- The pattern also mounts `POST /v1/<order>refundpayment/:orderId`
  (session + owner gated) — the raw ticket refund. Your business rule
  (cancellable only while paid and unshipped, stock release, the event)
  lives in YOUR API with the `RefundAction`; do not point the frontend at
  the raw route when a business rule exists.

## 8. Events and the notification bindings

**Topics are authored BARE.** `PublishEventAction.topic` is project-scoped
on the wire as `<projectCodename>-<topic>` (#3880); a spec that writes the
full wire name must be authored without the codename or it double-prefixes.
Pilot topics (`<service>-service-<event>` style, all bare):
`order-service-cart-checkedout`, `order-service-payment-captured`,
`order-service-order-shipped`, `order-service-order-delivered`,
`order-service-order-cancelled` (two producers: `cancelMyOrder` and the
sold-out tail, distinguished by `cancelReason`), `order-service-order-expired`
(per actually-expired row, condition on the conditional update's result),
`order-service-refund-escalated`. `message` is an MScript object literal in
parentheses — `({ orderId: this.order.id, ... })` — carrying every field
the templates and targets will read (`customerUserId`, `customerEmail`,
`orderNumber`, `totalAmount`, `currency`, `items[]`, `staffUserIds[]`).

**Notification bindings** (`notifications-blueprint.md` is the procedure;
Phase 4, after the BFF): `eventDataSettings.channel` is the SAME bare
declared name (`"order-service-payment-captured"`) — the framework scopes
producer and consumer with one helper; the event-bus chapter
(`openappl/compiler/07-event-bus.md`) gives the wire names. Targets are rooted at the
RECORD (the unwrapped `data`), never `data.`-prefixed:
`{ targetKind: "userId", targetPathInData: "customerUserId" }` for the
buyer, `{ targetKind: "userId", targetPathInData: "staffUserIds", isArray: true }`
for staff alerts (recipients resolved at publish time by the producer —
the admin-recipient canon — never `customerUserId` for a staff mail).
When the payload carries everything, leave `dataViewName` unset. The
pilot bound seven: orderPlaced + newOrderStaffAlert (checkedout),
paymentReceived (captured — the producer publishes it only on the
succeeded-claim branch, so no condition needed), orderShipped,
orderDelivered, orderCancelledRefund / orderCancelledSoldOut (one topic,
`condition` on `this.payload.cancelReason`), refundEscalatedToStaff. No
mail on `order-expired` (spec ruling) — a topic with no listener is fine.

## 9. Validate

**Design-time gate.** `mind-set validate blueprint.json` for the structure,
then the semantic validation of an OpenAPPL validation tool or compiler when
one is available, at zero errors (say plainly when only the structural check
ran); expected warnings on the pilot: `PAYMENT_LIFECYCLE_HOOK_NOT_LOWERED` x3
and `CART_ACTION_ON_NON_CART_OBJECT` x1 - both deliberate. Then check the
derived routes (`openappl/compiler/05-business-apis.md`, section 5.3): no two
APIs resolve to the same `(METHOD, routePath)`, the disabled cart routes are
absent, the payment routes present. Errors you may meet and their one
fix: `PAYMENT_NOT_CONFIGURED` (stage order, section 4);
`INTERNAL_API_NOT_FOUND` (hooks merged before their APIs, or a case
variant of the name); `API_ONNOTFOUND_TRANSPORT_UNSUPPORTED`
(`throw404`); a missing `description` on a `ValidationAction`;
`UPDATE_WRITES_NOTHING` (`contractOnly`); `STALE_ALIAS_READ_AFTER_MAIN_UPDATE`
(pre-capture into context); `FETCH_MATCH_VALUE_WITHOUT_LOCAL_KEY`
(a `FetchObjectAction` / `FetchStatsAction` with `matchValue` but no
`localKey`).


**Card-data rule (fw #4474).** Never send real card data — not to the
auth service's `paymentmethods` route, not in `paymentUserParams`, not in
a fixture. A mock provider settles without a card; where a
`paymentMethodId` is needed use a provider TEST token, never a PAN. The
auth service's `paymentmethods` route refuses a `cardInfo` that carries a
card number or a security code (400 `RawCardDataCantBeStored`, #4474): it
stores tokens only. Saving a card is the generated payment service's
`POST /v1/payment-methods/add` (do not hand-add one): a token as
`paymentMethodId`, or on a provider that tokenizes server-side (iyzico) the
card as `cardInfo`, which the route hands to the provider and persists as
token + descriptors. `customerId` may be omitted there: the route resolves
the caller's own provider customer, creating it on first use (#6345).


## 10. Report

The lane report names: the objects and APIs written against the spec
inventory (machine diff), the two-stage activation as executed, every
deviation from the spec with its reason (the orientation fix, the
Redis-first substitution, `throw404`, the static messages, the missing
idempotency key, the hook-argument corrections), the validator's final
error/warning counts with each warning judged (and which validation ran),
and the derived-route check.
