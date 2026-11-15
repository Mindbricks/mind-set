---
title: Intermediation vs reseller billing
---

# Intermediation vs reseller billing

A marketplace-flavored project must pick its **billing model** before it picks
providers or patterns: who is the **seller of record** for each sale? The answer
decides whose invoice the buyer receives, which money path is legal, and which
patterns the blueprint composes. There are two models, and each pairs a **document
side** with a **money side** that must not be mixed.

> Terminology: the reseller model is also called the *merchant model* (TR:
> *al-sat*), the intermediation model the *intermediary* or *agency* model (TR:
> *aracılık*). Documentation of the inbound-invoice and payout-gate machinery uses
> the merchant/intermediary names for the same two models.

## The two models side by side

| | **Reseller (al-sat)** | **Intermediary (aracılık)** |
| --- | --- | --- |
| Seller of record | The **platform** | The **sub-merchant** (seller) |
| Buyer's invoice / fiscal document | Issued by the **platform**, full sale amount (ordinary outbound fiscalization on the order object) | Issued by the **seller**: the platform **never** fiscalizes the sale |
| Platform's outbound invoice | The full-amount sale invoice to the buyer | **Only** the commission invoice to the seller |
| Seller's invoice | The seller invoices the **platform** for its receivable (an **inbound** document on the fiscal network) | The seller invoices the **buyer** (outside the platform's fiscal surface) |
| Money path | The **full amount** enters the platform's account: a **plain charge, no PSP split** | **Marketplace split at charge**: the sub-merchant amount never touches the platform |
| Seller earnings settle | Platform-side, against the seller's incoming invoice (earnings ledger + payment instructions: accounting export, ERP payment orders through the [enterprise-integration surface](../../spec/EnterpriseIntegration.md), optionally direct bank orders) | At the provider: split + connected accounts + settlement approval / payouts |
| Commission is | Platform **profit** inside the margin | A **billed fee**: the commission invoice below |

## The legal pairing rules

The document side and the money side pair **both ways**, and crossing them is not a
style choice: it is an invoice/cash mismatch and a potential legal defect:

- **Reseller => full amount to the platform, NO split.** The platform invoices the
  buyer for the full amount, so the full amount must enter the platform's account.
  Splitting a reseller sale at the PSP leaves the platform holding an invoice for
  money it never received. The seller's earnings settle platform-side against the
  seller's inbound invoice (the *mutabakat* leg: the seller's inbound invoice is
  matched against the earnings before the platform pays it).
- **Intermediary => split, and the platform's ONLY invoice is the commission
  invoice.** The sub-merchant amount is the seller's money and must never enter the
  platform's account as revenue; the platform fiscalizes nothing about the sale
  itself. Its one outbound document is the commission invoice to the seller.
- **Never issue documents in the seller's name.** Issuing invoices or fiscal
  documents under a seller's tax id from the platform's infrastructure is not legal
  in Türkiye (and many other jurisdictions) and is permanently out of scope: do not
  model per-seller issuance accounts or serials. If the seller's own fiscal system
  should receive the sale data so *the seller* issues, that is an **outbound
  integration** (forwarding data), never issuance from the generated service.

Pick the model **per object**: one project can run both (a *hybrid* platform; see
the provider-account note at the end), but each sale object belongs to exactly one
model.

## Declaring the model: `billingModel`

The choice is a first-class design-time knob on the checkout block:

```jsonc
"checkout": {
  "objectIsAnOrderObject": true,
  "configuration": {
    "billingModel": "reseller"     // "reseller" | "intermediary" | null
    // …
  }
}
```

It lives on [`CheckoutConfig`](../../spec/CheckoutConfig.md), not on the marketplace
block, because money enters through checkout in **both** models, and a reseller
object has no marketplace block at all. An absent `billingModel` is legacy behavior:
no new finding fires and generated code is unchanged; the field is a design-time
validation contract only.

The validator enforces the pairing rules above with typed findings:

- **`BILLING_MODEL_RESELLER_WITH_MARKETPLACE_SPLIT`** (ERROR): `"reseller"` combined
  with a marketplace block that would actually **split** (its `settlementMode` is not
  `"platformSettled"`). The forbidden shape is reseller + PSP split, not reseller +
  marketplace block: `reseller` **with** `settlementMode: "platformSettled"` is the
  blessed pairing (plain charge, earnings settle platform-side, next section).
- **`BILLING_MODEL_INTERMEDIARY_WITH_PLATFORM_FISCALIZATION`** (ERROR):
  `"intermediary"` combined with `fiscalization` on the same object. The platform
  never fiscalizes an intermediary sale; move the fiscalization block to the
  commission object.
- **`BILLING_MODEL_NOT_DECLARED`** (WARNING): a marketplace-bearing object with no
  declared model gets a nudge to choose explicitly. WARNING, not ERROR: blueprints
  that predate the knob stay accepted.

## Platform settlement: `settlementMode: "platformSettled"`

The reseller model's money leg has its own knob on the marketplace block:

```jsonc
"marketplace": {
  "objectIsMarketplaceObject": true,
  "configuration": {
    "settlementMode": "platformSettled",   // "providerSplit" | "platformSettled" | null
    "sellerAccountProperty": "sellerAccountId",   // attribution key, NOT a split
    "applicationFeeProperty": "platformFee"
  }
}
```

- **`providerSplit`** (and absent/null, the legacy default) is split-at-charge, PSP
  payouts, optionally invoice-gated by the `payoutGate`.
- **`platformSettled`** makes the charge **plain**: the split is not applied at all
  and the gross enters the platform's account. The seller binding stays: it is the
  **attribution key** read at capture. The PSP payout machinery goes inert for the
  object: the generated `createPayout` refuses with a typed 409 (`PLATFORM_SETTLED`)
  before any provider call.

An active `payoutGate` raises `PAYOUT_GATE_INBOUND_POLL_SUPPRESSED` when
inbound-capable providers and fiscalized objects exist, but no non-tenant-scoped
fiscalized object in the service binds such a provider. The inbound poll cannot run
for that shape, so gated payouts remain held until an eligible fiscal ledger is
configured or the gate is disabled.

Instead of moving money, the service **records** it and instructs the accounting:

- **`sys_<X>EarningsEntry`**: an append-mostly earnings ledger row per money event:
  `accrual` on `payment.captured`, `clawback` on `refund.succeeded`, idempotent per
  provider event. `gross` / `fee` / `net` are MAJOR currency units; `net = gross - fee`
  is what the platform owes the seller. No money moves: the row only records the debt.
- **`sys_<X>SettlementInstruction`**: one row is one order to the platform's
  accounting: *pay `amount` `currency` to seller / IBAN against invoice `invoiceRef`*.
  A generate run claims the seller's `accrued` entries and drafts one instruction per
  seller; the instruction FSM is `draft -> approved -> instructed -> confirmed |
  failed`. Approve is the operator's act, instruct hands the order to accounting (a CSV
  export download or a registered connector push), confirm settles the claimed entries,
  fail releases them back to `accrued` so the next run re-drafts the balance.
  Transitions are idempotent; out-of-order requests get a typed 409
  (`INSTRUCTION_TRANSITION_INVALID`).
- The operator surface is JSON routes on the payment router
  (`POST /v1/payments/settlement/instructions/generate`, listing with `?format=csv`,
  and per-row `approve` / `instruct` / `confirm` / `fail`).
- **Per-source instructions** (an organizer paid per event, after the event):
  `settlementGroupProperty` (for example `eventId`) drafts one instruction per seller,
  currency and group value (recorded as `metadata.settlementGroup`), and
  `settlementEligibleAfterProperty` (for example the event end date) leaves an entry
  `accrued` until that date on its order row has passed (an empty date is not eligible).
  Both are read off the persisted order row at generate time; refund clawbacks follow
  their order.
- **The approve-step invoice gate** (`settlementGate`, the `payoutGate` shape): approve
  is refused with 409 `INSTRUCTION_INVOICE_GATE_HELD` (the hold reason on
  `metadata.settlementGate`) until a matching inbound fiscal invoice of the seller is on
  the service's fiscal ledger; the match consumes the invoice for that instruction and
  stamps `invoiceRef`. A compiler documents which target languages provide it; a target
  that does not refuses the keys at design time.
- ERP payment-order connectors and direct bank orders ride a fixed `pushPaymentOrder`
  contract on the instruct transition; they are not yet available, and a mock connector
  is the only one in generated tests.

Design-time guards: `platformSettled` without a `sellerAccountProperty` is refused
(`SETTLEMENT_PLATFORM_SETTLED_WITHOUT_SELLER_BINDING`: earnings could not be
attributed), and `platformSettled` together with an active `payoutGate` is refused
(`SETTLEMENT_PLATFORM_SETTLED_WITH_PROVIDER_SPLIT_MACHINERY`: the gate gates PSP
payouts, which platform settlement does not have; the invoice-gating need is served by
`settlementGate` on the instruction approve step).

## The intermediation recipe: the commission object

Everything below is composable from existing patterns: a dedicated **commission data
object** carrying `invoicing` + `fiscalization`, next to a sale object carrying the
split. One row per settled order (or one per seller per period; see the aggregated
variant).

### 1. The commission data object

The row is the platform's receivable from the seller: the seller org reference, the fee
amount, and, because fiscal party bindings read the **owning row**, the seller's tax
identity, denormalized onto the row at write time (the
[write-time data composition](../composition/write-time-data-composition.md) pattern;
`PropRefer` does not join across objects):

```jsonc
// dataObject commissionCharge: one row per settled sale
"properties": [
  { "name": "saleOrderId",     "type": "ID" },                       // the settled sale
  { "name": "sellerOrgId",     "type": "ID",     "isRequired": true }, // the seller org being billed
  { "name": "feeAmount",       "type": "Decimal", "decimalScale": 2, "isRequired": true }, // the commission, MAJOR units
  { "name": "currency",        "type": "String", "defaultValue": "TRY" },
  { "name": "invoiceState",    "type": "String" },                   // invoicing FSM mirror
  { "name": "sellerTaxId",     "type": "String", "isRequired": true }, // <- copied from the org
  { "name": "sellerLegalName", "type": "String", "isRequired": true }, // <- copied from the org
  { "name": "sellerAddress",   "type": "String" }                    // <- copied from the org
]
```

### 2. `invoicing`: the commission invoice targets the SELLER

```jsonc
"invoicing": {
  "objectIsAnInvoiceObject": true,
  "configuration": {
    "providerName": null,                  // internal provider; or a configured InvoiceProvider
    "issuePolicy": "onSourceCreate",       // each commission row issues its invoice on create
    "customerProperty": "sellerOrgId",     // the SELLER is the invoice's customer
    "amountProperty": "feeAmount",         // the FEE is the invoice amount
    "currencyProperty": "currency",
    "statusProperty": "invoiceState",
    "numbering": { "series": "COM", "resetPeriod": "yearly" },
    "collection": {
      "collectionMethod": "sendInvoice",   // bill the seller on terms…
      "daysUntilDue": 14
      // …or "chargeAutomatically" to collect the fee from the seller's
      // stored payment method when the invoice finalizes.
    }
  }
}
```

`customerProperty` and `amountProperty` are the two bindings that make this *the
commission invoice*: the counterparty is the seller organization, the amount is the fee,
never the sale total. See [`InvoicingConfig`](../../spec/InvoicingConfig.md).

### 3. `fiscalization`: platform as seller, seller as buyer

```jsonc
"fiscalization": {
  "objectIsFiscalized": true,
  "configuration": {
    "fiscalProviderName": "trFiscal",
    "jurisdiction": "TR",
    "sellerParty": {                          // the PLATFORM issues this document
      "taxIdStaticValue": "9990004141",       // or bind the project-level seller
      "nameStaticValue": "Platform AS",       // identity on the fiscalProviders[]
      "addressStaticValue": "…"               // entry and omit the block
    },
    "buyerParty": {                           // the SELLER receives it, per row
      "taxIdProperty": "sellerTaxId",
      "nameProperty": "sellerLegalName",
      "addressProperty": "sellerAddress"
    },
    "submitPolicy": "onInvoiceFinalized",
    "onFiscalError": "continueRoute"
  }
}
```

`buyerParty` is **per-row by design**: the three `PropRefer` bindings read the commission
row's own columns, which is exactly why step 1 composes the seller's tax identity onto the
row. A Turkish `buyerParty` must bind a name source; a commission invoice is a real B2B
document, so bind the tax id too. See
[`FiscalizationConfig`](../../spec/FiscalizationConfig.md) and
[`FiscalPartyConfig`](../../spec/FiscalPartyConfig.md).

### 4. The sale object: split money, NO platform document

```jsonc
// dataObject saleOrder: the intermediation sale
"checkout": { "objectIsAnOrderObject": true,
              "configuration": { "billingModel": "intermediary", /* … */ } },
"marketplace": {
  "objectIsMarketplaceObject": true,
  "configuration": {
    "providerName": "stripeMain",
    "sellerAccountProperty": "sellerAccountId",   // the seller's connected account, on the ROW
    "amountProperty": "grossAmount",
    "applicationFeeProperty": "commissionAmount", // the platform's cut, deducted at charge
    "currencyProperty": "currency"
  }
}
// deliberately NO "invoicing" and NO "fiscalization" block here
```

The absence is the point: the platform's generated service never builds an invoice or
fiscal document for the sale row. The buyer's document is the seller's to issue. The split
pays the seller (`grossAmount - commissionAmount`) at charge time, and the
`commissionAmount` the row already carries is the same figure the commission row bills.

The intermediary model needs **no payout gate and no inbound surface**: those belong to the
reseller model's *mutabakat* leg.

### The aggregated per-period variant

For monthly (or weekly) commission billing, keep the same two blocks and change the row's
grain: one commission row per **(seller, period)** instead of per order.

- Properties: replace `saleOrderId` with `periodStart` / `periodEnd` (or a `periodKey` like
  `2026-09`); `feeAmount` is the **sum** of the period's commissions.
- Write the row from a scheduled business API (a cron-triggered create that aggregates the
  period's settled sales), composing the seller identity columns exactly as in step 1.
- `issuePolicy: "onSourceCreate"` then issues one invoice per seller per period the moment
  the aggregation row lands; numbering, collection and fiscalization are unchanged.

Per-order and per-period are the same composition at different grains: nothing else moves.

## Reseller in brief, and the hybrid case

The reseller model uses none of the above: the **order object itself** carries `invoicing` +
`fiscalization` (full amount, buyer as `buyerParty`) with `billingModel: "reseller"` on its
checkout configuration, the charge is plain (full amount to the platform), and a marketplace
block, if the object carries one for seller attribution, must declare
`settlementMode: "platformSettled"` (reseller + a splitting marketplace block is the
`BILLING_MODEL_RESELLER_WITH_MARKETPLACE_SPLIT` design-time ERROR). Seller earnings then
settle platform-side through the earnings ledger and settlement instructions described
above, reconciled against the seller's **inbound** invoice; the
[enterprise-integration surface](../../spec/EnterpriseIntegration.md) covers ERP payment-order
delivery.

**Hybrid platforms need two provider accounts.** A project can run both models side by side,
for example events sold as reseller, experiences as intermediary. On iyzico this is not
optional bookkeeping: a marketplace-active iyzico merchant account **cannot take unsplit
charges** (the vendor requires a `subMerchantKey` on every payment), so a hybrid project runs
**two merchant accounts of the same brand**: a plain account for the reseller objects, a
marketplace-activated one for the intermediary objects, as two `paymentProviders[]` entries,
each object binding its own via `providerName`.

**Seller legal form is a project policy, not a pattern stance.** Which legal forms may onboard
as sub-merchants (private person, sole proprietorship, limited company, mapped to the
provider's sub-merchant types) is a per-project decision with real liability consequences:
repeated high-volume sales by private individuals can make the platform co-liable in TR.
Declare the policy on the marketplace block:

```jsonc
"marketplace": {
  "configuration": {
    "allowedSellerTypes": ["PRIVATE_COMPANY", "LIMITED_OR_JOINT_STOCK_COMPANY"]
  }
}
```

The list is written in the bound provider brand's **own** sub-merchant vocabulary (iyzico:
`PERSONAL`, `PRIVATE_COMPANY`, `LIMITED_OR_JOINT_STOCK_COMPANY`, with the `LIMITED_COMPANY`
input alias accepted; stripe: `individual`, `company`). Enforcement is two-ended: a token the
brand does not know is a design-time ERROR (`MARKETPLACE_UNKNOWN_SELLER_TYPE`), and the
generated onboarding route (`POST /v1/payments/connected-accounts`) rejects a disallowed or
missing seller type with a **422 `SELLER_TYPE_NOT_ALLOWED`** naming the policy, before any
provider call. Brands without a known vocabulary are not judged, and an absent/empty list
means no policy (legacy).

## See also

- [The invoice to fiscalization chain](invoice-fiscalization-chain.md): the document lifecycle, serials and money convention both models ride.
- [Payment workflow](./payment-workflow.md): checkout, subscription and marketplace basics.
- Patterns: [`Invoicing`](../../spec/Invoicing.md), [`InvoicingConfig`](../../spec/InvoicingConfig.md), [`Fiscalization`](../../spec/Fiscalization.md), [`FiscalPartyConfig`](../../spec/FiscalPartyConfig.md), [`MarketplaceConfig`](../../spec/MarketplaceConfig.md), [`SettlementGateConfig`](../../spec/SettlementGateConfig.md).
