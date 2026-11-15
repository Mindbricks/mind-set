# LedgerEvents

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerEvents in Part 1](../ontology/LedgerEvents.md)

Event emission for the ledger. Topics are prefixed with `prefix` (default: the ledger name) — e.g. `<prefix>.entry.matured`, `<prefix>.entry.expired`, `<prefix>.reservation.released`. `publishBalanceChanged` opts into a balance-changed event on EVERY mutation (default false — high volume; prefer the specific lifecycle events). `secure` requires the project's Ed25519 signature on the ledger's events for cross-trust-boundary consumers (same mechanism as serviceOptions.secureEvents).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `prefix` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | CodeName prefix for the ledger's event topics. Defaults to the ledger name. |
| `publishBalanceChanged` | `Boolean` | no | `false` |  |  | Implemented by nodejs, java, dotnet and python: when true, each committed ledger operation publishes `<prefix>.balance.changed` through ServicePublisher. Its data is `{ ownerId, available, pending, reserved, movementId, idempotencyKey, version }`: ownerId is the configured owner key; balances are major units, using unit.scale or the owner row's unit.scaleProperty. Identity is (topic alias, ownerId, movementId); version is null for derived mode. Capture is inside the winning transaction after writes, delivery is best effort after commit; rollback, retry attempts and idempotent replays emit nothing extra. A maturity/expiry batch emits once per owner transaction; stale holds emit once per hold transaction. Default false emits nothing. events.secure signs this alias through the existing project Ed25519 mechanism. Ledgers require a relational database; MongoDB is rejected. See mastering/ledger for wire topic scope and delivery limits. |
| `secure` | `Boolean` | no | `false` |  |  | When true, the ledger's events are Ed25519-signed by the project (publish side) and signature-verified by framework consumers (subscribe side). Default false. |

## Constraints

Property rules:

- `prefix` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
