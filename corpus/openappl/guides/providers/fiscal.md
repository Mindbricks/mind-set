---
title: "Fiscal providers: behaviour rules"
---

# Fiscal providers: behaviour rules

A `projectSettings.fiscalProvidersSettings.fiscalProviders[]` entry names WHO
submits a project's documents into a government fiscal network, and an
`objectSettings.fiscalization` block on a data object opts that object in. This
page states what a conforming compiler must make the generated service do: the
injected ledger, the document state machine, routing, serial numbering, the
bridges, inbound polling and the payout gate, and the integrator quirks that
change what a compiler must do. Turkey (network `GIB`) is the first
jurisdiction.

The configuration keys of every brand, their defaults and which are secret are
in the generated [fiscal provider catalogue](../../spec/providers/fiscalProvider.md);
this page does not repeat them. See also
[The invoice to fiscalization chain](../capabilities/invoice-fiscalization-chain.md),
[Intermediation vs reseller billing](../capabilities/intermediation-vs-reseller-billing.md),
[invoice providers](invoice.md), [FiscalizationConfig](../../spec/FiscalizationConfig.md),
[FiscalProvider](../../spec/FiscalProvider.md),
[FiscalCapabilities](../../spec/FiscalCapabilities.md) and
[FiscalizeAction](../../spec/FiscalizeAction.md).

## Family rules

### Fiscalization is its own axis

- Invoicing produces the **commercial** document (the receivable);
  fiscalization adapts it to, or reports it into, the **government's**
  infrastructure. The two opt-ins combine freely; an invoice provider of one
  vendor and a fiscal provider of another is legal. In reporting-style regimes
  the fiscalized thing may be transaction data with no invoicing block.
- The pipeline is classify -> prepare -> validate -> sign -> submit -> track ->
  distribute/report -> archive.
- **There is no internal fiscal brand.** Fiscalization always talks to a
  government infrastructure through an integrator, or through the
  credential-free `mock` brand in development and test. Every brand is native:
  there is no bridge family and no `integrationName`.
- **Routing is the policy's job, never the designer's.** The jurisdiction
  policy picks the route per document (see [Turkish routing](#turkish-routing-buyer-typing-decides-the-scheme));
  a blueprint never writes `if (buyer.isEFaturaUser)`.
- **The ledger is regulatory.** The injected fiscal tables have **no REST write
  surface at all**, not even admin row writes. Operators drive the state
  machine through resubmit, cancel and query-status actions.
- Several entries may share a brand (two integrator apps for two seller
  companies).
- A brand added to the enumeration before its adapter exists is
  *declarable*: the blueprint accepts it, but binding an object to it is a
  typed run-time error naming the status. A compiler refuses a construct it
  does not implement.

### Binding an object

- `fiscalProviderName` is implicit when exactly one entry is declared.
- `buyerParty` and `sellerParty` slots each bind a property or a static value.
  The buyer `taxId` slot is load-bearing: it keys the routing.
- **The seller identity lives on the provider entry** (`sellerTaxId`,
  `sellerName`, `sellerAddress`, `sellerDistrict`, `sellerCity`), not on the
  objects: the seller tax id must equal the authenticated integrator account's
  own, and it varies per environment (a sandbox account's tax id is not the
  production one). These keys are not secret.
- Seller resolution order: the object's `sellerParty` binding, then the bound
  entry's identity, then unbound. Unbound is a design-time ERROR
  (`FISCAL_SELLER_PARTY_UNBOUND`). Declare `sellerParty` only when the issuer
  varies per row (a marketplace whose merchants invoice in their own name) or
  one object is pinned to a different seller. A per-tenant seller identity is
  not supported.
- `sellerDistrict` (ilçe, `cbc:CitySubdivisionName`) and `sellerCity` (il,
  `cbc:CityName`) are mandatory `PostalAddress` members in UBL-TR; an
  integrator refused a document without them (`XML SEMA KONTROLUNDEN
  GECEMEDI`). When they are unset the builder keeps the XML schema-valid with
  a generic default (`Merkez` plus the country context), fit for test
  documents only.
- Every integrator's `environment` defaults to `test`: a fresh project can
  never submit a live fiscal document by omission.
- **Ownership.** Every document row is stamped with `ownerId` from the
  **owning object's** owner column (the property with
  `sessionSettings.isOwnerField: true`, or the row's own `id` on the auth
  `user` object), not from the invoice source object. Without an owner column
  every document has `ownerId: null`: customers can never read one, only
  operator callers can. The validator warns `FISCAL_OWNER_UNBINDABLE`; a
  compiler never guesses an owner column.
- `FISCALIZATION_JURISDICTION_UNSUPPORTED` warns when the jurisdiction has no
  policy.

### Capabilities

Defaults derive from the brand; an entry's `capabilities` block only narrows
them (and widens the opt-in `supportsInboundDocuments`).

| Capability | GIB integrators | mock | custom |
|---|---|---|---|
| `supportsClearance` | no | yes | no |
| `supportsExchange` | yes | yes | no |
| `supportsReporting` | yes | yes | no |
| `supportsValidation` | yes | yes | no |
| `supportsSigning` | yes | yes | no |
| `supportsCancellation` | yes | yes | no |
| `supportsCreditNote` | yes | yes | no |
| `supportsStatusQuery` | yes | yes | no |
| `supportsInboundDocuments` | no (opt-in: `nilvera`, `uyumsoft`) | yes | no |
| `supportsArchiving` | yes | yes | no |
| `supportsBuyerLookup` | yes (`foriba`: no) | yes | no |
| `webhookStyle` | `none` | `none` | `none` |

- The three mode flags (clearance, exchange, reporting) are independent: one
  entry can serve several regimes.
- `custom` defaults everything to false: an entry declares what its gateway
  can do, or gets nothing.
- A TR route demands the sign step; a non-signing provider on it is a typed
  configuration error.

### Credential fallback

- Outside production, a shipped brand whose required credentials are absent or
  still hold an authoring placeholder runs on the deterministic **mock adapter
  under the entry's name**, with a once-per-provider warning naming the
  missing settings (names only). No real document is submitted and returned
  ids do not exist upstream.
- In production this fallback is refused with **503
  `FISCAL_PROVIDER_UNAVAILABLE`** naming the missing settings; the service still
  boots and no mock is constructed. Production is decided by the deployment
  slot, and an unknown slot counts as production. Then, per `onFiscalError`:
  - `throwError`: the error propagates and nothing is written;
  - `continueRoute` (default): the document is recorded `failed` with a
    `fiscal.failed` event (`afterFiscalFailed` fires), its
    `metadata.lastFiscalError` carries `step: "resolve"` and
    `errorCode: "FISCAL_PROVIDER_UNAVAILABLE"`, and its `scheme` reads
    `UNRESOLVED` until a resubmit resolves the route. The invoice work goes on
    (the payment is allocated, the invoice reaches `paid`). A resubmit before
    the credentials are set answers the same 503 and leaves the row unchanged.
    A TR resubmit later than the window is refused (see
    [Resubmitting a days-old document](#resubmitting-a-days-old-turkish-document)).
- An explicitly authored `provider: "mock"` entry is supported in every
  environment.
- Unauthenticated fiscal webhook ingress answers the same 404 for an unknown,
  a webhookless and a credential-refused provider; it logs the credential
  refusal and persists no event.

## The data model

### Injected tables

| Table | Scope | Holds |
|---|---|---|
| `sys_<Object>FiscalDocument` | per fiscalized object | one row per fiscal document: scheme, status, ETTN, wire serial, provider ids, artifact refs, rejection reason |
| `sys_fiscalEvent` | per service | the transition outbox: every state move, poll observation and webhook event, one dispatcher path for all three |
| `sys_fiscalArtifact` | per service | artifact content (the built UBL XML, provider PDFs, receipts); bytes never land on the ledger row |
| `sys_fiscalSerialSequence` | per service | the wire-serial counter, one row per (`serialScope`, prefix, year), allocated atomically at prepare |

- What `sys_fiscalEvent` stores: the provider's raw answer on a webhook or poll
  row is masked (tokens, secrets, card data, e-mail and phone replaced by
  `[REDACTED]`; a credential-named `name=value` pair inside a string value,
  URL queries included, is masked too); on a poll row every longer vendor text
  in that answer is cut to 200 characters; an inbound-document row stores only
  the `providerDocumentId` pointer; an engine transition row stores only the
  transition (`previousStatus`, `statusLiteral`, `providerDocumentId`, `uuid`,
  `rawStatus`, `submittedAt`, `clearedAt`), never the document, its metadata
  or its rejection reason.
- A dispatcher failure stores a credential-redacted `errorMessage` bounded to
  255 UTF-16 units (a high surrogate at the cut is omitted); a processed event
  clears it.
- The row's `artifacts` column carries references (`sys_fiscalArtifact/<rowId>`),
  and that list is the authorization boundary for downloads: only refs the row
  carries are downloadable.

### The ledger row

| Column | Meaning |
|---|---|
| `invoiceId` | the local `sys_<X>Invoice` row the document was built from; nullable (reporting-only regimes) |
| `providerName` | the bound entry |
| `network` | the government infrastructure (GIB, SDI, KSeF, ...) |
| `scheme` | the resolved route; Turkey: `TR_EFATURA` (exchange) or `TR_EARSIV` (reporting) |
| `documentType` | `invoice` / `creditNote` / `receipt` |
| `direction` | `outbound` for issued documents, `inbound` for integrator-inbox documents addressed to the platform |
| `providerDocumentId` | the provider-side id, assigned at submission |
| `uuid` | the network document id; Turkey: the **ETTN** |
| `documentSerial` | the wire serial (Turkey: the GIB `cbc:ID`, `^[A-Z]{3}[0-9]{13}$`), allocated at prepare and persisted at once; null on serial-less regimes; with vendor numbering, the number the integrator answered (null until known, `metadata.serialAssignment: vendor`) |
| `statusLiteral` | the canonical status |
| `rawStatus` | the provider's literal, verbatim, for forensics; application code reads `statusLiteral` |
| `rejectionReason` | the network's reason when `rejected`, or the integrator's error text when `failed`; a vendor text over 200 characters is cut with `... [truncated, full text in the server log]` and logged whole as a `FiscalProviderErrorBody` line |
| `metadata.providerStatus` | the integrator's last observed answer: `statusLiteral`, `rawStatus`, `statusCode`, `message`, `detail`, `provisional`, `observedAt` (message and detail up to 1000 characters); rewritten whenever the answer changes, also when the state cannot move |
| `artifacts` | artifact refs |

### The document state machine

```
draft -> prepared -> submitted -> pending -> accepted -> completed
                        |          |         |  \         |
                        v          v         v   v        v
                     rejected   rejected  canceled  failed / rejected
                        |                           (integrator overturn,
                        v                            re-check window)
                    (resubmit re-prepares the SAME row, fresh ETTN)
```

Canonical statuses: `draft`, `prepared`, `submitted`, `pending`, `accepted`,
`rejected`, `completed`, `canceled`, `failed`.

- `rejected` and `failed` are **not terminal**: `resubmit` re-runs the route
  against the corrected source on the same row, minting a fresh ETTN. Only
  `completed` and `canceled` are terminal.
- An authority **rejection** is a normal, correctable outcome. A **technical
  failure** (transport, outage, provider 5xx) marks the row `failed`
  (retryable), and `onFiscalError` decides whether the surrounding flow
  proceeds (`continueRoute`, default) or halts (`throwError`).
- A provider literal the adapter's mapping does not know maps to
  `unknown-<raw>`: the raw literal is kept, the state machine no-ops on it, and
  a new vendor state can never crash the pipeline.
- **Integrator overturn.** The one way out of `accepted` / `completed` besides
  cancellation: during the re-check window the integrator reports a failure
  for a document it had accepted. The row moves to `failed` (or `rejected`)
  with the integrator's text and `afterFiscalFailed` (`afterFiscalRejected`)
  fires.
- **Operator restore.** The one way from `failed` back to `accepted`: an
  operator `query-status` of a *not-issued* row (`rawStatus` `NotFound`, "has
  no document with ETTN") when the adapter now proves the integrator holds
  that document. The row moves through the normal accept event
  (`afterFiscalAccepted`, `clearedAt`, provisional re-check). The status cron,
  the re-check, webhooks and a `FiscalizeAction` `queryStatus` never take this
  edge. A restore is proven against one failure: it bumps
  `metadata.operatorRestore.generation`, the re-check can fail the row again
  with the same verdict, an older restore event never re-applies, and the
  event replay route refuses a restore event (409 `FISCAL_EVENT_NOT_REPLAYABLE`).
- **One issued document per source.** A restore never gives a source row a
  second issued document: when another document of the same `sourceObjectId`
  is `accepted` or `completed`, it answers 409 `FISCAL_SOURCE_ALREADY_ACCEPTED`
  naming it, and the row stays `failed` with `metadata.duplicateIssue`
  (`duplicateOf`, `integratorStatus`, `action: cancelAtIntegrator`). The check
  runs before the restore is recorded and again when it is applied; a
  per-source claim row in the event outbox lets one of two simultaneous
  sibling restores win, the other answering the retryable 409
  `FISCAL_RESTORE_IN_PROGRESS` (nothing changed). A claim is released by
  deleting its row; a claim left by a crash (holder not issued, no pending
  restore, older than two minutes) is superseded. Only a sibling that IS
  issued blocks; `failed`, `rejected`, `canceled` and in-flight siblings do
  not. Query the document to keep first.
- **Automatic accept of a duplicate.** The automatic accept paths (the
  engine's submit and post-submit poll, the status cron, the re-check,
  webhooks) never refuse the integrator's acceptance. A sibling accepted while
  another document of the same source is already `accepted` / `completed`
  becomes `accepted` too, annotated `metadata.duplicateIssue`
  (`detectedOn: automaticAccept`, `action: cancelAtIntegrator`), one
  `FiscalDuplicateDocument` WARN line names the source and both documents, and
  `afterFiscalAccepted` does not fire for it: a source runs its accept effects
  once.
- **Accept effects run once per source.** The first document is arbitrated by
  an `effects-claim:<object>:<sourceObjectId>` journal row (released by delete,
  superseded when its holder is no longer issued). The winner re-reads the
  siblings and runs the effects unless one of them already is the source's
  effects document; the document that ran them carries `metadata.acceptEffects`
  (`ranAt`, `eventId` written just before the hook, `hookDone: true` after it
  returns). An unfinished stamp reserves the effects: redelivery or replay
  resumes the hook; a completed marker prevents a second run. A failed
  acceptance without a stamp does not establish an effects document. An
  issued, unflagged sibling without a stamp whose acceptance is settled also
  counts as the effects document; a sibling still being accepted never does. A
  sibling flagged as a duplicate never becomes the effects document: when the
  first is cancelled, the next accepted unflagged sibling runs the effects.
  Hook business writes must be idempotent, because a process can stop after
  them and before the completion marker. A query-status may resume a failed
  restore's unfinished effects without applying another restore generation.

### Who moves a row past `submitted` / `pending`

Every GIB integrator answers a submit with an id and **no verdict**; the
adapters return `pending`. Four readers advance the row, all through the same
reducer:

1. **The post-submit poll.** Right after a verdict-less submit the engine asks
   the provider **once** (one `queryStatus`, no sleep, no retry; only when the
   entry has `supportsStatusQuery`). `accepted` completes the document in the
   same request (`pending -> accepted -> completed`; a provisional acceptance
   stops at `accepted`); `rejected` lands `rejected` with the reason; anything
   else (still waiting, an unmapped literal, a poll transport failure) leaves
   the row parked. A poll failure is never a pipeline failure and never marks
   the row `failed`. The result carries `postSubmitPoll` for the caller's logs.
2. **The fiscal status cron**, every 5 minutes, on `submitted` / `pending` rows
   of poll-bound entries, plus the re-check below.
3. **A manual query-status** (the admin route or `FiscalizeAction`
   `queryStatus`).
4. **A webhook**, for entries whose `webhookStyle` is not `none`.

Every status call hands the adapter the row's own ETTN and wire serial, so the
adapter can verify the answer is about THIS document.

What the integrator answered is readable through the API, not only in its
panel:

- the row's `rejectionReason` and `metadata.providerStatus`;
- the `query-status` answer: the refreshed row plus `providerObservation`, the
  integrator's answer to that call in the `metadata.providerStatus` shape, even
  when the state cannot move;
- the server log: one `FiscalStatusObservation` line per integrator status
  answer (submit, post-submit poll, every cron poll and re-check, every manual
  query-status), also when nothing changed, naming the operation, the document
  (`fiscalDocumentId`, `documentSerial`, `uuid`, `providerDocumentId`, the prior
  status), the status literal, `rawStatus`, `providerStatusCode`,
  `providerMessage`, `providerDetail`, `rejectionReason`, `provisional` and the
  raw answer as `rawPayload` (up to 4000 characters). A failed or rejected
  answer logs at ERROR, every other at INFO.

### Provisional acceptance and the re-check window

When an integrator accepts a document and reports it to the authority later (a
step that can still fail), the adapter marks the acceptance **provisional**:

- the row stays `accepted`, never `completed`; `afterFiscalAccepted` fires and
  the document counts as issued;
- the status cron re-checks it every 60 minutes by default (an operator setting,
  5 to 1440) for 168 hours by default (0 to 2160) counted from `clearedAt`; a
  value outside the bounds takes the default;
- a re-check that finds a failure moves the row to `failed` / `rejected`
  (`afterFiscalFailed` / `afterFiscalRejected` fires);
- when the window closes, the cron asks once more and completes the row if the
  integrator still answers acceptance.

A row `completed` without `metadata.providerStatus` whose `clearedAt` is inside
the window is re-checked the same way for as long as its last answer is not a
final acceptance. A final acceptance completes at once.

### Determinism and the frozen snapshot

Preparation is deterministic and replayable: the issue timestamp comes from the
finalize snapshot (never the clock inside the pipeline), the ETTN is
pre-assigned or minted through the store, and the document builder has no
clock. Fiscalization always reads the **frozen** invoice snapshot
(`sys_<X>Invoice` and its lines), never the live domain row.

### The exemption code on the line snapshot

Why a line's VAT is zero is product data (books under KDV 13/n, code `335`; an
export under 11/1-a, `301`; a 0% line that is not exempt, `351`). The chain:

| step | where | field |
|---|---|---|
| source row | the line item object (`invoiceLineRelation.lineItemObject`) | the column bound as `vatExemptionCodeProperty` (and optional `vatExemptionReasonProperty`) |
| relation-less | the invoicing object itself | the twins next to `vatRateProperty` |
| invoice create | the line input | `vatExemptionReasonCode` / `vatExemptionReason` (trimmed; empty is null) |
| line snapshot | `sys_<X>InvoiceLine` | `vatExemptionReasonCode`, `vatExemptionReason`, frozen with the line |
| fiscal source | the document source lines | the same two fields |
| document | the UBL-TR builder | the line's `cac:TaxSubtotal`, and the document bucket of its (rate, code) |

Later product edits never change an issued invoice. The resolution order and
the invoice type are in [Zero-VAT lines](#zero-vat-lines-exemption-codes-and-the-invoice-type).

### Line amounts on the UBL-TR document

A GIB integrator recomputes every `cac:InvoiceLine` at 2-decimal precision:
`LineExtensionAmount = InvoicedQuantity x PriceAmount - AllowanceCharge`.

- The amounts (`LineExtensionAmount`, `AllowanceCharge`, the taxes, every
  total) carry exactly 2 decimals from the frozen line. The unit price,
  `cbc:PriceAmount` (an unbounded `xsd:decimal`), carries **up to 8 decimals**.
- The builder keeps the frozen unit price whenever the identity holds;
  otherwise it emits the nearest 8-decimal price that makes it hold (a
  discounted VAT-inclusive line, a line frozen with a 2-decimal net price, a
  net on a half-kuruş tie, a net price with more than 8 decimals). Example:
  7 x 10.00 at 18% VAT-inclusive is `PriceAmount` 8.47457627 against
  `LineExtensionAmount` 59.32; 0.5 x 9999.99 is emitted as 9999.99000001.
- The identity is judged exactly on the emitted text:
  `|quantity x price - allowance - lineExtension| < 0.005`.
- A kuruş price that already satisfies the identity is emitted
  byte-identically (`100.00`) at any magnitude; the price is read from its
  exact decimal text, never through floating-point scaling.
- Quantities and amounts are written in plain notation (`0.0000001`), never
  exponent form.
- **Rounding adjustment.** From a quantity of 1,000,000 on, the valid window
  (0.01/quantity wide) can fall between two 8-decimal prices; a zero quantity
  has no helpful price. Then `PriceAmount` is the 8-decimal price closest to the
  window, recomputed from the line's own amounts
  ((`LineExtensionAmount` + allowance) / quantity), never the stored price; and
  the line carries one extra `cac:AllowanceCharge` with the reason `Yuvarlama`
  (an allowance when quantity x price overshoots, a charge when it falls short)
  closing the remaining gap. The adjustment is always less than
  quantity x 0.00000001 + 0.005. On an exact half-kuruş residual the other
  grid point is used; of the two grid points, the one needing the smaller
  adjustment wins. Examples: 1,500,000 x 0.01 gross at 20% is 0.00833334 with a
  rounding allowance of 0.01; 123,456,789 x 9.99 gross at 18% is 8.46610169 with
  a rounding charge of 0.61.
- Under the fallback, `LineExtensionAmount`, `TaxExclusiveAmount`,
  `TaxInclusiveAmount`, the taxes and `PayableAmount` never change;
  `AllowanceTotalAmount` includes a rounding allowance; a rounding charge adds
  `ChargeTotalAmount`. A document without an adjustment is byte-identical to one
  built without this rule.

### Events and hooks

- Eight `fiscal.*` events ride the outbox. Five fire designer hooks
  (`afterFiscalSubmitted`, `afterFiscalAccepted`, `afterFiscalRejected`,
  `afterFiscalCanceled`, `afterFiscalFailed`); `fiscal.prepared`,
  `fiscal.pending` and `fiscal.completed` are hook-silent. Poll observations
  and webhook events ride the same dispatcher path as engine transitions.
- **What a hook sees.** `fiscalDocument` is the ledger row after the
  transition. For an engine transition the hook runs from the outbox after the
  engine's whole run, so the transition's own `statusLiteral`,
  `providerDocumentId`, `uuid`, `rawStatus`, `submittedAt` and `clearedAt` are
  laid over the row: `afterFiscalAccepted` sees `accepted`, not `completed`.
  `metadata`, `rejectionReason` and `artifacts` are the row's values when the
  hook runs.
- The owning row id is `fiscalDocument.metadata.sourceObjectId`. On an engine
  pipeline failure `fiscalDocument.metadata.lastFiscalError` is
  `{ step, message }` (integrator text bounded); a failed poll or webhook
  verdict carries the text on `fiscalDocument.rejectionReason`.
- A row that mirrors the fiscal state needs a hook on every outcome it shows:
  `afterFiscalFailed` covers technical failures (integrator 5xx, transport, a
  prepare step that throws, a failed status on a poll or webhook); without it
  the row keeps its old value while the document sits `failed`.
- `afterFiscalFailed` fires once per `failed` transition. A resubmit that fails
  again fires again; a resubmit that dies before its first transition (serial
  allocation, body build, artifact write) only refreshes `lastFiscalError` and
  does not fire; a repeated `failed` poll observation is a no-op.
- A throwing hook condition is logged, skips that hook, and later hooks run.

## Serial numbering

### The serial namespace

- `serialScope` carries the bound entry, so every entry keeps its own counter
  rows. Inside an entry each series has its own prefix and row: GIB keeps
  e-Fatura and e-Arsiv on separate series, each consecutive on its own, so
  `TR_EARSIV` draws from `serialPrefix` and `TR_EFATURA` from
  `eInvoiceSerialPrefix`.
- The two prefixes must differ: equal prefixes are refused at design time
  (`FISCAL_SERIAL_NAMESPACE_SHARED`) and at submission (typed 400
  `FISCAL_SERIAL_PREFIX_SHARED_BY_SCHEMES`). A Turkish entry that can route to
  e-Fatura without `eInvoiceSerialPrefix` WARNS
  (`FISCAL_PROVIDER_EINVOICE_SERIAL_PREFIX_MISSING`), and an e-Fatura
  submission on it is refused with a typed 400 naming the key before any
  integrator call. Both prefixes must be registered with the integrator.
- Allocation commits independently of the caller's transaction (its own
  transaction, or an atomic increment outside the caller's session). A caller
  rollback burns the number; it is never reissued.
- **One counter per entry per service is a real limit.** Each fiscalizing
  service has its own database, so two services bound to the SAME entry keep
  two counters for one series; they burn serials out of the shared account
  until the lagging counter catches up. Design-time validation refuses it with
  the ERROR `FISCAL_SERIAL_NAMESPACE_SHARED`; the remedy is one entry per
  fiscalizing service, each with its own registered `serialPrefix`.
- The same ERROR refuses two **different** entries that resolve to one series,
  across services or inside one. Two entries are one series when they have the
  same brand and the same prefix (a prefix is compared against both prefix
  keys of the other entry), unless something shows they are different
  accounts:
  - both declare `sellerTaxId`: equal ids are one taxpayer series, different
    ids are two;
  - otherwise different default endpoints (both declare `environment`, one
    `production` and one not, and neither declares a `baseUrl`; a `baseUrl`
    slot on either, even blank, proves nothing) or a different non-blank value
    of a required credential key prove two accounts. The value is judged as
    the generated service loads it (a value with a newline is trimmed, matching
    quotes are dropped); only exactly `production` selects the production URL,
    so `production ` with a trailing space is a test endpoint;
  - otherwise they are one series. The finding lists every colliding entry
    with the service that binds it.
  The check runs per deploy slot (`dev`, `stage`, `prod`, `test`), applying that
  slot's environment overlay (prefixes, seller tax id, credentials, endpoint
  settings); blanked secret overlay values are unknown and prove nothing. A
  prefix left blank for deploy time cannot be compared and is not checked. The
  fix is to change one entry's prefix, or to declare each entry's own
  `sellerTaxId` when they really are different taxpayers.
- Two vendor-numbered entries are never reported; a vendor-numbered and a
  platform-numbered entry on one series are refused. "Vendor-numbered" means
  the static `serialAssignment: "vendor"` with no per-environment overlay row
  setting it to anything else; such an overlay makes the entry
  platform-numbered for that environment, and the finding names the row
  (`details.serialAssignmentOverlay`). A value left blank for deploy time is
  judged as platform numbering.
- At run time, a service whose entry is bound by other services refuses
  platform numbering on it with a typed 400
  `FISCAL_SHARED_ENTRY_PLATFORM_NUMBERING_REFUSED` before any serial is drawn,
  whatever the deployed `serialAssignment` says (the admin routes answer the
  400; under `continueRoute` on the invoice bridge the document is skipped with
  a logged warning and no row).

### Issue date, issue time and the serial year (Turkey)

- A Turkish document is dated on Turkey's calendar (Europe/Istanbul, UTC+3 all
  year): `cbc:IssueDate`, `cbc:IssueTime`, every reference and internet-sale
  date, and the 4-digit year inside the serial are read from the snapshot's
  `issuedAt` in Istanbul time. A sale at 21:30Z is dated the next day; a New
  Year's Eve sale after 21:00Z is a next-year document and draws from the next
  year's counter row. A newly allocated serial always carries the year of
  `cbc:IssueDate`.
- An `issuedAt` that is not an ISO 8601 timestamp or date is a typed 400 naming
  it, before the counter moves.
- A resubmit on the same Turkey day keeps the serial. If the issue date was
  changed across a year boundary before that resubmit, a kept serial naming the
  old year is refused with typed 409 `FISCAL_SERIAL_YEAR_MISMATCH` naming both
  years; cancel and re-issue instead.
- A resubmit whose **scheme changes** (an e-Arsiv refused because the buyer is
  registered, routed to e-Fatura) draws a fresh serial from the new series; the
  released number stays on the row as `metadata.releasedDocumentSerials`
  (`serial`, `fromScheme`, `toScheme`, `reason`, `releasedAt`). A row whose
  serial does not start with the prefix its series is configured with now is
  released the same way with `reason` `prefixMismatch`. A same-scheme,
  same-prefix resubmit keeps its serial.
- **The burned serial rule.** A serial the provider refuses as *already used*
  is burned (the network's namespace is persistent): the resubmit clears it and
  prepare mints the next one; the burned serial is recorded in
  `metadata.burnedDocumentSerials` and the failed attempt's events. Whether a
  refusal is a serial conflict is the adapter's classification; the default
  never burns.

### Platform-numbered resubmit recovery

- Before a platform-numbered row that reached the integrator is re-issued, an
  adapter that can look a document up by ETTN does so. A document held in a
  non-failure state is **adopted** with its original ETTN, serial and stored
  body, and nothing is sent again. A failed, rejected or canceled document, or
  a positive not-held answer, permits another issue. Burning a refused serial
  also requires this confirmation that its ETTN is not live. An inconclusive
  lookup refuses the correction with the adapter's typed 502.
- An adapter without the lookup re-sends a non-burn correction (transport
  failures and ordinary rejections included) under the kept serial and a fresh
  ETTN. A classified serial burn without a lookup, or a burn with no ETTN to
  verify, refuses with 409 `FISCAL_VENDOR_DOCUMENT_UNVERIFIED`. Both refusals
  leave the row unchanged. `uyumsoft` and `mock` have the lookup; the other GIB
  adapters do not.

### Where a series can have gaps

**A gapless series is not guaranteed.** A number is taken at prepare and never
given back. The counter can move past numbers no issued document carries:

1. the increment commits on its own, and the work after it fails before the
   serial is written onto the row, or a caller transaction rolls back;
2. a document that fails locally or is refused and is never resubmitted keeps
   its serial on a `rejected` / `failed` row;
3. an e-Arsiv resubmit on a later day is re-dated and draws a fresh serial (the
   previous one is `supersededSerial` in `metadata.issueDateRedates`);
4. the burn-and-retry on an "already used" refusal (`metadata.burnedDocumentSerials`);
5. a scheme or prefix change on resubmit (`metadata.releasedDocumentSerials`);
6. a floor above the counter (below).

A vendor-numbered entry has none of these; its one gap is a document the
integrator numbered and the network then refused, recorded in
`metadata.supersededVendorSerials` when it is re-issued. A canceled document
keeps its number; that is not a gap.

Reconciliation reads two things:

- `GET /v1/fiscal/admin/serials` (operator-gated, read-only) lists every
  counter row with `providerName`, `prefix`, `series`, `scheme`, `year`,
  `lastNumber`, the floor fields (`sequenceStart`, `sequenceStartInvalid`,
  `sequenceStartYearInvalid`, `sequenceStartYear`, `sequenceStartApplies`),
  `nextNumber`, `nextNumberBlockedBy` and `nextSerial`, plus `total`,
  `truncated` and `assignments` (one item per bound entry: `serialAssignment`,
  `serialPrefix`, `eInvoiceSerialPrefix`, `eArchiveInternetSerialPrefix`,
  `serialAssignmentInvalid`). `series` / `scheme` are null for a retired
  prefix. When the engine would refuse every allocation of a series (a
  malformed floor or floor year, or equal prefixes), `nextNumber` and
  `nextSerial` are null and `nextNumberBlockedBy` carries the refusal text. It
  reads up to 10000 rows, then answers `truncated: true` with the `total`. A
  vendor-numbered entry keeps no counter; a row left from its platform-numbered
  past has no next number. On a multi-tenant project only a platform operator
  may call it.

  ```json
  {
    "data": [
      {
        "providerName": "mainUyumsoft",
        "prefix": "ABE",
        "series": "eInvoice",
        "scheme": "TR_EFATURA",
        "year": 2026,
        "lastNumber": 12,
        "sequenceStart": null,
        "sequenceStartInvalid": false,
        "sequenceStartYearInvalid": false,
        "sequenceStartYear": null,
        "sequenceStartApplies": false,
        "nextNumber": 13,
        "nextNumberBlockedBy": null,
        "nextSerial": "ABE2026000000013"
      }
    ],
    "total": 1,
    "truncated": false,
    "assignments": [
      {
        "providerName": "mainUyumsoft",
        "serialAssignment": "platform",
        "serialPrefix": "ABC",
        "eInvoiceSerialPrefix": "ABE",
        "eArchiveInternetSerialPrefix": null,
        "serialAssignmentInvalid": false
      }
    ]
  }
  ```

- each object's ledger list, `GET /v1/fiscal/admin/<object>`, with every row's
  `documentSerial`, `scheme`, `statusLiteral` and the metadata lists above.

Every number from 1 (or the floor) up to `lastNumber` is on an issued
document, on a row that was not issued, in one of the metadata lists, or
consumed by path 1.

### Floors: starting past an account's high-water mark

- When the integrator account already issued numbers under a prefix outside
  this counter, set `serialSequenceStart` (e-Fatura: `eInvoiceSerialSequenceStart`)
  instead of editing the counter table. It is a floor applied on every
  allocation: next = `max(lastNumber, serialSequenceStart - 1) + 1`. It never
  lowers a counter, never changes a serial a document carries, and leaves the
  burned-serial rule as it is. It is a whole number from 1 to 999999999;
  anything else is a typed 400 naming the key at submission. A floor does not
  make two services on one entry safe.
- The counter row is per year: `serialSequenceStartYear`
  (`eInvoiceSerialSequenceStartYear`) scopes the floor to allocations whose
  serial year equals it, and other years start at 1. Without the year the floor
  applies every January again and validation WARNS
  (`FISCAL_SERIAL_SEQUENCE_START_UNSCOPED`). A year that is not 4 digits is a
  typed 400 at submission, and a static one an error at design time
  (`FISCAL_SERIAL_SEQUENCE_START_YEAR_INVALID`).

| Entry configuration | 2026 allocation | 2027 allocation |
|---|---|---|
| `serialSequenceStart: 5000`, `serialSequenceStartYear: 2026` | 5000, then 5001, ... | 1, then 2, ... |
| `serialSequenceStart: 5000`, no year | 5000, then 5001, ... | 5000 again (WARNING) |

## Turkish routing: buyer typing decides the scheme

The buyer's type is **derived from the bound tax id, never declared**: absent
or blank is a **consumer**, 11 digits (TCKN) a **person**, 10 digits (VKN) a
**company**; anything else is a typed 400 naming the binding before any
provider call.

| Buyer type | Lookup | Outcome | Scheme | Mode |
|---|---|---|---|---|
| consumer | never | tax id `11111111111` on the document | `TR_EARSIV` | reporting |
| person | capability (default; `lookupIndividuals` not `false`) | registered | `TR_EFATURA` | exchange |
| person | capability (default) | not registered | `TR_EARSIV` | reporting |
| person | never (`lookupIndividuals: false`, or no capability) | - | `TR_EARSIV` | reporting |
| company | capability present | registered | `TR_EFATURA` | exchange |
| company | capability present | not registered | `TR_EARSIV` | reporting |
| company | no capability, `assumeBuyerRegistered` | forced exchange | `TR_EFATURA` | exchange |
| company | no capability, otherwise | reporting fallback | `TR_EARSIV` | reporting |

- Individuals are looked up by default: a TCKN may belong to a registered sole
  proprietor, who must receive e-Fatura. `lookupIndividuals: false` without a
  lookup capability WARNS (`FISCAL_LOOKUP_INDIVIDUALS_NO_LOOKUP`).
  `11111111111` is never looked up.
- `assumeBuyerRegistered` is a deployment setting of the provider entry, not a
  `FiscalizationConfig` field.
- When an e-Arsiv reaches a registered buyer after all, the integrator refuses
  it; the adapter maps that refusal to a typed 422
  `FISCAL_BUYER_REGISTERED_FOR_EINVOICE` saying the buyer is a registered
  e-Fatura user routed to e-Arsiv. The resubmit routes it to e-Fatura with a
  fresh serial from that series.
- **Profiles.** `TR_EFATURA` carries ProfileID `TEMELFATURA`, or `TICARIFATURA`
  when `FiscalizationConfig.useCommercialInvoiceProfile` is true. `TR_EARSIV`
  carries `EARSIVFATURA` plus a sending type: `ELEKTRONIK` when internet-sale
  content or a buyer e-mail is present, `KAGIT` otherwise.
- **Buyer name carrier.** A company buyer's name is `cac:PartyName`; a person or
  consumer is `cac:Person`, every token but the last as `cbc:FirstName` and the
  last as `cbc:FamilyName`. A single-token name is written into both
  (`cbc:FirstName` is mandatory in `PersonType`).
- **Cancellation windows** (policy constants): e-Fatura commercial objection 8
  days, e-Arsiv cancellation 7 days. They concern canceling the platform's own
  outbound documents, not returns.

### Resubmitting a days-old Turkish document

A resubmit rebuilds from the snapshot, whose `issuedAt` is the original date.
e-Arsiv data is reported in daily periods by the end of the next day, and
integrators refuse back-dated resends. The rule covers the resubmit of a
`rejected` / `failed` document only; a first submission is never re-dated or
refused by it.

| Resubmitted on | `TR_EARSIV` | `TR_EFATURA` |
|---|---|---|
| the same Turkey day | sent as it was: original date, same serial | sent as it was |
| a later day, up to and including day 7 | **re-dated to now**: `cbc:IssueDate` / `cbc:IssueTime` = the resubmit time (Istanbul), fresh serial, fresh ETTN, same commercial content | sent as it was, original date, serial rules unchanged |
| day 8 or later | **refused**: HTTP 422 `FISCAL_RESUBMIT_WINDOW_EXPIRED`, before any write or integrator call; issue a new invoice | **refused** the same way |

- The 7 days are VUK art. 231/5 (the starting day not counted, VUK art. 18),
  counted from the EARLIER of the original issue date and the internet-sale
  shipment date. A last day on a holiday is not extended. The window is always
  counted from the snapshot's original date, so re-dating never extends it.
- A re-dated row keeps `metadata.originalIssuedAt` (set once) and one
  `metadata.issueDateRedates` entry per re-date (`issuedAt`, `issueDate`,
  `originalIssueDate`, `lastAllowedDate`, `supersededSerial`, `redatedAt`).
- An operator setting may only shorten the window (a whole number 0 to 7, for
  both schemes); above 7 is a typed 400 naming it.

### Customer returns are not fiscalized

- A customer's return of a fiscalized sale is **not** fiscalized. For an
  e-Arsiv sale it is documented outside the platform (the consumer's signed
  return section, VUK GT 509 section IV.2.4.5 item 6, or a gider pusulası,
  VUK art. 234); for an e-Fatura buyer, the **buyer** issues the IADE invoice
  (the platform at most receives it inbound).
- Credit notes for such returns stay internal: a `sys_<X>CreditNote` row
  (`issueCreditNote`) never reaches the network.

### Credit notes (IADE): the fiscalizing party's own returns only

- A `creditNote` document is `cbc:InvoiceTypeCode` **IADE** and carries one
  `cac:BillingReference/cac:InvoiceDocumentReference` per returned invoice: the
  original's 16-character serial (`cbc:ID`), its Turkey-local issue date and
  `cbc:DocumentTypeCode` `IADE`, written right after `cbc:LineCountNumeric`.
- It is for a return where the **fiscalizing party** gives goods back (to its
  own supplier), modelled as a row of the same object, classified by
  `documentTypeMap`, with `originalRefProperty` naming the property that holds
  the **original row's id** (not an invoice id; a list names several originals):

  ```json
  "fiscalization": { "configuration": {
    "jurisdiction": "TR",
    "documentTypeMap": { "js": "source.originalOrderId ? 'creditNote' : 'invoice'" },
    "originalRefProperty": "originalOrderId"
  } }
  ```

- For each original row the service reads its **issued** outbound documents
  (by `sourceObjectId`; not a credit note; `submitted`, `pending`, `accepted`
  or `completed`; with a serial). Exactly one invoice must be behind them; its
  `documentSerial` is the reference and its invoice's issue date the reference
  date. A document re-dated on resubmit is referenced with the date of its
  **last re-date**, so `cbc:ID` and `cbc:IssueDate` name the same document. On
  a multi-tenant object only the return row's tenant is read.
- Design time (TR): a `documentTypeMap` whose source names the quoted literal
  `'creditNote'` with no `originalRefProperty` is the ERROR
  `FISCAL_CREDIT_NOTE_ORIGINAL_UNBOUND`; a wrong property is `PROPERTY_NOT_FOUND`.
- Run time: no original, an original without an issued document, more than one
  issued invoice, a serial that is not 16 characters, or an unreadable date is
  a typed 400 at prepare, **before the integrator is called**; the document is
  marked failed and keeps its serial. This applies on both schemes.
- A credit note is never submitted automatically under
  `submitPolicy: onInvoiceFinalized`; it needs a designer-declared credit-note
  source and mapping.

## Internet sales (e-commerce)

`FiscalInternetSaleConfig` binds the e-Arsiv internet-sale section (website,
payment method and date, shipment date, tracking number, the carrier party),
property or static per slot.

- The content is emitted on **`TR_EARSIV` routes only**.
- **Internet sale is an object-level fact.** An object whose fiscalization
  declares an `internetSale` block is fiscalized as an internet sale on every
  row (the phrase, `cac:Delivery` per `carrierMode`, the `ELEKTRONIK` sending
  type), even a row whose slots are empty. There is no per-row detection; a
  mixed-channel object is split into two objects or two configurations.
- The date slots must hold an ISO 8601 date or instant; they are written as the
  Turkey-local `xs:date`. Anything else is a typed 400 naming the slot before
  the integrator call.
- The document carries the phrase **"Bu satış internet üzerinden
  yapılmıştır."** as a `cbc:Note` after any designer note,
  pending integrator confirmation of a dedicated element.

### The carrier party (VUK 509)

The logistics record is mandatory on an internet-sale invoice of goods. It is
written in `cac:Delivery` in the order `cbc:TrackingID` -> `cac:CarrierParty` ->
`cac:Despatch/cbc:ActualDespatchDate`. The carrier party is a complete party:
`cac:PartyIdentification` (`schemeID` VKN or TCKN), the title in
`cac:PartyName` (a TCKN carrier also gets `cac:Person` when its title splits),
and a `cac:PostalAddress` with the il/ilçe defaults.

| `carrierMode` | Carrier party | Data from |
|---|---|---|
| `carrierCompany` (also an empty mode with a shipment slot bound) | the carrier's title, VKN/TCKN and address, with tracking number and shipment date | the designer's carrier data object, or static values |
| `selfDelivery` | the seller's own title, VKN/TCKN and address | the seller identity |
| `noShipment` (also an empty mode with no shipment slot bound) | none, no `cac:Delivery` | nothing is shipped |

- A *shipment slot* is any carrier source (`carrierDataObject`,
  `carrierRefProperty`, a `carrier*Property` column, `carrierTitleStaticValue`,
  `carrierTaxIdStaticValue`), the legacy `shipmentCarrierProperty` /
  `shipmentCarrierStaticValue`, `shipmentDateProperty` or
  `trackingNumberProperty`. An empty mode with no shipment slot is
  `noShipment` with the WARNING
  `FISCAL_INTERNET_SALE_CARRIER_DEFAULTED_NO_SHIPMENT`; with one it is
  `carrierCompany` and needs a carrier source. An explicit mode is never
  second-guessed. One shared predicate decides this for the validator and the
  generated code.
- `carrierRefProperty` and `trackingNumberProperty` are columns of the
  fiscalized object; the `carrier*Property` slots are columns of
  `carrierDataObject`, a data object of the **same service**. A tenant-level
  carrier object is read only within the order row's tenant (another tenant's
  row is treated as missing); a shared carrier object is read for every
  tenant; under an order object without a tenant a tenant-level carrier object
  is refused at design time (`FISCAL_INTERNET_SALE_CARRIER_TENANT_UNREACHABLE`).
  This is decided at design time; the generated code carries no run-time
  tenancy test. Statics back an empty carrier column. The legacy
  `shipmentCarrierProperty` / `shipmentCarrierStaticValue` is only a title
  fallback and never makes a carrier alone.

```json
"internetSale": {
  "websiteStaticValue": "www.example.com",
  "paymentMethodProperty": "paymentMethod",
  "paymentDateProperty": "paidAt",
  "shipmentDateProperty": "shippedAt",
  "trackingNumberProperty": "trackingNo",
  "carrierMode": "carrierCompany",
  "carrierDataObject": "shippingCarrier",
  "carrierRefProperty": "carrierId",
  "carrierTitleProperty": "title",
  "carrierTaxIdProperty": "taxNumber",
  "carrierAddressProperty": "street",
  "carrierDistrictProperty": "district",
  "carrierCityProperty": "city"
}
```

- **Never a name-only or empty carrier.** Design time: a TR block that binds
  anything must declare `selfDelivery`, `noShipment`, or `carrierCompany` with a
  tax id source **and** a title source, or it is the ERROR
  `FISCAL_INTERNET_SALE_CARRIER_UNBOUND` (except the empty-mode `noShipment`
  default). Related: `FISCAL_INTERNET_SALE_CARRIER_OBJECT_NOT_FOUND`,
  `FISCAL_INTERNET_SALE_CARRIER_BINDING_INCOMPLETE` (object without the order's
  reference, or the reverse), `PROPERTY_NOT_FOUND`,
  `FISCAL_INTERNET_SALE_CARRIER_TENANT_UNREACHABLE` and the WARNING
  `FISCAL_INTERNET_SALE_CARRIER_IGNORED` (slots the mode never reads). Run time,
  on `TR_EARSIV`: a carrier tax id that does not resolve or is not a VKN/TCKN,
  or a carrier without a title, is a typed 400 at prepare before the integrator
  call; the document keeps its serial, so a fix and resubmit leaves no gap.

## The invoice bridge and the submit policy

- `submitPolicy: onInvoiceFinalized` hooks the one point both finalize paths
  share (the in-process finalize and an external system-of-record webhook), so
  the document is always built from the frozen snapshot. The bridge exists only
  when the object is fiscal-bridged: fiscalization on, the policy set, a
  resolvable provider binding, and not merchant-of-record suppressed.
- `submitCondition` is evaluated over `invoice` (the finalized invoice) and
  `source`, not the row as `this`.
- `continueRoute` (default) logs and contains bridge failures (source loading,
  `submitCondition`, party resolution, engine failures): the bridge logs
  `fiscalization skipped (continueRoute)` and returns null when resolution
  fails before the engine. `throwError` propagates the original error. A
  rejection is a normal `rejected` outcome either way.
- The bridge reads the source in the persisted invoice header's own tenant;
  metadata never overrides it.
- Reporting-only manual submission (fiscalization without invoicing) is a
  typed 400: no standalone amount, line or currency slots exist, so the object
  has no document source. The ledger and admin surface are still generated.
- `FiscalizeAction` drives submit, cancel, query-status and resubmit (by
  `fiscalDocumentIdProperty`, for a rejected or failed document) from a
  workflow for objects whose lifecycle does not ride the bridge.

## The merchant-of-record rule

When the object's payments run through a merchant-of-record provider (the MoR
is the legal seller), the fiscal bridge is suppressed: the MoR issues the tax
document, and a second submission would double-report the sale. A compiler
derives the suppression from the payment entry's **effective capabilities** at
design time, never from a brand list (see [payment providers](payment.md)).

## Cron and webhook gating

- `supportsStatusQuery` emits the **fiscal status cron** (every 5 minutes): it
  polls non-terminal documents, writes synthetic events with deterministic ids
  into `sys_fiscalEvent`, and the same dispatcher advances the state.
- `webhookStyle` other than `none` emits the fiscal webhook ingress
  (two-phase: verify and persist, then dispatch).
- Unlike invoicing, the two are **not** mutually exclusive: an entry may push
  and still be polled.
- Overlapping cron ticks are prevented within one process; there is no
  distributed lease, and the dispatcher has no claim: reducer checks and unique
  provider-event keys give idempotency.
- Fiscal webhook bodies are capped at 5 MiB before provider routing, streamed
  bodies included; larger is 413 `CONTENT_TOO_LARGE`.

## The generated route surface

Operator-gated (the payment console's operator gate):

```
GET  /v1/fiscal/admin/events                       the outbox, filterable
GET  /v1/fiscal/admin/serials                      the wire-serial counters (read-only)
POST /v1/fiscal/admin/events/:eventId/replay
GET  /v1/fiscal/admin/<object>                     ledger list
GET  /v1/fiscal/admin/<object>/:documentId         ledger row
GET  /v1/fiscal/admin/<object>/:documentId/artifacts/:artifactId
POST /v1/fiscal/admin/<object>/:documentId/resubmit
POST /v1/fiscal/admin/<object>/:documentId/cancel
POST /v1/fiscal/admin/<object>/:documentId/query-status
```

- `events` and `serials` read service-level tables: on a multi-tenant project
  only a platform operator may call them.
- `query-status` answers the refreshed row plus `providerObservation`.
- Cancel is guarded to `accepted` documents; a `completed` document answers 409
  naming this.

## Zero-VAT lines: exemption codes and the invoice type

GIB requires every zero-amount KDV (`0015`) TaxSubtotal to carry a
`cbc:TaxExemptionReasonCode` and a non-empty `cbc:TaxExemptionReason`; the code
also decides which `InvoiceTypeCode` the document may have.

- **Code resolution for a 0% line:** the line item's own code
  (`invoiceLineRelation.vatExemptionCodeProperty`, or the twins on a
  relation-less object), snapshotted on the line; then the invoice-wide code
  (`sys_<X>Invoice.vatExemptionReasonCode`); then the provider entry's
  `vatExemptionReasonCode`; then `350`.
- **Text:** the line's `vatExemptionReasonProperty`, else the **official GIB
  text of the code** from the shipped list (UBL-TR Kod Listeleri 1.36, section
  1.8: the 2xx partial and 3xx full exemptions and 351), so `335` is written as
  "KDV 13/n Basılı Kitap ve Süreli Yayınların
  Teslimleri" without configuration. A provider-wide `vatExemptionReason` pairs
  only with the provider-wide code. A code the list does not carry needs its
  text bound, or the document is refused with 400
  `FISCAL_UBL_TR_EXEMPTION_REASON_MISSING`.
- A code on a line whose VAT rate is not 0 is a 400
  `FISCAL_UBL_TR_EXEMPTION_CODE_ON_TAXED_LINE` at prepare.
- **Buckets.** Taxed lines are grouped per rate; 0% lines per **(rate, code)**.
  Every line's own `cac:TaxTotal/cac:TaxSubtotal` carries the line's pair.

| codes on the document | GIB allows | written |
|---|---|---|
| none, or only `351` (0% but not exempt) | any type | `SATIS` |
| any 2xx / 3xx exemption code, `350` included | `ISTISNA`, `IADE`, `IHRACKAYITLI`, `SGK`, `YTBISTISNA`, `YTBIADE` | `ISTISNA` |
| 7xx (export-registered) | `IHRACKAYITLI`, `IADE`, `SGK` | refused, 422 |
| 8xx (special base) | `OZELMATRAH`, `IADE`, `SGK` | refused, 422 |
| anything else (non-numeric, 555, a non-KDV code) | not on a 0% KDV bucket | refused, 422 |

- A credit note stays `IADE`. Taxed lines stay on an `ISTISNA` document: books
  at 0% (`335`) plus shipping at 20% is one `ISTISNA` invoice with two buckets.
  (Typing the document from the VAT total alone sent that mixed document as
  `SATIS` and the integrator refused it: "Uyumsuz fatura tipi".)
- `IHRACKAYITLI` and `OZELMATRAH` documents are not produced: a 7xx / 8xx code
  is 422 `FISCAL_UBL_TR_EXEMPTION_TYPE_MISMATCH`; a code outside the KDV lists
  is 422 `FISCAL_UBL_TR_EXEMPTION_CODE_UNSUPPORTED`. Both at prepare; the
  document stays resubmittable.
- **The pre-submit type check.** Every built document is read back and each
  0015 subtotal's code is checked against `cbc:InvoiceTypeCode` with the table,
  plus "a zero-amount 0015 bucket carries a reason"; a mismatch is 422
  `FISCAL_UBL_TR_EXEMPTION_TYPE_MISMATCH`.
- Design time: code and text bindings must name existing properties; the twins
  next to a bound `invoiceLineRelation` are an ERROR; a text binding without a
  code binding is a WARNING; a provider `vatExemptionReasonCode` that is not 3
  digits is a WARNING.

## Schema conformance

- **Every UBL-TR shape the builder can produce must validate against the
  official GIB UBL-TR 1.2.1 XSD.** A compiler tests this with the authority's
  own schema package, vendored unmodified and checksum-pinned. The builder
  writes the unsigned document; the test adds only the two signing elements
  (`ext:UBLExtensions`, `cac:Signature`) in the authority's sample form, so any
  other error is the builder's. A change to the Turkish document is not done
  until this suite passes.
- The shape matrix covers: e-Fatura TEMELFATURA, TICARIFATURA and IADE; e-Arsiv
  KAGIT, ELEKTRONIK and IADE (IADE with references to one and to two invoices);
  every internet-sale binding alone and together, and the carrier party in
  each `carrierMode` (VKN and TCKN carriers, a sparse address, self-delivery,
  no shipment); the zero-VAT buckets; consumer, person and company buyers;
  sparse parties with the defaults; multi-line documents with discounts and
  both rounding adjustments; a foreign currency and XML escaping.
- Census tests keep the matrix complete: every element the builder can write,
  every optional input field set and absent, and every code value (ProfileID,
  InvoiceTypeCode, sending type, reference type codes) must come from at least
  one shape that passes the XSD. Comparing the builder with its own golden
  output is not conformance: it pins an invalid element as correct.
- **The pre-submit structure check.** At run time every UBL-TR document the
  builder produces (invoice, credit note, internet sale, the rebuild of a
  correction) goes through a light structure check before it leaves; a failing
  document is a typed 422 `FISCAL_UBL_TR_STRUCTURE_INVALID` at prepare, so the
  integrator is never called. The message names the element and the expected
  list:

  ```
  Invoice/cac:Delivery/cac:CarrierParty has invalid child element cac:PartyName;
  expected: cbc:WebsiteURI cbc:EndpointID cbc:IndustryClassificationCode
  cac:PartyIdentification (GIB UBL-TR PartyType sequence).
  ```

  It checks the child order, minimum and maximum of every party (supplier and
  customer `cac:Party`, `cac:CarrierParty`, every `PartyType` element, so
  `cac:PartyIdentification` must come first and be present); the parts of a
  party (`cac:PartyIdentification`, `cac:PartyName`, `cac:PostalAddress` with
  the il/ilçe pair, `cac:Country`, `cac:PartyTaxScheme`, `cac:Person`); the
  blocks that hold parties (`cac:AccountingSupplierParty`,
  `cac:AccountingCustomerParty`, `cac:Delivery`); and, beyond the XSD, a
  non-blank `cac:PartyIdentification/cbc:ID`. Its tables are pinned to the XSD
  by the conformance suite. It is not a full XSD validation, and GIB's
  schematron business rules are a separate layer; the ones the builder
  enforces itself (the serial format, the IADE reference, the exemption-code
  and invoice-type rules) have their own tests.

## Inbound documents and the payout gate

Turkish marketplaces run two models. In the **merchant model** the platform
sells in its own name: it invoices the end customer, the shop invoices the
platform (an **inbound** document), and the payout to the shop is conditional
on that invoice arriving and matching. In the **intermediary model** the
platform collects on the shop's behalf and invoices the shop for the
commission only (see [the recipe](#recipe-the-intermediary-model)).

### Inbound ingestion

- When a non-tenant-scoped fiscalized object binds an entry whose effective
  capabilities include `supportsInboundDocuments`, the service gets a **fiscal
  inbound cron** that polls the integrator's inbox and writes
  `direction: 'inbound'` rows into that object's ledger.
- **Not on a tenant-scoped object.** An object is tenant-scoped here when its
  ledger carries a tenant field; the ledger inherits the tenant level of its
  source object. Vendor inbox documents carry no tenant, so such objects are
  excluded: no cron when every inbound-capable object is tenant-scoped, only
  eligible objects polled in a mixed service. The validator WARNS
  `FISCAL_INBOUND_TENANT_UNSUPPORTED`; outbound fiscalization stays valid. A
  service-level ledger in a multi-tenant project is eligible; there the admin
  routes refuse tenant-level operators and document reads admit the owner and
  platform operators only.
- **Capability defaults.** `mock` defaults to true (its in-memory inbox is
  seedable). Every GIB brand defaults to false; `nilvera` and `uyumsoft`
  implement the fetch and opt in with
  `capabilities: { "supportsInboundDocuments": true }`; `elogo`, `foriba` and
  `izibiz` answer a typed 501.
- **One polling entry per integrator account.** Every entry that enables the
  flag polls the account's one inbox; the ingestion claim is keyed per entry,
  so two entries (or two services binding a shared entry) can each ingest the
  same invoice and each release a payout. Enable it on exactly one entry per
  account. Two entries of one brand with the same `sellerTaxId` or identical
  credentials that both enable it WARN `FISCAL_INBOUND_SHARED_ACCOUNT`.
- **Idempotency.** Each document is claimed journal-first on `sys_fiscalEvent`
  with providerEventId `inbound:<providerDocumentId>` under the
  `(providerName, providerEventId)` unique key, so a re-poll never inserts a
  row twice. The journal row is written `processed` (a record, not a dispatch:
  no state advance, no hook on arrival) and stores a pointer
  (`providerDocumentId`, `resourceId` = the ledger row id), not a second copy.
- **Matching fields only.** `metadata` carries the matching slice:
  `sellerTaxId`, `total`, `currency`, `documentNumber`, `issuedAt`,
  `reference`.

### The payout gate

```jsonc
"marketplace": {
  "objectIsMarketplaceObject": true,
  "configuration": {
    "providerName": "stripeMain",
    "payoutGate": {
      "requiresIncomingInvoice": true,
      "matchTolerance": 0.01,        // absolute, major units; null = 0.01
      "onMismatch": "hold"           // hold | notify; null = hold
    }
  }
}
```

Declarative: the compiler wires the payout manager, the scheduler and inbound
ingestion. A project without the block gets byte-identical payout code.

**Matching.** An expected payout is reconciled against the open inbound
invoices:

1. **Seller:** the invoice's issuer tax id equals the connected account's
   `taxId` (else `metadata.taxId`) on the `sys_<X>ConnectedAccount` row the
   payout is addressed to.
2. **Reference:** when the payout carries a `transferGroup` and a
   seller-matched invoice references it (note or document number), that invoice
   is judged alone.
3. **Currency:** must agree when both sides carry one.
4. **Amount:** `|invoice total - payout amount| <= matchTolerance`, compared as
   exact decimals: an amount exactly at the boundary matches; beyond it (sub-cent
   included) stays on hold; amounts are not rounded first.

One invoice releases one payout: the consumed invoice is stamped with the
payout's row id (`metadata.__matchedPayoutId`).

**Lifecycle.**

- The scheduler consults the gate before firing a due row; a match releases
  through the unchanged payout path. `on_demand` payouts consult it inside the
  payout creation, before any provider call.
- The gate needs a cadence the platform books (`on_demand` or `scheduled`). A
  `PayoutAction` on a `provider_driven` owner pays at once without the gate, so
  that design is the ERROR `PAYOUT_ACTION_PROVIDER_DRIVEN_RESERVE_OR_GATE`; set
  the payment provider's `payoutCadence.mode`.
- A missing invoice, or a mismatch under `onMismatch: hold`, parks the row
  `statusLiteral: 'held'` with `metadata.payoutGate.holdReason`:
  `awaiting_inbound_invoice`, `seller_tax_id_unbound`, `amount_mismatch` or
  `currency_mismatch`. Held rows are listed with `?status=held`.
- Every hold fires `afterPayoutHeld` (the `payout.held` event; `resource` is a
  normalized payout).
- `onMismatch: notify`: a present but mismatching invoice fires the hook and
  is logged, and the payout releases anyway. A missing invoice always holds.
- Each scheduler tick re-evaluates held rows first, so an arrival releases in
  one tick.
- Design time: the validator warns (never gates) when the gate can only hold
  forever (no fiscal providers, none inbound-capable, or no fiscalized object
  in the service); a negative `matchTolerance` is an error.

### Recipe: the intermediary model

No gate and no inbound surface: enable `objectSettings.invoicing` on the
commission record (buyer: the shop; `sourceObjectName` correlation ties each
commission invoice to its payout), and add `objectSettings.fiscalization` on
the same object with the shop as `buyerParty`, so the ordinary bridge submits
it. The consumer receipt stays a non-fiscal document. This is not
merchant-of-record suppression, which is a payment capability. Both models may
coexist in one project.

## mock

- Deterministic, credential-free, any network; every capability true,
  `webhookStyle: none`. Supported in every environment.
- Its inbox is in memory and seedable in tests.
- It implements the ETTN recovery lookup and simulates vendor-assigned
  numbering (so an entry on the credential fallback keeps working) and the
  internet-sale prefix.
- It is also the credential fallback of a shipped brand outside production
  (see [Credential fallback](#credential-fallback)).

## custom

- An escape hatch: `baseUrl` (plus optional `apiKey`) with a registered adapter.
  Every capability defaults to false.

## elogo

- SOAP; the session id is a body field; numeric status codes.
- The invoice and fiscal axes never collapse into one brand: the same vendor's
  invoice products are invoice providers, and `elogo` is its fiscal transport.
- No ETTN recovery lookup; its accepted literal is read as a final acceptance.
- No inbound fetch (typed 501).

## foriba

- The modern REST tax API with OAuth2 `client_credentials` (`clientId`,
  `clientSecret`); verdicts arrive on a notification rail. The brand keeps its
  `foriba` spelling after a vendor rename: a rename is an adapter edit, never a
  schema break.
- **No buyer lookup**: the vendor documents no taxpayer-lookup endpoint (it
  resolves the recipient's registration itself), so `supportsBuyerLookup` is
  false and the TR policy takes its no-lookup fallback.
- No ETTN recovery lookup; accepted literal read as final. No inbound fetch
  (typed 501).

## nilvera

- REST with a bearer API key; `multipart/form-data` submit.
- Implements the inbound fetch (opt-in). No ETTN recovery lookup; accepted
  literal read as final.

## izibiz

- SOAP; `SESSION_ID` in the request-header body element; optional
  `senderAlias`.
- Its e-Arsiv request carries an `EARSIV_PROPERTIES` block that is not filled
  from the internet-sale data.
- No ETTN recovery lookup; accepted literal read as final. No inbound fetch
  (typed 501).

## uyumsoft

SOAP 1.1 with a per-request WS-Security `UsernameToken`; optional
`senderAlias`. This brand carries the most integrator-specific rules.

### Status truth

- **Which document.** The status read is asked by the ETTN the platform minted,
  plus the id the submit answered when that differs. The verdict is the answer
  whose `@InvoiceId` IS the ETTN. An answer about another document, an empty
  answer or a "not found" refusal is **not issued**: `failed` with
  `Uyumsoft has no document with ETTN <ettn>: ...`, never `accepted`.
- **Verified acceptance.** An `Approved` is checked on the outbox list filtered
  by the ETTN (`InvoiceIds` is an `ArrayOfString`, sent as
  `<InvoiceIds><string>ETTN</string></InvoiceIds>`). The item is matched by
  `<DocumentId>` (the ETTN); its `<InvoiceId>` is the document number, compared
  with the row's `documentSerial`; `<LocalDocumentId>` is never matched. An
  empty filtered answer, a "not found" refusal, or another number than the
  row's is `failed`; a disagreeing outbox status (for example `Error`) wins. A
  lookup that cannot be answered fails the poll and the row stays where it was.
- **Inconclusive is not "not issued".** A lookup that lists documents but none
  with our ETTN decides nothing: a `FiscalStatusObservation` line with operation
  `acceptanceVerify` (status `pending`, listed ids in the detail), the poll
  fails, the row stays. The operator `query-status` answers HTTP 502
  `FISCAL_ACCEPTANCE_UNVERIFIED` with the ETTN and HOW MANY other documents were
  listed; the ids stay in the log only (on a shared account they can be other
  tenants' documents), and no vendor payload is carried.
- **Unreadable is not "not issued".** Only an explicit answer decides. A 200
  body without the operation's result element (a proxy or maintenance page, a
  truncated answer) fails the poll and leaves the row unchanged. A 200 submit
  answer without its result is a submit failure like a transport timeout (row
  `failed`, `lastFiscalError.step` `submit`, no vendor id taken from the
  document's own ETTN, resubmittable); a 200 cancel answer without its result
  is an unreadable cancel error, never a cancellation and never a refusal.
- **Provisional on e-Arsiv.** e-Arsiv documents reach GIB later in a report
  package and the status enum has no "reported" state: an e-Arsiv `Approved` is
  provisional and re-checked for the window. An e-Fatura `Approved` completes at
  once.
- **Error detail.** `@StatusCode` and `@Message` ride every answer
  (`providerStatusCode` / `providerMessage`, for example `2000` /
  `1195 SISTEM HATASI`); a failed or rejected verdict also reads the status
  with logs (the envelope's GIB code and the document's log lines) into
  `providerDetail`. A failure of that read never changes the verdict.
- **Serial reuse.** When an `Approved` status has no outbox document, suspect
  serial reuse on the account: set the floor above the account's highest
  issued number, or use a dedicated account per environment. Never share one
  test account across environments with one prefix.
- **Restore.** A row failed as "no document with ETTN" is restored by the
  operator `query-status` only when the status read answers `Approved` and the
  outbox names the row's ETTN under its number (see
  [Operator restore](#the-document-state-machine)). Do not resubmit a row whose
  document the integrator holds: a resubmit sends a second document.
- **Registered-buyer refusal.** "e-fatura tipinde olan faturalarin PROFILEID
  alani EARSIVFATURA olamaz" (matched with or without Turkish letters) maps to
  422 `FISCAL_BUYER_REGISTERED_FOR_EINVOICE`. No equivalent text is known for
  the other brands; their refusal surfaces as their own message.
- An account needs two registered series: e-Arsiv (`serialPrefix`) and e-Fatura
  (`eInvoiceSerialPrefix`).

### The internet-sale envelope

The e-Arsiv submit also takes `EArchiveInvoiceInfo.InternetSalesInfo`, and the
integrator decides whether a document is an internet sale by whether its
`WebAddress` is filled. The adapter sends it **exactly when the UBL carries the
internet-sale section**, from the same resolved data (handed over by the
policy, never re-derived):

| `InternetSalesInfo` | From the document |
|---|---|
| `WebAddress` | the `WEB_SITE` reference |
| `PaymentDate` | `cbc:PaymentDueDate` as `YYYY-MM-DDT00:00:00`; `xsi:nil` when absent (required by the WSDL) |
| `PaymentType` | the payment method mapped onto `KREDIKARTI/BANKAKARTI`, `EFT/HAVALE`, `KAPIDAODEME`, `ODEMEARACISI`, `DIGER` (case, Turkish letters and separators ignored; common English names such as `creditCard` or `bank_transfer` mapped too); any other text is `DIGER - <text>` |
| `ShipmentInfo/SendDate` | `cac:Despatch/cbc:ActualDespatchDate`; `xsi:nil` when absent |
| `ShipmentInfo/Carier` (attributes `SenderTcknVkn`, `SenderName`) | `cac:CarrierParty`: the carrier, or the seller for `selfDelivery` |

`noShipment` sends no `ShipmentInfo`; `PaymentMidierName` has no source and is
not sent. Every member is a child ELEMENT in the order `WebAddress`,
`PaymentMidierName`, `PaymentType`, `PaymentDate`, `ShipmentInfo`; only
`Carier` carries attributes. Sending the scalars as attributes is ignored by
the service and every internet sale is refused with `Odeme turu bos gecilemez`.

### Vendor-assigned numbering

- `serialAssignment: vendor` (uyumsoft only): the integrator numbers each
  document when it accepts it and the platform keeps no counter. Any other
  brand refuses it (design-time ERROR `FISCAL_SERIAL_ASSIGNMENT_UNSUPPORTED`,
  typed 400 `FISCAL_VENDOR_SERIAL_UNSUPPORTED`); a value other than
  `platform` / `vendor` is `FISCAL_SERIAL_ASSIGNMENT_INVALID`. Both 400s are
  answered before the buyer lookup, on a first submission and a resubmit: nothing
  is looked up, sent or written.
- **The wire id.** `cbc:ID` carries only the prefix (`eInvoiceSerialPrefix` on
  e-Fatura, `serialPrefix` on e-Arsiv); unset, it is empty and the account's
  default series numbers it. The two prefixes must still differ. The platform
  still sets `cbc:UUID` and `LocalDocumentId` and keeps them across re-sends of a
  document never numbered.
- **The number.** The submit answer's `Number` is written to `documentSerial`.
  When that answer was lost, the resubmit first looks the ETTN up in the outbox
  (before the corrected source's buyer lookup); a held document is adopted with
  its number and not sent again (`metadata.recoveredVendorSubmission`). A status
  read naming the number fills an empty `documentSerial`.
- **Checks.** A returned number outside the configured prefix is logged and
  recorded in `metadata.vendorSerialWarnings`
  (`FISCAL_VENDOR_SERIAL_PREFIX_MISMATCH`, naming the `seriesType` `eInvoice`,
  `eArchive` or `eArchiveInternet` and the key to fix): the integrator does not
  refuse an undefined prefix, it numbers from the default series. A returned
  scenario that differs from the chosen channel is recorded the same way
  (`FISCAL_VENDOR_SCENARIO_MISMATCH`); the platform still decides the channel.
- **No floors**: the floor keys are ignored and validation WARNS
  (`FISCAL_SERIAL_ASSIGNMENT_VENDOR_IGNORES_FLOOR`).
- **Shared entries.** With no platform counter, several services may bind one
  vendor-numbered entry (`FISCAL_SERIAL_NAMESPACE_SHARED` does not apply). They
  still share the account's inbox (`FISCAL_INBOUND_SHARED_ACCOUNT`).
- **Three series types, three prefixes.** The integrator keeps a series per
  type (e-Fatura, e-Arsiv, e-Arsiv internet sale); a prefix selects a series of
  THAT type, and an undefined prefix silently falls to the type's default (an
  internet sale sent as `MAA` came back `INT2026000000530`). `cbc:ID` is the only
  request field for the series.

  | Document | `cbc:ID` in vendor mode |
  |---|---|
  | e-Fatura | `eInvoiceSerialPrefix` |
  | e-Arsiv internet sale with a website | `eArchiveInternetSerialPrefix` when set, else `serialPrefix` |
  | e-Arsiv internet sale without a website, every other e-Arsiv | `serialPrefix` |

  `eArchiveInternetSerialPrefix` is 3 uppercase letters (ERROR
  `FISCAL_INTERNET_SERIAL_PREFIX_INVALID`, typed 400 at submission), must differ
  from `eInvoiceSerialPrefix` (`FISCAL_SERIAL_NAMESPACE_SHARED`, typed 400
  `FISCAL_SERIAL_PREFIX_SHARED_BY_SCHEMES`) and may equal `serialPrefix`. On an
  account where series cannot be defined, set it to the account's default
  internet-sale prefix. Platform numbering ignores it (WARNING
  `FISCAL_INTERNET_SERIAL_PREFIX_PLATFORM_IGNORED`): a platform serial is a full
  number, used verbatim whatever the type, and every e-Arsiv draws from
  `serialPrefix`. A platform-numbered entry bound by a TR object with internet
  sale bindings and one without WARNS `FISCAL_INTERNET_SALE_SERIES_MIXED`; bind
  the internet-sale objects to a second entry, or use vendor numbering with the
  internet-sale prefix.
- **Resubmit in vendor mode.**
  - A synchronous refusal consumes no number: re-sent with the same ETTN and
    prefix, nothing burned (the later-day e-Arsiv re-date still applies).
  - A row without a number is looked up by its ETTN first: held in any state,
    it is adopted (nothing sent or rebuilt; the row keeps the scheme, type and
    stored body it was sent with, even when the corrected source would route
    elsewhere; `metadata.adoptedVendorDocument`,
    `metadata.recoveredVendorSubmission`); not held, the corrected document is
    sent under the same ETTN as a real first issuance; cannot tell, 502
    `FISCAL_ACCEPTANCE_UNVERIFIED` and nothing changes.
  - A `rejected` / `failed` row that carries a number is looked up first (a row
    can be failed while its document is live): held in a non-failure state, it
    is adopted and moves to `pending` for the next status read (the lookup's
    status is not a verdict); held as Error, Declined, Return or canceled, or
    not held, it is re-issued under a fresh ETTN and its number recorded in
    `metadata.supersededVendorSerials`; cannot tell, 502
    `FISCAL_ACCEPTANCE_UNVERIFIED`. An adapter without the lookup refuses with
    409 `FISCAL_VENDOR_DOCUMENT_UNVERIFIED`.
  - A platform serial on a row whose entry moved to vendor numbering is released
    (`reason` `vendorAssignment`) and never sent again.
  - The "already used" refusal is not a burned serial in vendor mode (the number
    is the integrator's, and every re-send gets the same one): the document fails
    with typed 409 `FISCAL_VENDOR_SERIAL_CONFLICT`.
- **Known limit.** When the outbox does not list a re-sent document yet, it is
  sent again under the same ETTN; the integrator's refusal of a duplicate ETTN
  was not probed and could surface as `FISCAL_VENDOR_SERIAL_CONFLICT`. Check
  the document at the integrator before acting on that error for a re-sent
  document.
- **Series rules.** Never mix platform and vendor numbering in one series (the
  integrator's counter does not skip explicitly issued numbers, so every vendor
  document is refused with `FISCAL_VENDOR_SERIAL_CONFLICT`). A series moved
  from platform numbering needs the integrator's counter set past the highest
  issued number, or a fresh prefix. A prefix must be defined for the account
  first; the API cannot list series, so a missing one shows up as
  `FISCAL_VENDOR_SERIAL_PREFIX_MISMATCH`.

### Inbox

- Lists the documents that arrived in the account (by their creation date
  there) and reads one document's signed UBL; the matching fields come from that
  UBL (supplier tax id, `PayableAmount`, currency, `cbc:ID`, `cbc:IssueDate`,
  `cbc:Note`).
- **Read-only**: the poll never marks documents as taken, so the "new" marks
  in the integrator's panel and in another reader stay.
- **Window**: each pass reads the last 14 days; an outage shorter than that
  loses nothing.
- A document's UBL is read once per running process and cached; a pass reads at
  most 50 new documents.
- **Decided documents only.** An inbound row is written once and never updated,
  and the gate releases only on an `accepted` row. A document whose status is
  still open (a commercial invoice awaiting an answer, a queued or failed
  delivery) is ingested when it settles: `Approved` as `accepted`, `Declined` or
  `Return` as `rejected`, `Canceled` as `canceled`; an item with no readable
  status is not ingested (the payout holds). Answer a commercial invoice within
  the 14-day window.
- **Bounded**: at most 10 list calls and 50 detail calls per pass, each with a
  30-second deadline, no call started after 2 minutes.
- A UBL whose `cbc:UUID` is not the listed ETTN is never ingested.

## Operations

Environment variables, console configuration, integrator onboarding and
credential minting, live sandbox test suites and the go-live checklist are
operations of a compiler and are not part of the language. Read the documentation of your compiler for them.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.
