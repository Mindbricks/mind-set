# LedgerConfig

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerConfig in Part 1](../ontology/LedgerConfig.md)

Configuration for the append-only ledger owned by each row of the decorated DataObject. Property bindings (`ownerKeyProperty`, `balance.*Property`, `unit.scaleProperty`) are PropRefer paths into the OWNER object's declared properties. Column-name fields on the satellite blocks (`parties`, `entrySource`, `entryMaturity`, `reservation`) NAME generated columns on the satellite tables and must not collide with the framework-owned generated fields (LEDGER_RESERVED_FIELD_COLLISION). Every balance mutation is a compare-and-set on the owner row's generated version column inside ONE transaction with the lot writes and the movement row; consumption applies each allocation with compare-and-set on `remaining = previousRemaining`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `ledgerName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | CodeName of this ledger, used to name the generated satellite objects, the API roster (earn<LedgerName>, consume<LedgerName>, ...), and the event topic prefix. Defaults to the owner object's name at build time when omitted. |
| `unit` | [`LedgerUnit`](./LedgerUnit.md) | yes |  |  |  | The unit of account (name + fixed-point scale). Amounts are integers at a fixed scale. Exactly ONE of `unit.scale` (global) or `unit.scaleProperty` (per-asset, owner-row column) must be declared — validator-enforced (LEDGER_UNIT_SCALE_CONFLICT / LEDGER_UNIT_SCALE_MISSING). |
| `ownerKeyProperty` | [`PropRefer`](./PropRefer.md) | no | `"id"` |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | The property whose value keys the satellite ownerId columns. Defaults to `id`. An alternate key must be a required, non-array ID (UUID) with a full-domain, globally unique index; tenant-scoped property uniques and soft-delete/partial uniques do not qualify. Unsupported keys fail with LEDGER_OWNER_KEY_UNSUPPORTED; no key is substituted. |
| `balance` | [`LedgerBalance`](./LedgerBalance.md) | no |  |  |  | The THREE-NUMBER balance contract (available / pending / reserved) and how the numbers are maintained (materialized owner-row columns vs derived-at-read). See LedgerBalance. |
| `consumptionPolicy` | `LedgerConsumptionPolicy` | no | `"fifo"` | `fifo`, `fefo`, `lifo` |  | Order in which lots are drawn down by consume/reserve: fifo (default), fefo, or lifo. Ties are broken by (createdAt, id) so allocation is deterministic. |
| `allowNegative` | `Boolean` | no | `false` |  |  | Whether the owner's available balance may go below zero. Default false — consume/reserve beyond the available number is refused. A derived-mode balance cannot ENFORCE the non-negative floor (no materialized number to compare-and-set against), so derived mode requires allowNegative: true (LEDGER_DERIVED_NEGATIVE_UNENFORCEABLE). |
| `parties` | [`LedgerParties`](./LedgerParties.md) | no |  |  |  | Names of the generated party-reference columns on movement rows — earn carries a SOURCE ref, consume/reserve carry a TARGET ref. Movement METADATA, never FK-resolved by the ledger. See LedgerParties. |
| `entrySource` | [`LedgerEntrySource`](./LedgerEntrySource.md) | no |  |  |  | The coarse source-reference line on the LOTS — the optional (owner, sourceRef) unique second idempotency line behind the movement-level idempotencyKey. See LedgerEntrySource. |
| `entryMaturity` | [`LedgerEntryMaturity`](./LedgerEntryMaturity.md) | no |  |  |  | Lot maturity: credited value that counts as PENDING until its availableAt instant passes. See LedgerEntryMaturity. |
| `expiry` | [`LedgerExpiry`](./LedgerExpiry.md) | no |  |  |  | Lot expiry sweep + pre-expiry reminders. The sweep consumes the UNRESERVED remainder only. See LedgerExpiry. |
| `reservation` | [`LedgerReservation`](./LedgerReservation.md) | no |  |  |  | Two-phase holds (reserve / commitReservation / releaseReservation) with a stale-hold sweep. See LedgerReservation. |
| `additionalProperties` | [`LedgerAdditionalProperties`](./LedgerAdditionalProperties.md) | no |  |  |  | Designer-declared extra columns on the generated satellite objects — full DataProperty declarations, relations included. This is where REAL FKs live (party refs are metadata-only). See LedgerAdditionalProperties. |
| `events` | [`LedgerEvents`](./LedgerEvents.md) | no |  |  |  | Event emission settings — topic prefix, the opt-in balance-changed event, and event signing. See LedgerEvents. |
| `generatedApis` | [`LedgerGeneratedApis`](./LedgerGeneratedApis.md) | no |  |  |  | Per-API bindings for the generated roster, with the internal-call-first defaults and the idempotency contract. See LedgerGeneratedApis. |

## Constraints

Property rules:

- `unit` must be present. (`REQUIRED_FIELD_MISSING`)
- `consumptionPolicy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `ledgerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `ownerKeyProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `LEDGER_API_BINDING_INERT` | warning | generatedApis.… declares … but resolves to NO emitted API: …. |
| `LEDGER_DERIVED_NEGATIVE_UNENFORCEABLE` | error | A derived balance cannot ENFORCE the non-negative floor: there is no materialized owner-row number to compare-and-set against, so a concurrent double-spend can drive the balance below zero unseen. |
| `LEDGER_EXPIRY_CONFIG_INERT` | warning | expiry configures … while enabled is not true — the whole block is INERT: no lot ever expires and no reminder ever fires. |
| `LEDGER_MATURITY_OVERRIDE_WITHOUT_CRON` | warning | The generated earn API accepts an `availableAt` maturity override, but no entryMaturity block is declared — so no maturity cron exists, and a lot credited with a future availableAt would sit PENDING forever (consumption … |
| `LEDGER_OWNER_IDENTITY_UNINDEXED` | warning | "…" owns a ledger and declares … FK-ish identity columns (…) but no unique composite index over them. |
| `LEDGER_OWNER_KEY_UNSUPPORTED` | error | ….… must be a required, non-array, globally unique UUID principal. |
| `LEDGER_REQUIRES_RELATIONAL_DB` | error | A ledger requires a RELATIONAL dbType on the owning service, but this service uses "…". |
| `LEDGER_RESERVATION_CONFIG_INERT` | warning | reservation configures … while enabled is not true — the whole block is INERT: no reservation object, no reserve/commitReservation/releaseReservation APIs, no sweep. |
| `LEDGER_RESERVED_FIELD_COLLISION` | error | "…" declares a property "…", but the ledger GENERATES an owner-row column of that name (…). |
| `LEDGER_REST_MUTATION_UNGATED` | warning | generatedApis.… is bound to REST ("rest": true) with an EMPTY checkRoles, and … WRITES ledger value. |
| `LEDGER_ROUTE_PATH_DROPS_URLPATH_PARAM` | error | generatedApis.….routePath "…" drops the … segment, but the … API reads … from the route path (a required urlpath parameter). |
| `LEDGER_STEM_COLLISION` | error | The ledgers of "…" (stem "…") and "…" (stem "…") in this service both generate "…" (…)…. |
| `LEDGER_UNIT_SCALE_CONFLICT` | error | Declare exactly ONE of unit.scale or unit.scaleProperty — both are set. |
| `LEDGER_UNIT_SCALE_MISSING` | error | Declare exactly ONE of unit.scale or unit.scaleProperty — neither is set. |
| `LEDGER_VOID_BY_SOURCE_LANGUAGE_UNSUPPORTED` | error | generatedApis.voidBySource is enabled, but only the … ledger layer emits the void-by-source primitive so far; this service generates for …, where the API would have no engine operation behind it. |
