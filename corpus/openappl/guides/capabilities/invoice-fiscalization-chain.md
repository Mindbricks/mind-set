---
title: The invoice → fiscalization chain
---

# The invoice → fiscalization chain

Commerce, billing and tax compliance are three different jobs, and OpenAPPL keeps
them on three declarative opt-ins that chain into one flow: **checkout** captures
the money, **invoicing** produces the commercial receivable, **fiscalization**
adapts that receivable to the government's fiscal infrastructure. The author
declares *triggers*, never imperative glue: every arrow below is wired by the
compiler from a config field.

```
Cart checkout → order (checkout block) → payment.captured
  └─ issuePolicy: onPaymentCaptured
       → invoice manager: line snapshot + number + finalize → invoice.finalized
            └─ submitPolicy: onInvoiceFinalized
                 → fiscalization engine: resolve route (buyer lookup)
                      → prepare (wire serial + UBL) → submit → accepted → completed
```

This page is the end-to-end narrative: the document lifecycle, the declarative
triggers, multi-line invoices, the platform money convention, jurisdiction/provider
configuration, and the wire-serial regime including the burned-serial rule. The
reference detail for each family (the sys-table schemas, the full invoice FSM,
numbering, the route surface, the fiscal ledger and the integrator roster) belongs
to the compiler in use; see
[the compiler specification](../../compiler/index.md). The model choice for
marketplace-flavored projects (who is the seller of record?) is its own page:
[Intermediation vs reseller billing](intermediation-vs-reseller-billing.md).

## The document lifecycle, end to end

Two state machines run in sequence, each on its own injected ledger
(`sys_<X>Invoice` and `sys_<X>FiscalDocument`):

**Invoice**: `draft → open → partially_paid → paid`, with `voided`, `failed` and
`uncollectible` on the side. The load-bearing moment is **finalize**: it assigns the
number and issue date, moves the invoice to `open`, and seals the line snapshot. A
finalized invoice is never edited, only corrected with a **credit note** or voided.
Void refuses settled money: a `partially_paid` or `paid` invoice cannot be voided;
issue a credit note instead.

**Fiscal document**: `draft → prepared → submitted → pending → accepted → completed`,
with `rejected` (an authority verdict, a normal, correctable outcome) and `failed` (a
technical fault) both resubmittable on the SAME ledger row. Only `completed` and
`canceled` are terminal.

**Credit notes** ride the invoice side: one `sys_<X>CreditNote` row per correction,
issued against a finalized invoice through the generated credit-note manager (REST:
`POST /v1/<x>creditnotes`, operator-gated), available only when the bound provider's
`capabilities.supportsCreditNotes` is on (the internal provider supports them). The
`afterCreditNoteIssued` lifecycle hook fires on issue, and on the fiscal side
`creditNote` is a first-class `documentType` the jurisdiction policy can route
(override per row with `documentTypeMap`).

A `sys_<X>CreditNote` row (amount + reason) is a ledger record, not a fiscal document,
and this is the normal path for a **customer's** return: the platform does not
fiscalize customer returns. For an e-Arsiv (consumer) sale the return is documented
outside the platform (the consumer's signed return section of the e-Arsiv, VUK GT 509
IV.2.4.5, or a gider pusulasi); for an e-Fatura (taxpayer) buyer, the **buyer** issues
the IADE invoice, not the platform.

A separate, narrower path exists for when the **fiscalizing party itself** is the one
returning goods (for example, returning stock it bought to its own supplier): that
return is a return **row** of the same object (its own lines) that `documentTypeMap`
classifies as `creditNote`, written as an IADE document. GIB requires an IADE document
to name every invoice it returns (`cac:BillingReference`): declare `originalRefProperty`
on the fiscalization configuration (the property holding the id of the ORIGINAL row)
and set it on the return row; the generated fiscal layer reads the original row's
issued fiscal document (its serial) and invoice (its issue date). Under TR a map that
can yield `'creditNote'` without that field is a design-time ERROR
(`FISCAL_CREDIT_NOTE_ORIGINAL_UNBOUND`). A credit note whose original does not resolve
(no reference, an original not yet fiscalized, a row with several issued invoices, a
serial that is not 16 characters) is refused with a typed 400 before the integrator
call. Fiscalize the original first.

`issueCreditNote({ providerInvoiceId, amount, reason, idempotencyKey })` honours its
`idempotencyKey`: the key is stored on the row's unique
`sys_<X>CreditNote.idempotencyKey` column, so the same key never issues a second credit
note. On a multi-tenant service the column is unique per tenant, and the key is looked
up within the invoice's tenant only: another tenant using the same key issues its own
note. A repeated call, or a concurrent one, is answered with the note already issued and
`afterCreditNoteIssued` does not fire again; the same key reused (in the same tenant)
for a different invoice or amount is refused with 409, whose message names only the key
and the note it already issued. Code that can run more than once for one fact (an
`afterPaymentRefunded` hook issuing the refund's credit note) passes a key derived from
that fact, for example `refund-<providerRefundId>`. The internal provider and the
external-ledger mirror enforce it on the ledger row; Stripe also receives it as its own
API idempotency key. A call without a key issues a new note every time. Under
`issuePolicy: onPaymentCaptured` with a credit-note-capable provider, a compiler may
issue this note itself on `refund.succeeded` (paid invoices only, key
`refund-<providerRefundId>`), so no hand-written hook is needed there; the compiler's
documentation says which targets do.

## Declarative triggers: who starts each leg

The chain's joints are two policy fields; the author never writes event glue:

| Field | Values | Meaning |
| --- | --- | --- |
| `invoicing.configuration.issuePolicy` | `manual` (default) \| `onPaymentCaptured` \| `onSourceCreate` \| `onSubscriptionInvoicePaid` | When the invoice is created + finalized from the source row. `onPaymentCaptured` rides the payment event dispatcher; `onSourceCreate` rides the source object's after-create seam. `onSubscriptionInvoicePaid` handles paid subscription cycles, including a `sourceObjectName` that names another subscription object in this service. It claims each provider invoice once and follows the existing finalize/fiscal submit chain. |
| `invoicing.configuration.issueCondition` | MScript | Optional guard on the automatic trigger (for example only B2B rows invoice). `this` binds `order` / `source` (the source row) and `payment`, not the row: write `source.buyerType`, never `this.buyerType` (`CONDITION_THIS_NOT_IN_CONTEXT`). |
| `fiscalization.configuration.submitPolicy` | `onInvoiceFinalized` (default) \| `manual` | When the fiscal pipeline runs. `onInvoiceFinalized` requires the invoicing block on the same object: the finalize snapshot is the document source. `manual` is the natural mode for reporting-only objects. |
| `fiscalization.configuration.submitCondition` | MScript | Optional guard (for example only fiscalize domestic sales). `this` binds `invoice` (the finalized invoice) and `source`, not the row: write `source.country`, never `this.country` (`CONDITION_THIS_NOT_IN_CONTEXT`). |

The imperative escape hatch, for `manual` policies, is a pair of BusinessApi action
types: `InvoiceAction` (`operation: create | finalize | void | applyPayment`) and
`FiscalizeAction` (`operation: submit | cancel | queryStatus`); see
[`InvoiceAction`](../../spec/InvoiceAction.md) and
[`FiscalizeAction`](../../spec/FiscalizeAction.md). These are in-service actions driving
the same generated managers the automatic triggers use; there is no separate code path.

Cross-service chains (a billing service invoicing another service's orders) have **no
automatic bridge by design**: publish the source service's lifecycle events and consume
them with a standard `EventSubscription`: the declaration moves, the principle
(declare, don't glue) stays.

## Multi-line invoices: `invoiceLineRelation`

An invoice with real lines binds its editable line source through `invoiceLineRelation`
(see [`InvoiceLineRelation`](../../spec/InvoiceLineRelation.md)):

```jsonc
"invoiceLineRelation": {
  "hasLineItemRelation": true,
  "lineItemObject": "orderItem",          // same-service data object
  "invoiceForeignKey": "id",              // on the invoicing object
  "lineItemLocalKey": "orderId",          // on the line object
  "quantityProperty": "quantity",
  "unitPriceProperty": "unitPrice",
  "descriptionProperty": "productTitle",  // the human-readable line text
  // tax-breakdown bindings, for lines that already carry computed VAT:
  "vatRateProperty": "vatRate",
  "vatAmountProperty": "vatAmount",
  "finalTotalProperty": "finalTotal"
}
```

- The line object is the **editable source**; the ledger's `sys_<X>InvoiceLine` rows are
  the **immutable snapshot** taken when the draft is cut. Later edits to source rows
  never change an issued invoice; fiscalization and allocation always read the frozen
  copy.
- `descriptionProperty` is what prints on the invoice (and flows into the UBL line text):
  bind it to whatever human-readable column the line object carries; only quantity /
  unitPrice / description are commonly needed.
- The binding names align 1:1 with the line fields shopping-cart pricing produces
  (`quantity`, `unitPrice`, `lineTotal`, `discountAmount`, `vatRate`, `vatAmount`,
  `finalTotal`): a cart's tax breakdown flows into the invoice losslessly.
- Unbound computed slots (`lineTotal`, `vatAmount`, `finalTotal`) are derived at snapshot
  time; a **bound** computed slot is validated against the derivation instead.

A **relation-less** invoice object (the row itself is the single implicit line) uses the
object-level bindings instead: `amountProperty` plus, for the tax breakdown, exactly one of
`vatRateStaticValue` or `vatRateProperty`. Declaring both is a design-time error
(`INVOICE_VAT_BINDING_CONFLICT`), declaring either next to a bound line relation is too
(`INVOICE_VAT_BINDING_WITH_LINE_RELATION`: the relation owns the breakdown), and a static
rate outside 0–100 is refused (`INVOICE_VAT_RATE_OUT_OF_RANGE`).

## The platform money convention

Every bound money property in the checkout / marketplace / invoicing families carries
**MAJOR currency units as a decimal**: `250.00` TL, `10.00` USD. Provider **adapters own
each wire conversion** (a PSP that wants kuruş gets kuruş inside the adapter, never in the
author's data). There is **no per-binding scale knob**: an `amountScale` config field was
considered and rejected, because a wrong scale declaration is exactly the silent 100× error
the convention exists to prevent.

The design-time half is a name-smell check: a money binding whose bound property NAME says
minor units (`amountKurus`, `priceCents`, `minorTotal`, …) draws the
`MONEY_BINDING_MINOR_UNIT_NAME` WARNING (the case behind it was a 250 TL ticket billed as
25.000,00 TL). Rate and quantity bindings (`vatRateProperty`, `quantityProperty`) are not
money and are not judged; `vatPercent`-style names are recognized as rates, not cents.

One deliberate contrast: the [ledger pattern](ledger.md) stores **integers at a declared
fixed-point scale** (`unit.scale` / `unit.scaleProperty`): that is the ledger's own
arithmetic contract, inside its own tables. The money convention governs the *bindings on
domain objects*; when a wrapper moves value between a money binding and a ledger, the
wrapper owns that conversion.

## Jurisdiction and provider configuration

Fiscalization binds two things: an **integrator entry** and a **jurisdiction policy**.

```jsonc
// projectSettings
"fiscalProvidersSettings": {
  "fiscalProviders": [{
    "name": "trFiscal",
    "provider": "uyumsoft",          // elogo | foriba | nilvera | izibiz | uyumsoft | mock | custom
    "network": "GIB",
    "configuration": [
      { "key": "serialPrefix", "value": "ABC" },          // e-Arsiv series, see the serial section below
      { "key": "eInvoiceSerialPrefix", "value": "ABE" },  // e-Fatura series, a different registered prefix
      { "key": "serialAssignment", "value": "platform" }  // or "vendor" (uyumsoft): the integrator numbers
      // credentials + seller identity keys are deployment secrets, not blueprint values
    ]
  }]
},

// on the data object
"fiscalization": {
  "objectIsFiscalized": true,
  "configuration": {
    "fiscalProviderName": "trFiscal",   // may be null when exactly ONE entry is declared
    "jurisdiction": "TR",
    "buyerParty": {
      "taxIdProperty": "buyerTaxId",    // optional: absent = consumer sale
      "nameProperty": "buyerName"       // REQUIRED source under TR
    },
    "submitPolicy": "onInvoiceFinalized",
    "onFiscalError": "continueRoute"
  }
}
```

- **The policy is code, not blueprint data.** `jurisdiction: "TR"` selects the compiled
  Turkish policy module: it routes each document by buyer lookup (registered e-invoice
  taxpayer → **e-Fatura** exchange; everyone else → **e-Arşiv** reporting), owns the serial
  format and the cancellation windows. The author never writes
  `if (buyer.isEFaturaUser)`. Other ISO codes validate with a roadmap warning.
- **Seller identity lives on the provider entry, not per object.** The project's own tax id /
  legal name / address (+ the UBL-TR mandatory district/city pair) are `fiscalProviders[]`
  configuration keys, supplied to the service as deployment secrets, because the identity is
  one per project and varies per environment (a sandbox integrator account has a different
  tax id than production). The object-level `sellerParty` block exists as an **override** for
  genuinely per-row issuers. Resolution order: object binding → provider entry (at runtime) →
  unbound, which fails closed with a typed 400. A design where NO seller tax id source
  resolves at either level is refused at design time (`FISCAL_SELLER_PARTY_UNBOUND`).
- **`buyerParty` is deliberately lenient on the tax id**: a sale binding no buyer tax id is a
  consumer sale and routes to the reporting scheme. It is strict on the NAME under TR
  (`FISCAL_BUYER_NAME_UNBOUND` warning): nothing downstream can supply a buyer name the row
  doesn't carry.
- Fine-tuning knobs: `lookupIndividuals` (ON by default: 11-digit personal ids are looked up
  on the network too, because an individual may be a registered sole proprietor who must
  receive e-Fatura; set it to `false` only to send every individual straight to e-Arşiv),
  `useCommercialInvoiceProfile` (TICARIFATURA: the commercial e-Fatura profile with the buyer
  accept/reject flow), and `internetSale` bindings (the e-commerce content e-Arşiv documents
  must carry). All are on [`FiscalizationConfig`](../../spec/FiscalizationConfig.md).
- **An internet sale names a complete carrier (VUK 509).** Once `internetSale` binds anything
  under TR, `carrierMode` must resolve a carrier: `carrierCompany` reads the carrier's legal
  title and VKN/TCKN from **the author's carrier data object** (the carrier-company settings;
  there is no built-in carrier table) through the order's `carrierRefProperty`, or from
  `carrierTitleStaticValue` / `carrierTaxIdStaticValue` for a single-carrier shop, with the
  tracking number from `trackingNumberProperty`; `selfDelivery` names the seller itself as the
  carrier (own vehicle or courier); `noShipment` declares that nothing physical is shipped. An
  empty `carrierMode` is `noShipment` when no shipment slot is bound (website / payment only: a
  digital good, a service, a subscription; a WARNING,
  `FISCAL_INTERNET_SALE_CARRIER_DEFAULTED_NO_SHIPMENT`) and `carrierCompany` otherwise. A
  shipping sale with no carrier source is a design-time ERROR
  (`FISCAL_INTERNET_SALE_CARRIER_UNBOUND`); a carrier whose tax id does not resolve on the row
  is refused with a typed 400 before the integrator call, never a name-only carrier. The
  document also carries the phrase "Bu satış internet üzerinden yapılmıştır." as a `cbc:Note`.
  A tenant-level carrier data object is read only within the order row's tenant (another
  tenant's carrier row counts as missing); a shared carrier object is read for every tenant; a
  tenant-level carrier object under an order object without a tenant is a design-time ERROR
  (`FISCAL_INTERNET_SALE_CARRIER_TENANT_UNREACHABLE`: no row could ever be read). On Uyumsoft
  the same content also travels in the e-Arsiv envelope's `InternetSalesInfo` (website, payment
  date and type, the shipment date and carrier), sent exactly when the document carries the
  internet-sale section.
- **The `internetSale` block makes the whole object an internet sale**: every row of that
  object is fiscalized as an internet sale (the phrase, `cac:Delivery` per `carrierMode`, the
  ELEKTRONIK sending type), even a row whose bound slots are empty; there is no per-row
  detection. An object that sells both in store and online must be split into two objects or
  two fiscalization configurations.

  ```json
  "internetSale": {
    "websiteStaticValue": "www.example.com",
    "carrierMode": "carrierCompany",
    "carrierDataObject": "shippingCarrier",   // a data object of this service
    "carrierRefProperty": "carrierId",        // on the order: the carrier row's id
    "carrierTitleProperty": "title",          // columns of shippingCarrier
    "carrierTaxIdProperty": "taxNumber",
    "trackingNumberProperty": "trackingNo"    // on the order
  }
  ```

## Wire serials and the burned-serial rule

Turkish schemes (both e-Fatura and e-Arşiv) demand a fiscal-layer document serial as the UBL
`cbc:ID`, grammar `^[A-Z]{3}[0-9]{13}$`: three uppercase letters, then year + a 9-digit
sequence. By default the generated service allocates it, not the integrator (an Uyumsoft entry
may set `serialAssignment: "vendor"` to let the integrator number instead; see the end of this
section):

- **The prefix is provider-entry configuration**: `serialPrefix`, exactly three uppercase
  letters, numbers e-Arşiv documents; `eInvoiceSerialPrefix` numbers e-Fatura documents on
  their own series and counter, because GIB keeps the two series apart; the two must differ. A
  missing or malformed prefix for the document's scheme is a typed 400 naming the field, before
  any vendor call.
- **The start is provider-entry configuration too**: the optional `serialSequenceStart` is a
  floor on every allocation, `max(lastNumber, serialSequenceStart - 1) + 1`, for an account
  whose prefix already issued numbers elsewhere. It never lowers the counter; a value outside
  1..999999999 is a typed 400 naming the key. `serialSequenceStartYear` scopes it to the year
  whose numbers were issued elsewhere, so later years start at 1; the e-Fatura series has its
  own `eInvoiceSerialSequenceStart` / `eInvoiceSerialSequenceStartYear`. The platform does not
  guarantee gapless series.
- **Allocation is atomic and early.** The engine's *prepare* step draws the next number from the
  injected `sys_fiscalSerialSequence` counter (unique per prefix + year, incremented under a row
  lock) and persists it on the ledger row **immediately**, before the document body is even
  built, so no attempt can ever burn a second sequence number for the same document.
- **A resubmit reuses the row's serial.** The same document keeps the same `cbc:ID` across
  correction attempts; only the ETTN (`uuid`) is re-minted, because a corrected document is a
  new submission in the network's eyes. The exception besides the burned serial below: an
  e-Arsiv resubmit on a later Turkey day than the original issue date is **re-dated** to now and
  draws a fresh serial on the new date (the old one is recorded as `supersededSerial`); past the
  7-day VUK 231/5 window it is refused with 422 `FISCAL_RESUBMIT_WINDOW_EXPIRED` instead. An
  e-Fatura resubmit is never re-dated (it keeps its serial as above) but is refused the same way
  past the window. First submissions are not touched by the window.

**The one exception is a burned serial.** When the provider refuses a submission with its "this
invoice number was already used and cannot be used again" class of rejection, that serial is
**consumed on the network side, permanently**: whoever used it (this ledger, a previous
environment against the same integrator account, another sender on a shared demo account).
Replaying it can only collect the same refusal, forever. So on resubmit:

1. The engine asks the **adapter** to classify the failed attempt's provider-authored refusal
   text (`isSerialConflictRejection`). The base default is `false`: no adapter burns a serial it
   cannot positively recognize; business rejections and transport errors stay on the normal
   same-serial correction path. (The uyumsoft adapter recognizes the duplicate-`cbc:ID` message
   shape.)
2. Only a refusal observed at the `submit`/`track` steps counts: a serial that never reached the
   provider (prepare/sign failure) is never burned.
3. On a positive match, resubmit **clears the row's serial**, so prepare mints the NEXT sequence
   number for the corrected document. The burned serial stays honest on the audit trail: the
   failed attempt's `sys_fiscalEvent` rows carry it, and it is appended to the row's
   `metadata.burnedDocumentSerials` with a timestamp.

> **Operational trap: a persistent provider namespace vs a reset counter.** The integrator's
> serial namespace never resets. If a clean start wipes `sys_fiscalSerialSequence` while
> pointing at a persistent integrator account (shared demo accounts especially), every freshly
> minted serial is already burned upstream and every document eats one duplicate-rejection round
> before landing (the burned-serial rule un-sticks it, but each document loses a cycle until the
> counter passes the provider's high-water mark). Seed the sequence from the provider's
> high-water mark, never rewind it: set `serialSequenceStart` on the provider entry to the mark
> + 1 rather than editing the counter row by hand.

**Vendor-assigned numbering (Uyumsoft, `serialAssignment: "vendor"`).** The integrator numbers
the document instead of the platform:

- The engine draws nothing from `sys_fiscalSerialSequence` for that entry.
- The UBL `cbc:ID` carries only the scheme's prefix (`serialPrefix` / `eInvoiceSerialPrefix`, or
  nothing for the account's default series). An internet-sale e-Arsiv with a website carries
  `eArchiveInternetSerialPrefix` when it is set: Uyumsoft numbers internet sales from a separate
  series type and ignores a plain e-Arsiv prefix there.
- The number Uyumsoft returns becomes the row's `documentSerial`. A lost answer is recovered from
  the outbox before anything is re-sent.
- The serial floors are ignored, with a WARNING.
- The duplicate refusal above is NOT a burned serial in this mode: an empty `cbc:ID` would collect
  the same refusal forever. It is reported as 409 `FISCAL_VENDOR_SERIAL_CONFLICT` for the operator
  to resolve at the integrator.

Never mix explicit and vendor numbering in one series, because the integrator's counter does not
skip numbers issued explicitly. A series that already holds platform-issued numbers needs its
integrator counter moved past the highest one, or a fresh prefix.

## Chain variants

| Shape | Wiring |
| --- | --- |
| Same object (the order is the invoice surface) | `checkout` + `invoicing` + `fiscalization` on one object; fully in-process dispatcher chain |
| Same service, separate invoice object | `invoicing.configuration.sourceObjectName` names the order; triggers read amount/lines/customer from the source row |
| Separate billing service | No automatic bridge: consume the source service's lifecycle events with an `EventSubscription` |
| B2B "invoice first, collect later" | `issuePolicy: onSourceCreate` (+ `issueCondition` for the B2B/B2C split) → invoice `open` with a due date; payment allocation lands later |
| Merchant-of-record checkout | Fiscalization on a MoR-provider checkout object draws a design-time WARNING: the MoR (Paddle / Lemon Squeezy class) already remits the tax; fiscalizing the same sale is double taxation |

## See also

- [Intermediation vs reseller billing](intermediation-vs-reseller-billing.md): who is the seller of record, `billingModel`, platform settlement.
- [Payment workflow](payment-workflow.md): the checkout leg the chain starts from.
- Patterns: [`Invoicing`](../../spec/Invoicing.md) · [`InvoicingConfig`](../../spec/InvoicingConfig.md) · [`InvoiceLineRelation`](../../spec/InvoiceLineRelation.md) · [`Fiscalization`](../../spec/Fiscalization.md) · [`FiscalizationConfig`](../../spec/FiscalizationConfig.md) · [`FiscalProvider`](../../spec/FiscalProvider.md).
