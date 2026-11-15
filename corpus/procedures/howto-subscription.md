# How-to: a recurring pass - subscription, plan catalog, quota ledger

Harness-agnostic. The second pattern how-to, written in the shape of
`howto-payment-flow.md` (read its sections 4 to 6 first: the two-stage
activation and the lifecycle-hook rules apply unchanged). The catalog says
WHICH pattern (`subscription`, `ledgerSettings`); `blueprint-authoring.md`
says how to write any service; this document says how a recurring pass is
ASSEMBLED and VERIFIED so the first build validates and the first subscribe
works without discovering the contract by dry run. Every claim below was
checked against the pattern ontology (`Subscription`, `SubscriptionConfig`,
`SubscriptionAction`, `LifecycleHook`, `PaymentLifecycleTrigger`,
`LedgerConfig`, `LedgerGeneratedApis`, `LedgerApiBinding`) and against the
emitted code (`SubscriptionAction`, the admin router, the subscription
machine). The pattern pages (`openappl/spec/<Pattern>.md`) outrank this
document.

**Task shape.** The spec (`service-spec-<serviceName>`) describes a pass or
membership that recurs: a member picks a plan, pays on the provider's
billing cycle, is granted an allowance (visits, credits, seats) for each
period, spends it, and may cancel. You author ONE service that carries the
domain plan and subscription objects, opts the subscription object into
`subscription`, and wires the lifecycle into a quota ledger, then you
validate the blueprint before reporting.

**Prerequisites.** A payment provider declared in the project settings whose
capabilities include `supportsSubscriptions`; you reference it by its
`name`. Read `blueprint-authoring.md` first.

**Read `SubscriptionConfig` from the right side.** Its field docs are
written from the TOKENIZED-provider viewpoint (Adyen-style: the framework's
recharge scheduler charges a stored method each cycle, hence
`maxDunningAttempts`, `dunningExhaustedState`, `storePaymentMethod`). A
recurring pass on a HOSTED provider (iyzico, Stripe, Paddle, PayPal: the
provider owns the billing cycle) uses `providerName`, `planProperty`,
`customerProperty`, `statusProperty`, `trialDaysProperty`,
`cancelAtPeriodEndProperty`, `lifecycleHooks` and, when the injected
routes need a role gate, `checkRoles` / `routeAccess`. Leave the dunning
fields unset on a hosted provider: they are ignored there.
`storePaymentMethod` is an optional opt-in on hosted providers too: Stripe
and iyzico use it while enrolling a method, and EVERY provider uses it as
the retention gate for the webhook method mirror. Leave it off unless the
spec calls for retaining the buyer's payment method; read the
`SubscriptionConfig.storePaymentMethod` description of its pattern page
(`openappl/spec/SubscriptionConfig.md`) for the provider path.

---

## 1. What you author vs what the pattern emits

| You author | The pattern emits (never hand-add) |
|---|---|
| The domain plan object (`membershipPlan`: code, name, price, allowance per period) and its seed rows | `sys_<X>SubscriptionPlan` (the PROVIDER plan catalog, one row per `(code, providerName)`), `sys_<X>Subscription` (the subscription journal), `sys_<X>SubscriptionInvoice`, `sys_paymentEvent` |
| The domain subscription object (`memberSubscription`: member, `planCode`, a provider-vocabulary status column, period dates) with `objectSettings.subscription` | `POST /v1/subscribe<x>/:orderId`, `DELETE /v1/<x>subscription/:subscriptionId`, `PATCH /v1/<x>subscription/:subscriptionId`, the webhook route `POST /v1/payments/webhook/:providerName`, `POST /v1/payments/admin/plans/provision`, `GET /v1/payments/mock-status` |
| `seedData` rows for the plan catalog (section 3) | The provisioning sweep that writes `providerPlanId` back |
| The internal hook APIs and the `lifecycleHooks` (section 5) | The subscription state machine, the webhook verification, the event dispatcher |
| `ledgerSettings` on the allowance owner and the wrapper APIs that spend it (section 6) | The ledger tables and the internal `API.<earn|consume|...>` calls |
| A cron-triggered business API that refreshes the allowance (section 7) | Nothing: the framework does not grant quota |

Alternative to the injected routes: a designer-authored Business API with a
`SubscriptionAction` (`stage: "subscribe"`) when the subscribe must also
create the domain row in the same call. Its `planProperty` is read as in
section 2; set it on the action itself unless the target generator is
nodejs (the inherited fallback is not universal; the ontology says which).

## 2. The binding vocabulary - two traps

`objectSettings.subscription` is `{ "objectIsSubscriptionObject": true,
"configuration": { ... } }` at
`services/<name>/dataObjects/<object>/objectSettings`.

| Binding | Bind it to | The trap |
|---|---|---|
| `planProperty` | a String column that holds the plan **code** (`"pro-monthly"`) | NOT a foreign key to your domain plan table. The subscribe stage resolves the reference against the generated `sys_<X>SubscriptionPlan` catalog, scoped to the bound provider, trying the row `code`, then `providerPlanId`, then the catalog row id. A domain plan row's id matches none of them: the subscribe is refused `409 SUBSCRIPTION_PLAN_NOT_FOUND` ("matches no sys_<X>SubscriptionPlan row for provider ..."). Store the code on the subscription (and keep it as the domain plan's natural key). |
| `statusProperty` | a **dedicated String column** for the provider-status mirror | Keep it separate from the domain status. The framework mirrors `trialing`, `active`, `past_due`, `paused`, `canceled`, `expired` after a journal status change and before lifecycle hooks (webhooks and tokenized recharges); framework-owned `pending_provider` and `provider_failed` are never mirrored. An Enum receives only matching options, so a domain enum such as `pending\|paid\|failed` receives no provider status. The journal has all eight states and stays authoritative: gate entitlement on its `active` state, or on `trialing` only when the spec grants a trial, and treat the mirror as a read model. |
| `customerProperty` | the owner/member column | Declarative on the raw route (the body carries `providerCustomerId`). |
| `trialDaysProperty` / `cancelAtPeriodEndProperty` | optional Integer / Boolean columns | Declarative: they set the initial `trialing` state / the cancel mode. |

A subscription spec's "status" words usually mix both vocabularies. Decide
the mapping once and write it down in the blueprint description: for
example, domain `active` = provider `active` or `trialing`; domain `lapsed`
= `past_due`, `paused`, `canceled`, `expired`.

## 3. The plan catalog - declare, seed, provision

A subscribe resolves its plan ONLY against `sys_<X>SubscriptionPlan`. That
table starts EMPTY, and the domain plan rows you authored are a different
table, so a first subscribe on a fresh deployment answers `409
SUBSCRIPTION_PLAN_NOT_FOUND`. The catalog is filled in two steps:

1. **Declare the design-time fields through the service's `seedData`**
   (the optional `seedData` chapter of the service, see
   `blueprint-authoring.md`). Match on the pair, never on `code` alone:

```json
{ "seedData": [ {
  "seedBasics": { "dataObject": "sys_memberSubscriptionSubscriptionPlan",
                  "matchBy": ["code", "providerName"], "insertOnly": [] },
  "values": [
    { "name": "code",         "value": "'pro-monthly'" },
    { "name": "providerName", "value": "'iyzicoPayments'" },
    { "name": "name",         "value": "'Pro (monthly)'" },
    { "name": "amount",       "value": "199" },
    { "name": "currency",     "value": "'TRY'" },
    { "name": "interval",     "value": "'month'" }
  ] } ] }
```

   The sys object's name is `sys_<objectName>SubscriptionPlan`, built from
   the subscription object's name as written in the blueprint (an object
   `memberSubscription` gets `sys_memberSubscriptionSubscriptionPlan`). Seed ONLY design-time fields (`code`, `providerName`,
   `name`, `amount`, `currency`, `interval`, `intervalCount`, `trialDays`).
   **Never seed `providerPlanId`**: only the provider can produce it, it
   differs per environment, and the seed writers drop it anyway. Seeds are
   applied at service start, so a seed change needs a rebuild/redeploy of
   the service before it is visible.
2. **Provision once per environment**: `POST /<service>-api/v1/payments/admin/plans/provision`
   as a PLATFORM operator (`superAdmin`, `admin` or `saasAdmin`; the whole
   `/v1/payments/admin/*` console is platform-scoped). For every catalog row
   with no `providerPlanId` it calls the provider's `createPlan` and writes
   the id back. It answers `200` with a per-catalog report
   (`catalogs[]` with `provisioned`, `adopted`, `reclaimed`, `skipped`,
   `failed`, and `totals`), even when single rows failed. On a mock payment
   transport it provisions mock plan ids; no credentials are needed.

**Read the report, do not trust the 200.** Check `rowsExamined` at the top
level and in each `catalogs[]` entry. `rowsExamined: 0` means the sweep found
NO ROWS; the top-level `hint` and each empty catalog's `hint` explain how to
seed it (step 1 not applied, wrong `dataObject` name, or the service was not
redeployed after the seed change). It is not provisioning success. The refusal order of a
subscribe is: `400 SUBSCRIPTION_PLAN_REQUIRED` (the bound column is empty)
-> `409 SUBSCRIPTION_PLAN_NOT_FOUND` (no catalog row: seed it) -> `409
SUBSCRIPTION_PLAN_NOT_PROVISIONED` (row exists, no provider id: provision
it). Each names the plan reference.

## 4. Activation order - the two-stage recipe transfers

`howto-payment-flow.md` section 4 explains why hooks come last, and it
transfers to subscriptions unchanged: `lifecycleHooks` are statically
checked for every `API.<name>` they call (`INTERNAL_API_NOT_FOUND` /
`INTERNAL_API_NO_CONTROLLER` while the hook-target API does not exist). So:

1. Write the domain objects, the ledger, and the
   `objectSettings.subscription` block **without** `lifecycleHooks`
   (an edit of `blueprint.json` at `.../<object>/objectSettings`).
2. Author the hook-target APIs (internal, fully parametric, idempotent:
   `howto-payment-flow.md` section 5) and the wrapper APIs of section 6.
3. Merge `lifecycleHooks` into `objectSettings.subscription.configuration`
   LAST, then validate.

## 5. The lifecycle hooks - what to grant, and when

Subscription triggers: `afterSubscriptionCreated`,
`afterSubscriptionRenewed`, `afterSubscriptionPaymentFailed`,
`afterSubscriptionPastDue`, `afterSubscriptionCanceled`. A hook script sees
`event`, `resource` (the normalized subscription) and `subscription` (the
`sys_<X>Subscription` journal row); there is no session and no request, so
the hook calls an internal API with every value passed explicitly
(`await API.grantPeriodAllowance({ memberId: ..., idempotencyKey: ... })`).
A failing hook does not roll back the state change: it is logged as
`PaymentLifecycleHookFailed`. Derive the idempotency key from the business
fact (`sub:<providerSubscriptionId>:<periodStart>`), never from an attempt
counter, because the dispatcher can replay an event.

- On iyzico, `afterSubscriptionCreated` fires for an ACTIVE confirmation.
  Its subscribe answers `pending_provider` (the buyer
  pays on the hosted form, `howto-payment-flow.md` section 1). The hook runs
  when the return route confirms it, not at the subscribe call, and a
  return that reports another status (`trialing`, `past_due`) runs NO
  created hook: grant nothing for it, and decide in the spec what a trial
  gets. Grant the FIRST period's allowance here, or a new member
  has zero until the first renewal.
  On Stripe, `afterSubscriptionCreated` alone is NOT proof of payment:
  an `incomplete` first payment reads `past_due`. Grant only when the journal
  is `active`, via `afterInvoicePaid` / `afterSubscriptionRenewed`; keep the
  same period idempotency key across the eligible hook paths.
- `afterSubscriptionRenewed` grants each following period's allowance.
- `afterSubscriptionCanceled` / `afterSubscriptionPastDue` revoke or freeze
  it.

## 6. Quota and the ledger

A quota is a `ledgerSettings` balance on the owner (`LedgerConfig`,
`patterns-catalog.md`: never hand-build one). The five mutating roster
APIs (`earn`, `consume`, `reserve`, `commitReservation`,
`releaseReservation`) are INTERNAL-CALL ONLY by default (`rest: false`): you
reach them from hooks and wrapper APIs as `API.earn<Ledger>({...})`, not
over HTTP. Do not flip a mutation to `rest: true` to "make it reachable":
it is a mint/burn surface and raises `LEDGER_REST_MUTATION_UNGATED` without
`checkRoles`. A member spends through a wrapper API that resolves the owner
from the session and calls the internal API with explicit parameters.

On nodejs and rust, a wrapper (and, on nodejs, a hook) that has a caller
session and calls a ledger API on a tenant-scoped owner object must pass it as the optional
second argument: `await API.<name>(params, { session: this.session })`. This carries
the caller's tenant; `ownerId` and operation inputs remain explicit.
Omitting the argument leaves the session null and preserves the existing
asSystem behavior, with no inheritance through AsyncLocalStorage or the
running manager. Role and ownership gates remain bypassed even when a
session is supplied, so the wrapper must enforce the caller's access.
Provider webhook hooks with no session keep their explicit-param calls.
Other language targets retain the sessionless signature.

- `idempotencyKey` is REQUIRED on `earn`, `consume`, `reserve`; a replay
  returns the original result with `alreadyProcessed: true`, never a 409.
- **Zeroing an allowance** (period end, cancel, plan change) is a `consume`
  of the remaining balance, with a key derived from the period. `adjust` is
  an operator correction and is OFF by default (`emit: false`); enable it
  deliberately (`generatedApis.adjust.emit: true`) and, if you also bind it
  to REST, name a role in `checkRoles`. It is not the lapse mechanism.
  A lane that probes `adjust` on a default ledger gets 404: it was never
  emitted.
- Expiry of unused lots is the ledger's own `expiry` section, not a
  subscription concern: decide whether an allowance rolls over (lots with
  no expiry) or lapses (period-length expiry) in the spec's terms.

## 7. Renewal versus charging

For a HOSTED provider the provider owns the billing cycle: it charges the
member, then tells the service by webhook, and the subscription machine
advances the journal and fires `afterSubscriptionRenewed`. A `renewDue*`
cron you author **refreshes the allowance; it never charges**. Two
consequences the pilot learned:

- A spec that "earns quota on renewal only" leaves every NEW member with
  zero until the first renewal: grant the first period in
  the provider's eligible lifecycle hook (section 5).
- The cron is a safety net for a missed webhook, not the source of truth:
  make it idempotent on the same period key the hook uses, so a hook and the
  cron cannot grant twice.

For a TOKENIZED provider (Adyen) the framework's recharge scheduler charges
the stored method each cycle and records the charge on the payment ticket;
the dunning fields of `SubscriptionConfig` apply there, and the lifecycle
hooks fire the same way.

## 8. Validate

Validate the blueprint after every module you touched: `mind-set validate
blueprint.json` for the structure, then the semantic validation of an
OpenAPPL validation tool or compiler when one is available (it reports
`INTERNAL_API_NOT_FOUND` / `INTERNAL_API_NO_CONTROLLER` for a hook whose
target API is missing). Say plainly when only the structural check ran.

## 9. Report

Report the plan codes seeded, the status mapping decision of section 2, the
allowance policy (roll over or lapse), which validation ran and its result,
and every deviation from the spec.
