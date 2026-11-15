# LedgerBalance

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerBalance in Part 1](../ontology/LedgerBalance.md)

Defines the available, pending and reserved balances returned by getBalance. The THREE-NUMBER balance contract: getBalance returns `available` (mature + unreserved), `pending` (unmatured), and `reserved` (held by open reservations) — and maturity is filtered IN THE QUERY, never post-query in application code. In materialized mode the named owner-row columns carry the running numbers and every mutation compare-and-sets them atomically with the lot and movement writes; `invariantCheckCron` schedules the verifyInvariants job that re-derives the numbers from the lots and reports drift.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mode` | `LedgerBalanceMode` | no | `"materialized"` | `materialized`, `derived` |  | materialized (owner-row columns, CAS-updated — the default) or derived (computed from lots at read time; requires allowNegative: true). |
| `availableProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Owner-row column (PropRefer) carrying the running AVAILABLE number — mature and unreserved value, the only number a spend may draw on. Materialized mode. |
| `pendingProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Owner-row column (PropRefer) carrying the running PENDING number — credited but unmatured value (lots whose availableAt has not passed). Materialized mode. |
| `reservedProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Owner-row column (PropRefer) carrying the running RESERVED number — value held by open reservations. Materialized mode. |
| `lifetimeCreditedProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional owner-row column (PropRefer) accumulating every credit ever earned (never decremented). Materialized mode. |
| `lifetimeConsumedProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional owner-row column (PropRefer) accumulating every consumption ever committed (never decremented). Materialized mode. |
| `invariantCheckCron` | `String` | no |  |  |  | Cron expression for the verifyInvariants job: re-derive available/pending/reserved from the lots and compare against the materialized columns, reporting drift. Leave null to disable the job. |

## Constraints

Property rules:

- `mode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `availableProperty`, `pendingProperty`, `reservedProperty`, `lifetimeCreditedProperty`, `lifetimeConsumedProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
