---
title: Ledger (LedgerSettings)
---

# Ledger (LedgerSettings)

A first-class append-only-ledger pattern. Decorate any relational
data object with `objectSettings.ledgerSettings.objectOwnsALedger: true`
and every ROW of that object owns a ledger: the compiler generates the
lot / movement (/ reservation) satellite objects, a fully parametric
earn / consume / reserve / commit / release / getBalance / listEntries
API roster (plus the opt-in `adjust` correction and `voidBySource`
reversal members - see the roster section), the maturity / expiry / sweep / invariant crons,
and the movement events — all bound to the owner row by a single FK.

Use it wherever value accrues in discrete lots and drains under a
policy: loyalty points, wallet balances, prepaid credits, stock on
hand, seller payout balances. Hand-rolling this family reliably costs
several data objects, a FIFO library, and a season of race-condition
bugs; the pattern closes the four structural hazards that cause them:

1. **Read-modify-write without a predicate** — every balance mutation
   here is a compare-and-set on a generated version column inside one
   transaction (owner row + lot writes + the movement row).
2. **Two-sided operations shipped one-sided** — reserve/commit/release
   are generated as a matched family; a release restores the lots AND
   the balance in the same transaction, always.
3. **Thresholds and keys living in prose** — maturity, expiry and
   eligibility are filtered IN THE QUERY, never in post-query code.
4. **Duplicated near-identical FIFO code** — one engine per ledger,
   generated, with the consumption policy declared in the blueprint.

## Enabling it

```json
{
  "objectSettings": {
    "basicSettings": { "name": "walletAccount" },
    "ledgerSettings": {
      "objectOwnsALedger": true,
      "configuration": {
        "unit": { "name": "point", "scale": 1 }
      }
    }
  }
}
```

`objectOwnsALedger: true` is the on switch; `configuration` is a
[`LedgerConfig`](../../spec/LedgerConfig.md) and auto-initializes when the flag flips. The owning
service must use a **relational dbType** — every mutation is a
multi-row compare-and-set in one transaction, which has no
document-store emulation; mongodb is refused at design time
(`LEDGER_REQUIRES_RELATIONAL_DB`).

## What gets generated

For an owner object `walletAccount` (default `ledgerName`):

| Asset | Name | Purpose |
|-------|------|---------|
| Entry object | `sys_walletAccountLedgerEntry` | The lots: `amount`, consumable `remaining`, `status`, `availableAt`, `expiresAt`, `sourceRef`. |
| Movement object | `sys_walletAccountLedgerMovement` | Append-only log: every earn/consume/reserve/commit/release/mature/expire, with `idempotencyKey` (unique), balance snapshots, and the per-lot `allocationDetail`. |
| Reservation object | `sys_walletAccountLedgerReservation` | Only when `reservation.enabled` — open holds with their persisted allocation plan. |
| Owner columns | `walletAccountLedgerVersion`, `walletAccountLedgerAvailable` / `Pending` / `Reserved` | Materialized mode only; see below. |
| API roster | `earnWalletAccountLedger`, `consumeWalletAccountLedger`, `getWalletAccountLedgerBalance`, … | Declared Business APIs injected into the owning service — they appear in the service's API docs like any author-written API. |
| Crons | mature / expire / remind / sweep / verify | Config-gated system crons (see the schedule table). |

An explicit `ledgerName` (e.g. `"points"`) renames the whole family:
`sys_walletAccountPointsEntry`, `earnPoints`, `getPointsBalance`. One
object may own one ledger; two ledger-owning objects in one service
each get their own stem, and a collision of stems is a design-time
error (`LEDGER_STEM_COLLISION` — rename one `ledgerName`). Distinct
stems can collide too when one stem is the other plus a generated
suffix: `stock` (with reservations) generates `StockReservationAllocation`
(`<Stem>ReservationAllocation`), and so does a second ledger named
`stockReservation` (`<Stem>Allocation`). The same error names both
ledgers and the shared generated name; pick a stem that is not the
other's plus a suffix (`stockHold`, not `stockReservation`). Stems that
differ only in letter case (`stock` / `sTock`) collide as well.

### The version column you never touch

A materialized ledger generates `<ledgerName>Version` on the owner
row. **You never declare it, never see it in responses, and never
write it** — it exists purely so the generated service can carry the
compare-and-set: every mutation re-asserts the version it read and
retries on conflict. Declaring a property with the generated
name is refused (`LEDGER_RESERVED_FIELD_COLLISION`); a column
literally named `version` is a different name and stays
entirely yours.

## Ownership is the row — dividers are identity columns

There is no divider machinery inside the ledger. The unit of ownership
is the decorated object's ROW, and everything you might call a
"dimension" is an owner-identity column on that object:

- **Multi-store stock** — declare `storeStockItem` with `storeId` +
  `productId` and a unique composite index over both. Each (store,
  product) pair is one row, one ledger. Without the unique index two
  rows can exist for the same pair, each carrying half the stock —
  the validator warns (`LEDGER_OWNER_IDENTITY_UNINDEXED`). A unique
  index over a SUBSET of the identity columns satisfies it too (one
  identity column with `indexSettings.unique`, or a single-field unique
  composite index): that column alone already keeps the rows apart.
- **Multi-asset wallet** — declare `walletAccount` with `userId` +
  `assetCode`. Fifty crypto assets are fifty rows; listing a new
  asset is an INSERT, never a schema change. Per-asset scales use
  `unit.scaleProperty` (below).
- **Tenant** — comes free: mark the owner object
  `objectDataIsInTenantLevel` and the satellites inherit isolation
  through their required `ownerId` FK. The satellites deliberately
  carry no tenant column of their own, which is why every generated
  API addresses the OWNER ROW — the FK only isolates a read that
  actually resolves that row (see "How the two reads are scoped").
- **Polymorphic owners** (a payee that may be a user or an
  organization) declare a thin owner object with a type discriminator
  — never a polymorphic FK.

### Owner key admission

`configuration.ownerKeyProperty` defaults to `id`. An alternate key must be
a required, non-array `ID` (UUID) with a globally unique, full-domain index.
For example, `basicSettings: { name: 'ledgerKey', type: 'ID', isRequired: true }`
and `indexSettings: { unique: true }` qualifies on a non-tenant, non-soft-delete
owner, provided no larger full-domain composite suppresses that property index.
A full-domain single-column composite (`indexFields: ['ledgerKey']`,
`onDuplicate: 'throwError'`) also qualifies, including on a tenant owner.

Text, nullable, array and nonunique keys fail validation with
`LEDGER_OWNER_KEY_UNSUPPORTED`. Tenant-scoped property uniques, soft-delete
uniques and partial indexes cannot guarantee one physical UUID principal
across every row. Repair the requested key or explicitly select `id`; the
compiler never silently substitutes a key.

### Units and scales

Amounts are **integers in minor units**. Declare exactly one of:

- `unit.scale` — one global fixed-point scale (`100` = two decimals,
  `1` = whole units), or
- `unit.scaleProperty` — an owner-row column carrying the per-asset
  scale (BTC rows store `100000000`, USD rows store `100`), seeded
  from an app-declared asset catalog.

Setting both — or neither — is a design-time error
(`LEDGER_UNIT_SCALE_CONFLICT` / `LEDGER_UNIT_SCALE_MISSING`).

#### Storage is minor, every READ is major

Those integers are the **storage** side, and they stay integers: the
balancing arithmetic of earn/consume/reserve/commit/release/adjust is a
multi-row compare-and-set, and a floating-point accounting primitive drifts
(`3 × 16.10 = 48.300000000000004`).

The **unit boundary is the read edge**, and the generated service owns it. Every
read surface of a ledger-touched row divides by the ledger's scale
exactly once, through one accessor:

| Read surface | Where it converts |
|--------------|-------------------|
| REST / MCP / Kafka response, SSE events AND stream mode | the response envelope, and each stream chunk |
| ... what it converts | the API's OWN rows (on the owner object that includes the balance keys `available` / `pending` / `reserved` / `spendable`), the `movement` / `allocations` / `reservation` outcome on the GENERATED roster APIs the ledger engine writes it for (never a key that merely has that name - a wrapper API converts its outcome through the accessor, below), and every LOCAL select-join to a ledger object (with that object's scale; a per-asset owner's own lots with the owner row's scale) |
| the API event (`raiseApiEvent`, and its `old` slot) - every transport | the event raiser |
| Elasticsearch projection (and the DataViews built from it) | at index time and on index rebuild |
| db-change events (`created` / `updated` / `deleted`, and the `old` slot) | at event stamp time |
| the ledger's own `*.movement.*` / `*.reservation.*` / `*.entry.*` / `*.invariant.*` events | the ledger engine's publisher |
| a hand-built `publishEventActions` message | `this.ledgerMajorUnits(this.<row>)` — a raw read is refused |
| the frontend prompt / balance display contract | states major units |

Two transports are MACHINE transports and carry the stored minor-unit
integers, exact and unconverted: an in-process `await API.<name>(...)`
call and **gRPC** (a gRPC `int32` field could not carry `12.5` anyway;
the emitted `.proto` marks each such field). Every other RESPONSE
transport - REST, SSE (events and stream), MCP, Kafka - answers in
major units, and so does every API event, whichever transport served
the call. gRPC and the in-process call are the only exceptions, and
they hold on a replay too (below).

The conversion is by OBJECT, never by column name: a record is divided
only when the compiler knows it is a row of a ledger object read from the
database. A record that came from Elasticsearch (a remote join, a
DataView aggregate, a search action) was converted when it was indexed
and is never divided again; a non-ledger record's own `amount` or
`reserved` is never touched.

So a consumer never divides, and never has to ask whether the number it
received was already converted. Writing a `fromLedgerMinor` helper in a
client is a defect, not a workaround.

Consequences worth stating plainly:

- **The write side is unchanged.** A mutation's `amount` is still the
  raw integer at the ledger's scale. A user-entered value is multiplied
  by the scale server-side, in the wrapper API that accepts it.
- **Server code stays in storage units - and the wrapper recipe.** An
  in-process `await API.<name>(...)` call is not a read edge: it answers
  in minor units, the same unit its `amount` was sent in, so a hook never
  mixes the two. A wrapper on the ledger's owner object surfaces the
  result in exactly two ways:
  - the BALANCE numbers raw, under their own names
    (`available: r.available`, ...): they are balance keys of the owner
    object, so the wrapper's response converts them once on the way out;
  - the ENGINE OUTCOME through the accessor:
    `this.spent = this.ledgerMajorUnits(r).movement` (likewise
    `.allocations`, `.reservation`). The accessor carries the owner's
    outcome slots; the response itself never converts a key by its name,
    so a raw `r.movement` would leave the service in minor units.

  Never read a single balance NUMBER through the accessor and surface it
  under a balance key (`available: this.ledgerMajorUnits(r).available`):
  a number cannot carry the never-twice mark, and the response converts
  that key again. Renamed keys, or a wrapper on another object, leave the
  service raw.
- **A per-asset ledger converts only what carries its scale.** The
  scale lives on the owner row: the owner-addressed ledger APIs select
  it and answer it beside the numbers, so their envelope converts, and
  so do the owner's OWN lots / movements / reservations joined onto that
  row. An entry / movement / reservation row read on its own has no
  scale to read and is left raw rather than divided by a guessed
  constant, and so are the engine's own events.
- **The refusals.** Binding a raw minor column into a *dynamic*
  (read-time) DataView property (a dynamic view that declares no
  properties binds every column of the object, so it is refused too: list
  the properties explicitly, leaving out the raw minor columns), or reading one in a
  `publishEventActions` message from a storage-side root - `this.<row>`
  (also `this['<row>']`), `this.instance`, or `this.output` (raw up to
  `afterBuildOutput`, and raw on an in-process or gRPC call) - is a
  design-time error (`LEDGER_RAW_MINOR_COLUMN_BINDING`). A key computed
  at runtime (`this.<row>[k]`) or the whole `this.output` is a warning
  (`LEDGER_RAW_MINOR_COLUMN_UNPROVEN`): the validator cannot prove it
  carries no ledger column. The rule: a read the validator can PROVE is a
  raw row or column read is an error - including a list callback that
  reads a column (`this.<rows>.map((r) => r.col)`, `.reduce`,
  `({ col }) => ...`), `.at(n).col`, `[n].col`, `.find(...).col`, a
  `this` alias (`const self = this`), `this.output.data` read whole or
  mapped, and `this` handed to a function literal that destructures
  `{ <row>: { col } }`; a read it cannot prove (a callback that is not a
  function literal, `this` handed to an unknown helper) is a warning.
  A stored view is fine — it is projected from the already-converted
  Elasticsearch document — and a message converts through
  `this.ledgerMajorUnits(this.<row>)`.
- **Replay: one unit in the store.** The idempotent replay store is keyed
  without the transport, so it holds ONE unit - the pre-conversion body,
  stored minor units - and every answer converts per transport, a
  replay included: a key first used over gRPC and retried over REST
  answers major units; the reverse answers gRPC the exact integer. The one exception is a
  record the author already converted before the answer was built
  (`this.output = this.ledgerMajorUnits(this.output)` in
  `afterBuildOutput`): that conversion is part of the answer on every
  transport, so the record is stored as it was answered - every
  occurrence of it, an aliased record included - and named in a
  separate field of the replay document (`ledgerUnitMarks`), never inside
  the cached response: the stored response is the ordinary answer JSON,
  byte for byte, and every field the API answers replays verbatim,
  whatever its name. The replay answers exactly what a live call on the
  retrying transport answers - never divided a second time.
- **The schemas say it too.** The published OpenAPI document
  (`/openapi.json`) types every converted column `number` / `double`
  with the note "MAJOR units (stored as an integer at scale N)", and the
  generated `get<Stem>Balance` response carries `available` / `pending`
  / `reserved` / `spendable` the same way. The generated data-object
  documentation prints the same
  column as `Double` with the same note; a mutation's `amount` (a WRITE)
  stays the scaled `Integer`. The Elasticsearch index maps
  each converted column `scaled_float` with `scaling_factor` = the
  ledger scale (a per-asset owner column: `double`), so a DataView
  aggregate, sort or range filter over a balance runs on `48.3`, never
  on the `48` an `integer` mapping would have coerced it to. A scale-1
  ledger, a per-asset ledger's lot / movement / reservation rows (read
  raw, above) and the `<ledger>Version` counter keep `integer` in both.
  A compiler that does not convert at the read edge still answers the stored integer;
  see [the compiler specification](../../compiler/index.md).
- **Nothing is divided twice.** The converter marks every record it
  converted and never converts a marked one again, and the generated service's
  own copies (the response scrub, the record stamp) carry the mark, so
  `this.ledgerMajorUnits(this.output)` in `afterBuildOutput`, or a
  hand-written stream source that stamps its rows, still answers the
  number once - on an idempotent replay too (the store names every
  occurrence of a marked record, above). Two documented limits: a copy the AUTHOR makes of a
  converted record (`{ ...row }`, `Object.assign({}, row)`) is a new,
  unmarked record and is converted again; and a raw value the author
  assigns onto an already-converted record stays raw.

## The three-number balance

`getBalance` (and the materialized owner columns) answer three numbers
plus a computed convenience:

| Number | Meaning |
|--------|---------|
| `available` | Mature, unexpired, unreserved remainder — the ONLY number a spend may draw on. |
| `pending` | Credited but unmatured (future `availableAt`). |
| `reserved` | Pinned by open holds. |
| `spendable` | Computed: what a consume can take right now. |

Balance `mode` is `materialized` (default: owner-row columns, CAS
enforced) or `derived` (computed per read). A derived balance cannot
ENFORCE the non-negative floor — there is no materialized number to
compare-and-set against — so `derived` without `allowNegative: true`
is refused (`LEDGER_DERIVED_NEGATIVE_UNENFORCEABLE`). Unbound balance
slots auto-create their columns; bind `balance.availableProperty`
(etc.) to reuse an author-declared column instead. Optional
`lifetimeCreditedProperty` / `lifetimeConsumedProperty` bindings
maintain running totals; `invariantCheckCron` schedules a sweep that
recomputes each owner's truth from the lots and emits
`<prefix>.invariant.violated` on any drift.

## Consumption policies

`consumptionPolicy` decides which lots drain first:

| Policy | Order | Use |
|--------|-------|-----|
| `fifo` (default) | `createdAt` ascending | Points, credits, money. |
| `fefo` | `expiresAt` ascending (non-expiring last), then `createdAt` | Perishable stock, expiring points. |
| `lifo` | `createdAt` descending | Rare; tax-lot-style draining. |

Ties are always broken by `(createdAt, id)`, so allocation order is
deterministic. Each allocation is applied with a per-lot
compare-and-set on `remaining` (and on `reserved` when reservations are
enabled) — a concurrent consume of the same lot, or a hold placed on it
after the plan was read, forces a replan, never a double-spend and never
a spend of held units. Eligibility lives in the query:
status `available` AND matured AND unexpired AND positive unreserved
remainder.

## Maturity — pending is not a separate concept

A lot may carry a nullable `availableAt`. Until that instant passes,
the lot is status `pending`: it counts toward the PENDING balance and
cannot be consumed or reserved. There is no separate "pending points"
machinery — *pending IS an unmatured lot*, and an abandoned-pending
sweep is just a maturity deadline.

Declare the `entryMaturity` block to activate the machinery:

```json
"entryMaturity": {
  "defaultDelay": "P14D",
  "cronExpression": "0 * * * *"
}
```

- `defaultDelay` — ISO-8601 duration applied at credit time when the
  caller passes no override.
- The maturity cron flips due pending lots to `available`, moves each
  lot's REMAINING from pending to available on the owner row, and
  emits `<prefix>.entry.matured` + a `mature` movement.
- `earn` accepts an `availableAt` override per call: omit for the
  config default, `null` to mature immediately, a future instant to
  hold the lot as pending.

The earn-time override exists even when no `entryMaturity` block is
declared — but then **no cron ever matures the lot**: a future-dated
credit would sit pending forever. The validator warns about exactly
this (`LEDGER_MATURITY_OVERRIDE_WITHOUT_CRON`): declare
`entryMaturity` (even empty — the cron default is hourly) or make
sure no caller passes a future `availableAt`.

## Expiry — the reserved remainder survives

```json
"expiry": {
  "enabled": true,
  "ttl": "P365D",
  "cronExpression": "15 2 * * *",
  "batchSize": 500,
  "reminderLeadDays": 30
}
```

`expiresAt` is computed at credit time from `ttl` (per-call override
on `earn`; `null` = never expires). The expire cron sweeps due lots in
batches and emits `<prefix>.entry.expired` + an `expire` movement per
owner batch.

One subtlety owned by the pattern: **an expired lot's RESERVED portion
survives expiry.** Only the unreserved remainder is written off — an
open hold's claim on the lot stays intact until the hold commits or
releases. Without this rule, a commit racing an expiry sweep would
replay a plan over lots that no longer hold value.

`reminderLeadDays` (with `reminderCron`) adds an advisory
`<prefix>.entry.expiring` event per owner as lots enter the window,
deduped by a stamp column — build "your points expire soon" mails on
it.

## Two-phase reservations

```json
"reservation": {
  "enabled": true,
  "staleAfterSeconds": 172800,
  "sweepCron": "0 * * * *",
  "referenceProperty": "payoutRef",
  "commitPolicy": "exact"
}
```

`reserve` moves `available → reserved` and — this is the load-bearing
design — **computes the allocation plan at reserve time and persists
it on the hold**. `commitReservation` replays that persisted plan: the
lots quoted at reserve are the lots that drain, regardless of what was
credited or spent in between. `releaseReservation` unwinds the pins
per the same plan. Every transition is a compare-and-set; exactly one
of commit / release / sweep wins a hold, and the losers get a typed
already-resolved 409 — a double release can never restore value twice.

- `referenceProperty` gives holds a business reference with a partial
  unique index over OPEN holds: **one open hold per (owner,
  reference)** — double-reserving the same payout item is structurally
  impossible; resolved holds free their reference.
- The rule is enforced by a unique index on `(ownerId,
  <referenceProperty>)` restricted to open holds, including in derived
  balance mode with no owner-row CAS. Concurrent first reserves with
  different movement keys have one winner; the loser gets
  `409 LEDGER_RESERVATION_REFERENCE_HELD` after its transaction rolls back.
  A retry of the winning movement key still returns the original result
  with `alreadyProcessed: true`. A missing/null reference occupies no key;
  the same reference on another owner is independent.
- `commitPolicy` — `exact` (commit the full held amount) or `partial`
  (a smaller amount is legal; the rest releases).
- The sweep cron expires holds older than `staleAfterSeconds`
  (default 172800 s = 48 h), restoring their lots and balance.

## Idempotency — the key identifies the OPERATION

`idempotencyKey` is REQUIRED on every mutating call and unique on the
movement log. A retry with the same key returns the ORIGINAL
movement's result with `alreadyProcessed: true` — **never a 409**;
network retries must not alarm. Even two concurrent identical calls
resolve to one movement: the loser of the unique-index race returns
the winner's row.

The key identifies the *operation*, not the attempt. Derive it from
the business fact — `pay:<providerIntentId>`, `order:<orderId>:earn` —
and never suffix it with an attempt counter (a counter makes every
retry a fresh operation and reintroduces the double-credit).

`entrySource.unique` ((owner, `sourceRef`) unique on the lots, default
true when the block is declared) is an optional coarse second line for
"one credit per source document".

## The API roster

| API | Default transports | Notes |
|-----|--------------------|-------|
| `earn<Stem>` | internalCall | Credit one lot. |
| `consume<Stem>` | internalCall | Spend per policy. |
| `reserve<Stem>` | internalCall | Two-phase hold (reservation-gated). |
| `commit<Stem>Reservation` | internalCall | Replay the persisted plan. |
| `release<Stem>Reservation` | internalCall | Unwind untouched. |
| `get<Stem>Balance` | internalCall + REST | The triple + `spendable`. |
| `list<Stem>Entries` | REST | Paginated lot list; resolves the owner row first, so it carries that row's tenant (and ownership) scope. |
| `adjust<Stem>` | OFF by default (opt-in `"emit": true`) | Signed operator correction, `reason` required, optional `causeRef` — gate it with `checkRoles`. |
| `void<Stem>BySource` | OFF by default (opt-in `"emit": true`); internalCall | Reverse what one source credited (a refund before or after maturity); see below. |

Every binding accepts `{ emit, internalCall, rest, routePath,
checkRoles }` under `generatedApis.<key>` (see
[`LedgerGeneratedApis`](../../spec/LedgerGeneratedApis.md) and
[`LedgerApiBinding`](../../spec/LedgerApiBinding.md)). REST routes default to
`/ledger/<stem>/…`; `checkRoles` binds to the REST transport only —
internal calls run as the system by contract. A mutating member bound to REST
with an empty `checkRoles` admits any authenticated caller to a mint/burn
operation and raises `LEDGER_REST_MUTATION_UNGATED`: name a role in
`checkRoles`, or keep the mutation internal and call it from a wrapper API
that carries its own gate.

A `routePath` override is used verbatim, so it must keep the `:ownerId`
segment for the two reads: `get<Stem>Balance` and `list<Stem>Entries`
take the REQUIRED `ownerId` from the route path, and an override such as
`"/creditbalance"` leaves it with no source (every REST call would answer
400 "Parameter 'ownerId' is required"). Validation refuses that override
with `LEDGER_ROUTE_PATH_DROPS_URLPATH_PARAM` on
`generatedApis.<key>.routePath`. Keep the segment
(`"/creditbalance/:ownerId"`), drop the override to use the default
route, or, for a "my balance" read, author a session-scoped wrapper API
that resolves the owner from the session and calls the internal API.

### How the two reads are scoped

The satellites carry no tenant column of their own: a lot belongs to a
tenant only through the `ownerId` FK. Both read APIs therefore address
the OWNER ROW, and inherit that row's scope:

- `get<Stem>Balance` reads the owner object directly — its tenant term
  is the owner object's own.
- `list<Stem>Entries` RESOLVES the owner row before it queries the
  lots. The resolution carries the owner object's tenant column, and
  where the owner object declares an `isOwnerField`, the caller must
  own that row.

So an `ownerId` the caller cannot reach — another tenant's, or one
that does not exist — answers **404**, the same answer in both cases:
existence never leaks across a tenant boundary. An owner the caller
may read returns exactly the lots it always did.

With an alternate `ownerKeyProperty` (a wallet addressed by its `userId`),
`ownerId` on the route is that key value, never the owner row's `id`. The
ownership check reads the owner row that was resolved by that key, so
the owner gets their lots, another user gets **403**, and an `id` passed
where the key value is expected is an unknown key, so it answers **404**.

Operator reach across owners is NOT a REST `checkRoles` mount on a
ledger whose owner object has an owner column: only an absolute role
bypasses ownership. Put cross-owner operator reads behind a wrapper
API that carries its own gate and calls the ledger internally — the
same canon the mutating members follow.

`adjust` and `voidBySource` are the members that are **off by default**: a binding that
only spells `rest`, `internalCall` or `checkRoles` does not emit them.
The declared opt-in shape is an explicit `"emit": true`:

```json
"generatedApis": {
  "adjust": { "emit": true, "rest": true, "checkRoles": ["admin"] }
}
```

`adjust<Stem>` takes a SIGNED `amount`: a positive amount mints a
correction lot (recorded as an earn movement with sourceType
`adjust`), a negative amount draws down lots per the consumption
policy (a consume movement with kind `adjust` and targetType
`adjust`) — the movement log stays arithmetically honest either way.
`reason` is required and travels with the API audit event. The
optional `causeRef` is the correction party id — the support ticket,
audit case or reconciliation run the operator acts on (movement
metadata, never FK-resolved; recorded as the source on a credit and
the target on a debit). The party TYPE is always `adjust` — the
correction discriminator is not caller-selectable — and when
`causeRef` is omitted the recorded party id is intentionally null.

### Reversing a source's credit: `void<Stem>BySource`

A refund of an order whose seller earning is still maturing must take
the PENDING lot back, and `consume` cannot: it draws on mature,
unreserved value only, so it answers `LEDGER_INSUFFICIENT_BALANCE` and
the refunded earning would mature later anyway. Enable the reversal
with `"voidBySource": { "emit": true }` and call it from the refund
hook:

```js
await API.voidSellerEarningsBySource({ ownerId: sellerId, sourceRef: `pay:${intentId}` });
```

Every lot of that owner stamped with `sourceRef` (the earn `sourceId`;
`sourceType` narrows it further) that is still pending or available
loses its UNRESERVED remainder: an unmatured lot leaves `pending`, a
matured lot leaves `available`, and a lot drained to zero becomes
`voided`. One `void` movement (amount = minus the voided value, source
party = the source, per-lot split in `allocationDetail`) records it, and
the invariant checker counts it like any other remaining-moving
movement. An open hold is never voided under its holder: its reserved
part stays on the lot.

What the source credited but the ledger no longer holds - spent, still
held, or expired - is answered as `shortfall` beside `voided` (both in
major units on a scaled ledger). It is reported, never booked: the
ledger writes no negative lot and no debt for it; recovering it is the
caller's business decision (a `consume` from the remaining balance, an
invoice, a write-off).

Shortfall subtracts previous void allocations against the matching credit
lots. A later typed void therefore counts an earlier untyped void against
those lots, even when that movement also voided other source types.

The call is idempotent by the source: without an `idempotencyKey` the
key is `void:<ownerId>:<sourceType>:<sourceRef>`, so a retried refund
hook replays the original void (`alreadyProcessed: true`) instead of
writing a second one. A source with no lot on the addressed owner is a
typed 404, `LEDGER_SOURCE_NOT_FOUND`, with nothing written. A service whose target
language does not provide the primitive refuses an enabled binding at design time
(`LEDGER_VOID_BY_SOURCE_LANGUAGE_UNSUPPORTED`).

A declared binding that resolves to no emitted API (adjust without
`"emit": true`, every transport off, or a reservation member while
`reservation.enabled` is not true) raises the `LEDGER_API_BINDING_INERT`
warning at design time, naming the field to add. An explicit `emit: false`
silently opts out of an API, unless the same binding also enables `rest`
or `internalCall`. The service's generated API documentation lists exactly
the APIs the build emitted, so an API missing there was not emitted.

### Session never enters the ledger core

The mutating APIs are **fully parametric**: `ownerId` is an explicit
parameter, there are no session-fed columns and no ownership check.
User-facing flows are thin WRAPPER APIs the author declares — the
wrapper owns the session, resolves the owner row, then calls the core.

When the owner object is tenant-scoped, the wrapper must also pass
`{ session: this.session }` as the internal call's optional second argument,
where the compiler supports it. This supplies the caller's tenant to the
generated service; `ownerId` and every ledger operation input remain explicit.
The ledger core does not acquire session-injected columns or ownership checks.
A hook that has a caller session uses the same argument. With `API.<name>(params)`
the session stays null and the call keeps its existing as-the-system behaviour;
no session is inherited from the running request. A provider webhook hook with no
session keeps its explicit-param system call. A compiler whose target language has
no explicit-session support keeps the sessionless signature. See
[the compiler specification](../../compiler/index.md). The following wrapper is
written for a compiler that supports it:

```json
{
  "basics": {
    "apiOptions": { "name": "spendMyPoints", "crudType": "get",
                    "dataObjectName": "walletAccount" },
    "authOptions": { "loginRequired": true }
  },
  "parameters": { "requestParameters": [
    { "name": "amount", "type": "Integer", "required": true, "httpLocation": "body" }
  ] },
  "query": { "whereClause": {
    "fullWhereClause": { "js": "{ userId: this.session.userId }" } } },
  "actions": { "functionCallActions": [ {
    "name": "spendViaLedger",
    "callScript": { "js": "await (async () => { const r = await API.consumeWalletAccountLedger({ ownerId: this.walletAccount.id, amount: this.amount, idempotencyKey: `spend:${this.session.userId}:${this.requestId}`, targetId: this.requestId, targetType: 'spend' }, { session: this.session }); if (r.errorCode) { throw Object.assign(new Error(r.detail ?? r.errorCode), { statusCode: r.status ?? 409, errorCode: r.errorCode }); } this.spent = this.ledgerMajorUnits(r).movement; })()" }
  } ] }
}
```

`getMyBalance` is the same shape one size smaller: resolve the
caller's row, `await API.getWalletAccountLedgerBalance({ ownerId }, { session: this.session })`,
surface `{ available, pending, reserved, spendable }`. The raw
`/ledger/...` REST roster is for operator tooling; **user screens
ride the wrappers**.

Note the error handling: a successful `await API.x({...})` resolves to the
API's OUTPUT. Where the compiler throws a typed error for a non-2xx outcome, the
error carries the status and problem envelope; where it returns the problem
envelope (`errorCode`, `status`, `detail`) instead, check `errorCode`
before using the result (the wrapper above does). Supplying a session
preserves the trusted internal posture: role and ownership gates remain bypassed.

## Events

Aliases exist exactly when the code path that publishes them is
emitted (prefix defaults to the ledger name; override with
`events.prefix`):

- Always: `<p>.movement.earn`, `<p>.movement.consume`
- Reservations: `<p>.movement.reserve|commit|release|expire-reservation`, `<p>.reservation.opened|committed|released|expired` (both carry the same movement row, in major units - see "Storage is minor, every READ is major")
- Maturity: `<p>.movement.mature`, `<p>.entry.matured`
- Expiry: `<p>.movement.expire`, `<p>.entry.expired` (+ `<p>.entry.expiring` with a reminder window)
- Invariant cron: `<p>.invariant.violated`
- voidBySource enabled: `<p>.movement.void`
- `events.publishBalanceChanged: true`: `<p>.balance.changed` (see "Balance snapshot contract" below)

Movement events carry the movement row. Events are advisory and
post-commit only — a publish failure never un-commits a mutation.
`events.secure: true` registers the aliases as secure (signed)
events. `publishBalanceChanged` (default false) adds a balance
snapshot event for cache-invalidation listeners.

### Balance snapshot contract

With `events.publishBalanceChanged: true`, the alias is
`<prefix>.balance.changed`. Its wire topic is
`<projectCodename>-<prefix>.balance.changed` (an already project-prefixed alias
is not prefixed twice). The ordinary event envelope carries this `data`:

```json
{
  "ownerId": "wallet-owner-key",
  "available": 12.5,
  "pending": 3,
  "reserved": 2.25,
  "movementId": "committed-movement-id",
  "idempotencyKey": "caller-operation-key",
  "version": 7
}
```

`ownerId` is the value addressed by `ownerKeyProperty`, also stored as the
satellites' `ownerId`; it need not be the owner's primary `id`. The triple is
in major units, divided exactly once by `unit.scale` (default 1), or by the
committing owner row's `unit.scaleProperty` for a per-asset ledger. Other owner
columns and movement metadata are not copied into this payload.

Finite positive snapshot scales are accepted, including fractional
scales below 1. If division by a valid tiny scale overflows binary64, that
amount is JSON `null`; finite amounts remain JSON numbers. This does not skip
the snapshot or change the separate read-edge scale rule.

An unusable per-owner scale (null, zero, negative, or non-numeric) skips the
balance snapshot for that transaction. The mutation still commits exactly as
with the flag off, and maturity/expiry passes continue to later owners. After
commit the service logs one `LedgerBalanceSnapshotSkipped` warning containing
only the owner key and ledger name, with no balances or secret data. Retries,
rollbacks and idempotency replays add no warnings. A logger failure also cannot
change the mutation's outcome; no raw-unit balance event is substituted.

The stable event identity is `(topic alias, ownerId, movementId)`; consumers
deduplicate by this identity, not the envelope's random `id`.
`idempotencyKey` identifies the operation. `version` is the committed CAS
version in materialized mode and `null` in derived mode. Derived snapshots use
the same lot aggregate and eligibility rules as `getBalance`.

The engine captures the triple after all transaction writes, before commit,
and publishes once after a successful commit. It does not
re-read a newer balance after commit. Rollbacks, failed CAS attempts, and
idempotency replays (including a lost unique-key race) publish no extra balance
event. Earn, consume, reservations and their commit/release/stale expiry, and
maturity/expiry operations publish it. A maturity/expiry batch publishes
once per owner transaction even when it changes several lots; stale-hold
sweeps publish once per successfully expired hold transaction. Reminder and
invariant notifications do not mutate balances and publish no balance event.

`events.secure: true` registers this alias as a signed (secure) event:
the publisher signs it and secure consumers verify it.
False/omitted `publishBalanceChanged` emits no balance event or balance topic.
Delivery remains best effort, like movement events: no transactional outbox,
no recovery replay, no broker exactly-once guarantee. A crash after commit can
lose an event; transport retries can duplicate delivery or reorder events.
Publisher failure cannot fail the committed operation. MongoDB is unsupported:
ledger validation already requires a relational database.

## Cron schedule knobs

| Cron | Config | Default |
|------|--------|---------|
| Mature pending lots | `entryMaturity.cronExpression` | `0 * * * *` |
| Expire due lots | `expiry.cronExpression` | `15 2 * * *` |
| Expiry reminder | `expiry.reminderCron` | daily when `reminderLeadDays` set |
| Sweep stale holds | `reservation.sweepCron` | `0 * * * *` |
| Verify invariants | `balance.invariantCheckCron` | off unless set |

## Honest scope boundaries (v1)

Stated so the boundary is designed, not inferred:

- **Conversion / swap** — an atomic cross-ledger transfer is NOT in
  v1. A two-legged wrapper (consume asset A + earn asset B) is TWO
  transactions: the second leg can fail after the first commits, and
  your wrapper owns the compensation. `transfer()` is the named v2
  candidate.
- **Portfolio / aggregate reads** — a portfolio is a DataView or list
  over the owner rows (each row already carries its materialized
  triple). The ledger never materializes cross-owner state.
- **Retry / attempt semantics** — attempt counters, MAX_ATTEMPTS and
  retry crons are OUTBOX machinery about external providers, not
  ledger arithmetic. Keep them in your delivery layer; the ledger
  sees only reserve / commit / release.

## Worked scenarios

Four scenarios are built on this pattern:

- **Loyalty points ledger** — earn on order events, spend via a wrapper API,
  expiry + reminder.
- **Multi-asset crypto wallet** — rows per (user, asset), `scaleProperty`,
  portfolio as a list.
- **Multi-store FEFO stock** — composite owner identity, FEFO, cart holds via
  reservations.
- **Marketplace payout via reservation** — earn on capture with a
  refund-window maturity, payout = reserve then commit/release.

Related but distinct: the marketplace family's **platform settlement**
(`settlementMode: "platformSettled"`) injects its own
`sys_<X>EarningsEntry` / `sys_<X>SettlementInstruction` tables — that
is settlement machinery on the payment layer, not this ledger pattern.
See [Intermediation vs reseller billing](intermediation-vs-reseller-billing.md).
