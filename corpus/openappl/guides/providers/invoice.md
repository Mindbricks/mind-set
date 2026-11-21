---
title: "Invoice providers: behaviour rules"
---

# Invoice providers: behaviour rules

`objectSettings.invoicing` makes a data object invoice-bearing: the generated
service gets an immutable accounts-receivable ledger, a numbering sequence, a
draft -> open -> paid state machine, payment allocation against the payment
family, and the REST and workflow surface to drive it. An entry of
`projectSettings.invoiceProvidersSettings.invoiceProviders[]` answers one
question: **who is the system of record** for that object's invoices. This page
states what a conforming compiler must make the generated service do.

The configuration keys of every brand and which are secret are in the
generated [invoice provider catalogue](../../spec/providers/invoiceProvider.md);
this page does not repeat them. See also
[The invoice to fiscalization chain](../capabilities/invoice-fiscalization-chain.md),
[Intermediation vs reseller billing](../capabilities/intermediation-vs-reseller-billing.md),
[fiscal providers](fiscal.md), [payment providers](payment.md),
[InvoicingConfig](../../spec/InvoicingConfig.md),
[InvoiceLineRelation](../../spec/InvoiceLineRelation.md),
[InvoiceCapabilities](../../spec/InvoiceCapabilities.md),
[InvoiceAction](../../spec/InvoiceAction.md) and
[InvoiceLifecycleHook](../../spec/InvoiceLifecycleHook.md).

## Family rules

### Four concepts

| Concept | What it is | Where it lives |
|---|---|---|
| Invoice | the commercial receivable; works on its own, without any provider | `objectSettings.invoicing` + the injected ledger |
| InvoiceProvider | the system of record for the invoice lifecycle; an optional execution strategy | `invoiceProviders[]`, `internal` by default |
| Fiscalization | the process of adapting an invoice to a tax regime | `objectSettings.fiscalization` (see [fiscal providers](fiscal.md)) |
| FiscalProvider | the integrator and the government network behind it | `fiscalProviders[]` |

Fiscalization stays a separate opt-in: in some regimes the fiscalized thing is
transaction data, and the fiscal integrator is chosen independently of the
invoicing system of record.

### Principles

- **The provider changes the system of record, not the pattern.** An
  invoice-bearing object behaves identically whether the ledger lives locally
  or in an external system: the same routes, lifecycle hooks and ledger
  mirror tables. Binding a provider delegates the same conceptual API.
- **Internal by default; absence is not a special case.** With no provider
  bound the built-in `internal` provider (a full implementation of the
  provider contract over the generated ledger) is implicitly selected. There
  is one code path; `internal` is just the provider chosen.
- **Capabilities are bound, not brands.** A company that both moves money and
  issues invoices is one entry in `paymentProviders[]` and a separate entry in
  `invoiceProviders[]`; cross combinations (an external accounting system of
  record with a local payment provider) are the expected shape. An invoicing
  entry of a brand is a separate account entry from a payment entry of the
  same brand and never shares its credentials.
- **The ledger is written only by the lifecycle.** The data object stays the
  freely editable domain surface; every lifecycle write (finalize, numbering,
  allocation, totals) goes through the generated lifecycle, never through a
  REST update a buyer could reach.
- **No silent money defaults.** An unresolvable amount binding is refused with
  a typed 4xx naming the field, never invoiced as zero.

### Resolving the binding

An invoicing object resolves its provider in this order:

1. its own `configuration.providerName`;
2. the project's single declared entry, when exactly one exists (with several,
   bind explicitly);
3. the implicit `internal` provider, synthesized by the compiler.

An explicit `internal` entry is needed only for a named internal series next
to other providers.

### Native and bridge brands

- **Native** brands are cloud APIs: the entry owns its credentials in
  `configuration[]`.
- **Bridge** brands (`sap`, `dynamics365`, `netsuite`, `logoTiger`) are
  customer-hosted platforms: the entry names an enterprise integration through
  `integrationName` and carries no credentials of its own; the bridge that
  already holds the platform credentials owns connectivity. A non-empty
  `configuration` on a bridge entry WARNS `INVOICE_PROVIDER_BRIDGE_CONFIG_IGNORED`.
- Secret keys are masked in API answers. There is no `{ "secretName": ... }`
  reference syntax for invoice entries: a secret is left blank in the blueprint
  and supplied at deploy time; a blueprint value, when present, is delivered as
  the deploy secret verbatim.

### Validation

- `name` is a unique `codeName`.
- Missing required keys on a native entry: `INVOICE_PROVIDER_MISSING_CONFIG`
  (error); unknown keys: `INVOICE_PROVIDER_UNKNOWN_CONFIG` (warning).
- A bridge brand without `integrationName`: `INVOICE_PROVIDER_MISSING_INTEGRATION`
  (error); a native brand with one: `INVOICE_PROVIDER_UNEXPECTED_INTEGRATION`
  (error).
- A `providerName` that resolves to no entry: `UNKNOWN_INVOICE_PROVIDER`
  (error). A null `providerName` is valid and binds `internal`.
- A source object without an owner column: `INVOICE_OWNER_UNBINDABLE` (warning,
  below).

### Capabilities

Defaults derive from the brand; an entry's `capabilities` only narrows them,
and the adapter refuses a call outside the advertised set with a typed
capability error (400).

| Capability | internal | stripe | ERP bridges | logoIsbasi | parasut | mikro |
|---|---|---|---|---|---|---|
| `supportsFinalization` | yes | yes | yes | yes | yes | yes |
| `supportsCollection` | no | yes | no | no | no | no |
| `supportsCreditNotes` | yes | yes | yes | yes | yes | yes |
| `supportsPartialPayments` | yes | yes | yes | yes | yes | yes |
| `supportsCustomerBalance` | no | yes | yes | yes | yes | yes |
| `supportsVoid` | yes | yes | yes | yes | yes | yes |
| `supportsPdfRendering` | no | yes | no | yes | yes | no |
| `supportsNumbering` | yes (local sequence) | yes (provider owns the number) | yes | yes | yes | yes |
| `webhookStyle` | `none` | `hmac` | `none` (poll) | `none` (poll) | `none` (poll) | `none` (poll) |

- `supportsCollection` is collection automation (charging a stored payment
  method, dunning). Recording a payment against an invoice (`applyPayment`) is
  ungated core: every ledger can do it.
- Only `internal` and `stripe` have adapters; the other brands are declarable
  ahead of their adapters. A compiler refuses a construct it does not
  implement.

## The data model

### Domain surface and ledger

| Layer | Owner | Role |
|---|---|---|
| the data object (order, contract, ...) | designer | **domain surface**: free schema, CRUD, UX and MScript; feeds the flow and receives results through mirrors (`statusProperty`); never the financial record |
| `sys_<X>Invoice`, `sys_<X>InvoiceLine`, `sys_<X>CreditNote`, `sys_<X>InvoicePayment` | compiler | **financial ledger**: fixed schema; written by the lifecycle only, so the object's update API can never touch `amountPaid` and a buyer can never forge a status or total |
| the lifecycle and the provider adapter | compiler | the state machine, allocation arithmetic, numbering and provider delegation |

### Injected tables

Per opted-in object `X`:

| Table | Role | Key columns |
|---|---|---|
| `sys_<X>Invoice` | invoice header | `invoiceNumber`, `series`, `customerId`, `providerName`, `providerInvoiceId`, `issueDate`, `dueDate`, `currency`, `subtotal`, `taxTotal`, `total`, `amountPaid`, `amountRemaining`, `statusLiteral`, `sourceObjectId`, `metadata`, `ownerId` |
| `sys_<X>InvoiceLine` | immutable line snapshot | `invoiceId`, `description`, `quantity`, `unitPrice`, `lineTotal`, `discountAmount`, `vatRate`, `vatAmount`, `finalTotal`, `sourceObjectId`, `vatExemptionReasonCode`, `vatExemptionReason` |
| `sys_<X>CreditNote` | credit note against an invoice | `invoiceId`, `providerCreditNoteId`, `amount`, `currency`, `reason`, `statusLiteral` |
| `sys_<X>InvoicePayment` | **allocation**, the invoice-payment N:M bridge | `invoiceId`, `paymentIntentId`, `externalPaymentRef`, `amountApplied`, `appliedAt` |

Once per service: `sys_invoiceSequence`, the numbering counter per
`(series, year)` with a unique composite index, incremented atomically at
finalize. With an external webhook provider bound, a `sys_invoiceEvent` outbox
is injected too.

- `sys_invoiceSequence` is injected regardless of the provider (design time
  does not resolve capabilities); the run time decides whether to use it.
- The four per-object tables are private, soft-deleting, and carry `ownerId`,
  stamped from the source row's owner column (`sessionSettings.isOwnerField`)
  at creation. Without an owner column every invoice has `ownerId: null`: no
  customer can read them (the document route answers
  `403 OWNER_UNRESOLVED_LEGACY`, the owner-filtered list is empty), only
  operator callers see them. A compiler never guesses an owner column.
- The per-object tables take their tenancy from the effective source object
  (`configuration.sourceObjectName`, or the invoicing object itself): a
  service-level source has a service-level family without a tenant column, a
  tenant-level source keeps its required tenant column; each object resolves
  its own scope. A subscription-bearing object keeps the tenant-level family
  and reports `INVOICE_SUBSCRIPTION_TENANCY_UNPROJECTED` when its source is
  service-level.
- `sys_invoiceSequence` and `sys_invoiceEvent` are service-level and ownerless:
  one `(series, year)` counter serves every tenant; per-tenant series are not
  supported. No customer reads the counter; it is exposed only to admins and
  operators.
- Normalized invoice `dueDate` and `issuedAt`, and credit-note `issuedAt`, are
  UTC millisecond timestamps (`2026-10-18T12:34:56.789Z`). Missing or invalid
  invoice dates stay null; a credit note without a usable creation date uses
  `1970-01-01T00:00:00.000Z`.

**Sharing with the subscription opt-in.** The payment family's `subscription`
opt-in injects a narrow `sys_<X>Invoice` (per-period charges). With both
opt-ins on one object, invoicing enriches that same table in place (adding the
header fields, relaxing `subscriptionId` to nullable) instead of creating a
rival. A subscription-only object keeps the narrow schema unchanged; the legacy
`amount` stays the per-period charge while `total` is the invoicing-era total.

### Snapshot semantics

- `invoiceLineRelation` names the editable source of lines. The ledger lines are
  an **immutable copy**: later edits to the source never change an issued
  invoice. Reporting and allocation always read the frozen copy.
- The internal provider freezes the lines **when the draft is created** and
  derives `subtotal` / `taxTotal` / `total` from them; finalize assigns the
  number and issue date. A manually created draft freezes its lines when it is
  cut, not when it is later finalized.
- Unbound computed slots (`lineTotal`, `vatAmount`, `finalTotal`) are derived
  at snapshot time; a bound computed slot is validated against the derivation.
- Without a line relation, `amountProperty` gives a single-line total.

### Net and gross line prices

- By default a bound `unitPrice` is **net**: `lineTotal = quantity x unitPrice
  - discountAmount`, `vatAmount = lineTotal x vatRate/100`,
  `finalTotal = lineTotal + vatAmount`.
- `invoiceLineRelation.pricesIncludeVat: true` prices the line **gross-first**,
  each step rounded to 2 decimals:

  | step | value |
  |---|---|
  | gross | `quantity x unitPrice - discountAmount` |
  | `lineTotal` (net) | `gross / (1 + vatRate/100)` |
  | `vatAmount` | `gross - lineTotal` |
  | `finalTotal` | `gross` |

  120 at 20% is net 100 + VAT 20; 100 at 18% is net 84.75 + VAT 15.25. The
  net's half-up rounding is decided on the exact decimal quotient, the same
  computation as the cart: 1299.87 at 20% is exactly 1083.225, so the line is
  net 1083.23 + VAT 216.64 (a binary floating-point split, 1083.22 + 216.65, is
  refused as inconsistent).
- The frozen line stores `unitPrice` and `discountAmount` converted to net. The
  net discount is an amount (2 decimals); the net unit price keeps **8
  decimals** (100 at 18% freezes 84.74576271; 10.00 at 18% freezes
  8.47457627), so `quantity x unitPrice` matches the line's own net as a fiscal
  integrator checks it (7 x 8.47 = 59.29 would miss 59.32).
- `pricesIncludeVat` requires `vatRateProperty`
  (`INVOICE_LINE_VAT_INCLUSIVE_WITHOUT_RATE`). A relation that reads net prices
  in a service whose cart prices gross draws `INVOICE_LINE_VAT_CONVENTION_MISMATCH`.
  Without the flag, the same 120 is invoiced as 120 + 24 = 144.
- A relation-less invoice with `vatRateStaticValue` or `vatRateProperty` treats
  its amount binding as a VAT-inclusive gross, with the same arithmetic and
  8-decimal unit price (a charge of 100 at 18% invoices 84.75 net plus 15.25
  VAT and settles fully when 100 is applied), including a subscription cycle
  amount.
- A 0% line can carry why its VAT is zero: `vatExemptionCodeProperty` and the
  optional `vatExemptionReasonProperty` on the relation (or next to
  `vatRateProperty` on a relation-less object) are frozen on the line; they
  matter only to a fiscalized object (see
  [Zero-VAT lines](fiscal.md#zero-vat-lines-exemption-codes-and-the-invoice-type)).
- Amounts use decimal half-up rounding: a one-unit line at 1.005 totals 1.01.

### The invoice state machine

```
draft -> open            finalize (number + issue date)
draft -> voided          void
open -> partially_paid   partial payment applied
open -> paid             closing payment
open -> failed           collection attempt failed
open -> uncollectible    written off
open -> voided           void
partially_paid -> paid | uncollectible
failed -> paid | partially_paid | voided
uncollectible -> partially_paid | paid   payment arrives (re-opened)
uncollectible -> voided  bookkeeping close-out
```

- `paid` and `voided` are the only terminal states.
- **Finalize is the immutability gate.** Only a `draft` can be finalized;
  re-finalizing is a `409`, never a silent renumber. A finalized invoice is
  corrected with a credit note or a void, never edited.
- **Void refuses settled money.** A `partially_paid` or `paid` invoice cannot
  be voided; issue a credit note. A second void is a typed 409 before any
  ledger write, status mirror or `afterInvoiceVoided` hook.
- Whether a payment is partial or closing is amount arithmetic (`amountPaid`
  against `total`). Overpayment is a typed 400 (carrying it needs a
  customer-balance provider).
- Internal allocations and credit notes round amounts to 2 decimals before
  recording them; a normalized amount of zero is a typed 400 with no write
  (`0.004` refuses, `0.005` rounds half up to `0.01` and is valid).

### Numbering (internal provider)

- `series` scopes the counter (default key `INV`); several objects may share a
  series. `resetPeriod` is `never` (default), `yearly` or `monthly`.
- The number is `<prefix><period-><number padded to 6>`: with
  `{ "series": "A", "prefix": "INV-", "resetPeriod": "yearly" }` the first 2026
  invoice is `INV-2026-000001`; without a prefix the series key leads (`A-...`).
- The increment is one atomic operation; concurrent finalizes cannot collide
  and the unique index backs it up.
- A caller-assigned number (external numbering, migration) is honoured verbatim
  on finalize.
- An object bound to a provider that numbers itself (`supportsNumbering` on an
  external provider) gets the provider's number at finalize, copied verbatim;
  the local sequence is never incremented for it, and a caller-assigned number
  is a typed 400.

### Reads and writes

- Reads are owner-or-admin: `get<X>Invoice`, `list<X>Invoices`,
  `list<X>InvoiceLines`, `list<X>CreditNotes` and `list<X>InvoicePayments` are
  owner-scoped through `ownerId`; `admin` / `superAdmin` see everything.
- Writes on the ledger tables are admin-only debug surfaces, blocked from MCP.
  A login-only write route would let a buyer forge their own status or totals;
  the gate is a role, not ownership.

## Issue policies

`issuePolicy` declares when an invoice is created and finalized; the compiler
wires the trigger, the designer writes no glue.

- **`manual`** (default): only an `InvoiceAction` or the operator routes create
  and finalize.
- **`onPaymentCaptured`** (B2C): on an object with both `checkout` and
  `invoicing` that is its own invoice source (`sourceObjectName` null or self),
  every `payment.captured` event reaches the invoice lifecycle, which builds the
  draft from the source row (snapshotting the lines), finalizes it and applies
  the captured amount, normally landing in `paid`. A separate invoice object fed
  from another source is driven by `InvoiceAction` or the operator routes.
- **`onSourceCreate`** (B2B, invoice first): the committed create of the source
  row issues an open invoice with a due date (`dueDateProperty`); the later
  payment settles it through the payment bridge. No action is added. The
  handler is idempotent: a source row that already carries any invoice (voided
  included) is left alone. A consumer failure is logged and leaves the source
  create successful. Rows created by a bulk create (including reactivated rows)
  fire it; updated or skipped outcomes do not.
- **`issueCondition`** (MScript) is evaluated before any automatic trigger; a
  falsy result skips that event, and manual issuance stays available. Its
  `this` is a context object, **not the row**: its keys are `order` and
  `source` (both the source row) and `payment` (the payment ticket on
  `onPaymentCaptured`, `null` on `onSourceCreate`). `this.customerType` reads
  `undefined` and is refused at validation (`CONDITION_THIS_NOT_IN_CONTEXT`).

```json
{
  "issuePolicy": "onSourceCreate",
  "issueCondition": { "js": "source.customerType === 'business'" },
  "dueDateProperty": "paymentDueDate"
}
```

- `statusProperty` is an optional property on the object that the service
  keeps updated (`draft | open | partially_paid | paid | voided | uncollectible`).
  It is a read model; the ledger's status stays authoritative and is never
  writable through the object.
- `customerProperty` is stamped onto the header as `customerId`.

## Invoicing and payments: allocation, not coupling

- The payment family is never modified by invoicing. The relation is
  `Invoice 0..N Payment` through `sys_<X>InvoicePayment`, one row per
  application: a payment can cover several invoices and an invoice can be paid
  by several payments; provider combinations are free.
- An allocation records `paymentIntentId` (the provider intent id, matching
  `sys_<X>Payment.paymentId`) or `externalPaymentRef` (an out-of-band
  reference, recorded by an operator with `"external": true`).
- Applying a payment inserts the allocation, updates `amountPaid` /
  `amountRemaining`, advances the state, then fires the `statusProperty` mirror
  and the hooks.

### The `payment.captured` bridge

1. **Correlate**: provider intent id -> payment ticket -> source row.
2. **An open or partially paid invoice exists**: the captured amount is
   allocated to it.
3. **No invoice yet, `onPaymentCaptured`**: evaluate `issueCondition`, then
   create, finalize and apply the amount.
4. **The same capture left a draft**: resume it, finalize it and allocate the
   capture once; the line snapshot and invoice id stay the same, and recovery
   neither re-evaluates `issueCondition` nor voids and reissues. Finalize and
   store failures stay retryable on redelivery.

A compiler must make the bridge exactly-once under concurrency and redelivery:

- The capture key is `payment.captured:<object>:<sourceId>:<providerIntentId>`.
  The draft header is written under an id derived from the key, so the database
  refuses a second header of the key across processes and replicas. Every
  delivery that finds the claim completes it: one finalization numbers the
  draft, the others read its document, and the payment is applied under the
  capture key as its receipt, so a capture (partial included) is allocated once.
  An unrelated manually created draft is never adopted.
- A keyed draft persists its full frozen line snapshot in its header before the
  line rows; line identities derive from the issuance key and position; a retry
  inserts missing lines and verifies existing ones against the frozen values,
  never rebuilding from current source values. Finalization verifies the full
  line set before numbering; a missing or inconsistent keyed snapshot is
  refused.
- Duplicate deliveries consume one invoice number. Where the number cannot be
  allocated inside the finalize transaction, a pending finalize intent is saved
  on the series counter first, so a losing delivery leaves no gap; while a
  pending intent exists, other invoices and bare number requests of that series
  answer 409 until it is retried or reconciled, and its number is never reused
  while its header's outcome is unknown.
- Every internal-ledger write is a conditional update of the header snapshot it
  was decided on (status, amount paid, the number column, the finalize claim). A
  finalization records its claim (`__invoiceFinalizeClaim`) before taking a
  number, so a concurrent finalization answers 409 without consuming one; the
  `invoiceNumber` column stays null until the real number replaces it. The
  claim has a 60-second lease, after which a dead finalizer is taken over (the
  only path to a gap); a void ends any claim.
- A payment's header write records its allocation as pending in the same
  update; the allocation row is then written under its receipt id, and any later
  payment or redelivery completes pending allocations first. A process death
  between the two writes neither drops nor doubles the payment. The call that
  writes a pending allocation's row owns its announcement (mirror and hooks); a
  replay emits none. This is not a durable hook outbox: a death after the
  insert can still lose an announcement.
- Receipt keys are local to an invoice: the same key on another invoice is an
  independent payment. A redelivery that resumes its own keyed invoice first
  looks for an allocation of the same payment under any id (an operator's manual
  apply) and records nothing when one exists.
- A settled invoice set with no open remainder returns without a second
  issuance or allocation, and a bridge failure never fails the payment dispatch.
- The subscription bridge claims issuance under
  `invoice.paid:<object>:<sourceId>:<providerInvoiceId>` the same way: of two
  concurrent first deliveries the loser returns `ALREADY_ISSUED` before
  stamping, numbering or applying money; a failure after the claim is completed
  on redelivery without reloading a changed source or re-evaluating the
  condition. Paid and voided cycles are no-ops.

### The bridge outcome log

Every bridge invocation (`payment.captured` and `invoice.paid`) writes exactly
one `InvoiceBridgeOutcome` log line: `object`, `bridge`, `providerEventId`, the
correlation keys (`providerIntentId`, or `providerInvoiceId` +
`providerSubscriptionId`; `sourceId` once known), and `outcome`: `issued`
(with `invoiceId`, `invoiceNumber`, `amountApplied`), `applied` (an existing
open invoice settled) or `skipped` with a stable reason:

| reason | level | meaning |
|---|---|---|
| `NO_INTENT_ID` / `NO_INVOICE_ID` / `NO_SUBSCRIPTION_ID` | warn | the event carries no correlation key |
| `NO_TICKET` | warn (info with several bridge objects) | no payment ticket for the intent |
| `NO_SUBSCRIPTION` | warn (info with several bridge objects) | the subscription is not in this object's journal |
| `NO_ORDER_ID` | warn | the ticket or journal row has no `orderId` |
| `SOURCE_MISSING` | warn | the named source row does not exist |
| `ALREADY_SETTLED` / `ALREADY_ISSUED` | info | redelivery: already issued |
| `CONDITION_FALSE` | info | `issueCondition` was false |
| `NOT_CAPTURE_DRIVEN` | info | `issuePolicy` is not `onPaymentCaptured` and no open invoice exists |

A thrown error is logged as `payment.captured invoice bridge failed` /
`invoice.paid invoice bridge failed`, not as an outcome line. Only an accepted
`payment.captured` runs the bridge; a refused capture issues nothing.

### Merchant-of-record suppression

When the capturing payment provider has `capabilities.isMerchantOfRecord = true`,
the tax lifecycle hooks **and the invoice bridge** are suppressed: the provider
is the seller of record and already invoices the sale. The decision is the
capability flag, never the provider name.

### Successful refunds

For `onPaymentCaptured` with a provider that `supportsCreditNotes`, a normalized
`refund.succeeded` reaches the invoice lifecycle after the refund lifecycle
accepts it (a refused refund, or a local report consumed as already applied,
creates nothing). The intent id locates the ticket and its invoice. A paid
invoice receives a credit note; a draft or open invoice takes the void path; a
voided or partially paid invoice gets none. With several active invoices for
the source, the allocation must identify exactly one, or the bridge refuses.
The refund needs a provider refund id and a positive finite amount no greater
than the invoice's paid amount and total; a supplied currency must match after
trimming and upper-casing both codes. The credit-note key is
`refund-<providerRefundId>`: redelivery returns the existing note without
another hook; two partial refunds issue two notes. A partial note records one
gross adjustment in `metadata.adjustmentLines` (quantity 1, unit price and line
total equal to the refund), without allocating it across lines, changing their
VAT or the paid invoice's balance. Merchant-of-record payments stay the
provider's.

## Invoicing and enterprise projection: the ownership rule

- `enterpriseProjection` makes the local object a **mirror** (data plumbing);
  invoicing bound to a bridge brand is **behaviour delegation** (the external
  system is the system of record).
- Invoicing on a bridge brand **and** an `enterpriseProjection` on the same
  object is the ERROR `INVOICING_CONFLICTS_WITH_ENTERPRISE_PROJECTION`: the same
  external object synced through two channels races and echoes.
- Invoicing on a native provider (internal included) plus a projection is the
  WARNING `INVOICING_OVERLAPS_ENTERPRISE_PROJECTION`: a legitimate
  accounting-export shape, as long as the projection does not pull invoice-owned
  values (status, totals, numbers) back in over the ledger.
- Display-only needs: use the projection alone, without `invoicing`.

## InvoiceAction

The imperative escape hatch for `manual` designs, running through the same
lifecycle as every other path.

| `operation` | Does | Required bindings |
|---|---|---|
| `create` | cut a draft from the source row (line snapshot included) | `sourceIdProperty` (defaults to the API's own persisted row id) |
| `finalize` | number it, `draft` -> `open` | `invoiceIdProperty` |
| `void` | legal cancellation (keeps the number) | `invoiceIdProperty`; optional `reasonProperty` |
| `applyPayment` | record a payment | `invoiceIdProperty`, `amountProperty`; optional `paymentRefProperty` |
| `creditNote` | issue a credit adjustment | `invoiceIdProperty`, `amountProperty`; optional `reasonProperty`, `idempotencyKeyProperty` (the complete key, `refund-` prefix included) |

- The invoicing opt-in must exist on the API's own object or on exactly one
  other object of the service (`INVOICING_NOT_CONFIGURED`).
- Missing bindings: `INVOICE_ACTION_MISSING_INVOICE_ID`,
  `INVOICE_ACTION_MISSING_AMOUNT`.
- A `providerName` on the action that differs from the object's binding is
  refused (`INVOICE_ACTION_PROVIDER_MISMATCH`): bind the provider on the object.
- `contextPropertyName` stores the provider's **normalized result**, not a
  ledger row: `NormalizedInvoiceDetail` for `create`, `finalize`, `void`;
  `NormalizedPaymentApplication` for `applyPayment`; `NormalizedCreditNote` for
  `creditNote`. These have no `id`: the invoice id a later operation needs is
  `providerInvoiceId` (for `internal` it is the ledger row id); the source row
  id is `metadata.sourceObjectId`. `invoiceIdProperty` resolves params -> the
  API row -> the context, one dotted segment at a time:

  ```json
  "invoiceActions": [
    { "name": "cutInvoice", "operation": "create", "contextPropertyName": "inv" },
    { "name": "finalizeIt", "operation": "finalize", "invoiceIdProperty": "inv.providerInvoiceId" }
  ]
  ```

  `inv.id` resolves nothing: the finalize throws "invoiceIdProperty did not
  resolve an invoice id" at run time, after the main write committed. Reading a
  member the result does not carry warns `INVOICE_ACTION_RESULT_UNKNOWN_FIELD`.

## Lifecycle hooks

- Triggers: `afterInvoiceFinalized`, `afterInvoicePaid`,
  `afterInvoicePartiallyPaid`, `afterInvoiceVoided`,
  `afterInvoiceUncollectible`, `afterCreditNoteIssued`, `afterPaymentApplied`.
- In scope: `invoice`, `allocation`, `creditNote`, `LIB.*` (and `API.*` where
  the compiler binds internal calls). There is **no request, session or user**.
  Hooks run after the transition is persisted; a failure is logged and never
  rolls back the ledger write. A throwing hook condition counts as false: the
  hook name and trigger are logged and the script is skipped.
- A compiler checks the root names a hook condition and script read; a name
  outside `invoice`, `allocation`, `creditNote` and `LIB` is a diagnostic naming
  the slot, the unbound names and the allowed scope. `issueCondition` has its
  own scope (`event`, `resource`, `order`, `source`, `payment`, `LIB`), checked
  even when the current policy does not execute it.

| Name | Type | Set on | Fields |
|---|---|---|---|
| `invoice` | `NormalizedInvoiceDetail` | every trigger | `providerInvoiceId`, `invoiceNumber`, `series`, `statusLiteral`, `currency`, `subtotal`, `vatTotal`, `total`, `amountPaid`, `amountRemaining`, `dueDate`, `issuedAt`, `buyer`, `seller`, `lines`, `vatExemptionReasonCode`, `vatExemptionReason`, `metadata` |
| `allocation` | `NormalizedPaymentApplication` | `afterPaymentApplied`, `afterInvoicePaid`, `afterInvoicePartiallyPaid` when applied in-process; `null` otherwise (an external provider's `invoice.paid` webhook included) | `providerAllocationId`, `providerInvoiceId`, `amount`, `currency`, `appliedAt`, `paymentRef`, `invoiceStatus`, `amountPaid`, `amountRemaining`, `metadata` |
| `creditNote` | `NormalizedCreditNote` | `afterCreditNoteIssued`; `null` otherwise | `providerCreditNoteId`, `providerInvoiceId`, `amount`, `currency`, `reason`, `issuedAt`, `metadata` |

| You want | Read |
|---|---|
| the ledger row id | `invoice.providerInvoiceId` (an external provider's own id: `invoice.metadata.__externalInvoiceId`) |
| the source row id | `invoice.metadata.sourceObjectId` (object: `invoice.metadata.sourceObject`) |
| the invoicing object's own row (the mirror target) | `invoice.metadata.__surfaceRowId` |
| the buyer | `invoice.buyer?.partyId` |
| the source row owner | `invoice.metadata.ownerId` |

The metadata keys are stamped when the service creates the draft; an invoice
created at the provider and imported carries none, so guard the read
(`invoice.metadata?.sourceObjectId`). A field outside the table reads
`undefined` at every fire: validation reports it
(`INVOICE_LIFECYCLE_HOOK_UNKNOWN_FIELD_SILENT`, WARNING, naming the valid
fields), and a read of `allocation` / `creditNote` in a hook whose trigger never
supplies it (`INVOICE_LIFECYCLE_HOOK_ROOT_NULL_ON_TRIGGER`, WARNING).

```js
// afterInvoiceFinalized: stamp the order that this invoice bills
await API.markOrderInvoiced({
  orderId: invoice.metadata?.sourceObjectId,
  invoiceNumber: invoice.invoiceNumber,
})
```

## The generated route surface

Per invoicing object `x` (lower-cased name):

| Route | Auth | Purpose |
|---|---|---|
| `GET /v1/<x>invoices/:invoiceId` | session, owner-scoped | full document: header, frozen lines, allocations |
| `POST /v1/<x>invoices` | operator | create a draft `{ sourceId, surfaceRowId? }` |
| `POST /v1/<x>invoices/:invoiceId/finalize` | operator | number and open |
| `POST /v1/<x>invoices/:invoiceId/void` | operator | `{ reason? }` |
| `POST /v1/<x>invoices/:invoiceId/apply-payment` | operator | `{ amount, paymentRef?, external? }` |
| `POST /v1/<x>creditnotes` | operator | `{ invoiceId, amount, reason? }`, only when the provider supports credit notes |

- The credit-note route accepts an optional `Idempotency-Key` header (trimmed;
  absent or blank leaves issuance unkeyed): the same key returns the existing
  note without another hook; distinct keys issue distinct notes.
- Owner-scoped reads (admins see all): `GET /<x>invoices` (also
  `/v1/<x>invoices`, filters `?statusLiteral=`, `?invoiceNumber=`,
  `?sourceObjectId=`, no `?status=` alias), `GET /<x>invoice/:id`,
  `GET /<x>invoicelines`, `GET /<x>creditnotes`, `GET /<x>invoicepayments`
  (each `?invoiceId=`).
- Operator inspect: `GET /v1/invoices/admin/sequences` (counter census),
  `GET /v1/invoices/admin/<x>` (`?status=`, mapped onto `statusLiteral`),
  `GET /v1/invoices/admin/<x>/:invoiceId`; admin reads of the counters at
  `GET /admin/invoicesequences` and `GET /admin/invoicesequences/:id`.
- In a multi-tenant service each object's operator routes use its own invoice
  tenant column for every role and refuse unscoped mutations; a service-level
  family requires a platform operator. Customer document reads run the owner
  gate first (a non-owner receives `INVOICE_NOT_OWNER` before tenant
  filtering), then filter an ordinary owner by the session tenant.
- Refusals are typed 4xx with honest messages (`INVOICE_NOT_OWNER`,
  `INVOICE_SOURCE_REQUIRED`, capability refusals as 400); anything unexpected
  is an opaque 500 (`INVOICE_CREATE_FAILED`, ...) with the detail kept in the
  server log.

## Cross-service topology

- There is no automatic cross-service invoice bridge: `sourceObjectName` must
  be a local object. By default the payment and invoice layers publish no Kafka
  events (`raiseApiEvent: false`; `payment.captured`-style triggers are
  in-process).
- `publishLifecycleEvents: true` on a block's configuration publishes that
  block's lifecycle events, one topic per event: `invoicing` publishes
  `invoice.finalized`, `invoice.paid`, `invoice.partially_paid`,
  `invoice.voided`, `invoice.uncollectible`, `invoice.payment_applied` and
  `creditnote.issued` on `<serviceCodename>-lcevent-<family>-<object>-<event>`.
  Delivery is at least once through a lifecycle outbox: deduplicate on
  `data.dedupeKey` and never reconcile billing from these events.
- Any other domain fact is announced from a hook: through a library function
  that publishes and **declares** its topic in `publishes` (otherwise every
  listener is reported producerless, `KAFKA_TOPIC_NO_PRODUCER`), or through an
  internal-call API with a `PublishEventAction` (the hook must be at depth 0;
  inside a refund's internal-call chain the hook is at depth 1 and its `API.*`
  call is refused with `INTERNAL_CALL_DEPTH_EXCEEDED`, so use the library
  function there). Hook failures never fail the transition; an announcement
  that must not be lost needs its own replay.

## internal

- No credentials; issues, numbers (local sequence) and stores invoices itself.
- Mutates in-process: an internal-only project gets no status cron and no
  external reconciliation surface.
- No collection automation, customer balance or PDF rendering.

## stripe

- An external system of record. Writes go **external-first** and converge the
  local mirror; reads use the mirror. Local ids stay the workflow and read ids;
  the vendor id is stored separately (`metadata.__externalInvoiceId`).
- Signed events enter `POST /v1/invoices/webhook/:providerName` and
  `sys_invoiceEvent`, independently of payment ingress. Credit-note webhooks
  fire the hook without mirroring a credit-note row. The webhook secret is
  needed only to verify webhooks and is registered after deploy.
- **Keyed create is a claim.** The local header is written under the issuance
  key's id, so two workers that both call the provider keep one header; the
  loser answers the persisted winner as a replay and never rebuilds it from its
  own response. The header keeps the provider's totals and a frozen snapshot of
  its lines; a create interrupted after the provider call is completed from that
  snapshot without another provider create. The provider's tax split is kept as
  reported (a header may carry tax inside its subtotal while lines keep their
  own VAT). Only a create under the same key is a replay; a create under another
  key that returns an already mirrored vendor id can be refused by the unique
  `providerInvoiceId` index, never turned into a replay. A duplicate header
  written before this rule is read with its own lines and logged once, never
  merged or deleted.
- Numbering belongs to the provider; a caller-supplied number at finalize is
  HTTP 400. A partial out-of-band `applyPayment` is HTTP 501: the provider
  collects partial payments itself.
- Credit notes use decimal half-up rounding into minor units (1.005 USD sends
  101); zero- and three-decimal currency scales are kept.
- It reconciles through webhooks; no status cron is used.

## Webhook-less external brands

- An object bound to an external provider without webhooks gets a status cron
  that polls `open` and `partially_paid` invoices every five minutes. The poll
  reads each row's status from the provider by its `providerInvoiceId` (rows
  without one are skipped), never from the mirror. A changed status updates the
  header (status, paid and remaining amounts, any returned number), then the
  object's `statusProperty` row (by the stored surface identity, even with
  lifecycle publishing off), then publishes the lifecycle event when opted in.
  Provider metadata never replaces the stored source, surface or tenant
  identity; an unchanged status or a failed read updates nothing.
- No shipped brand uses this path yet: `logoIsbasi`, `parasut`, `mikro` and the
  bridge brands are declarable ahead of their adapters.

## custom

- A native escape hatch (`baseUrl`, optional `apiKey`) over the public provider
  contract; declarable ahead of its adapter.

## Operations

Environment variables, console configuration, provider onboarding and webhook
registration, credential minting and the go-live checklist are operations of a
compiler and are not part of the language. Read the documentation of your compiler for them.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.
