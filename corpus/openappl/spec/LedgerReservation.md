# LedgerReservation

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerReservation in Part 1](../ontology/LedgerReservation.md)

**Activation:** the pattern is switched on by `enabled`.

Two-phase holds: reserve places a hold (available → reserved), commitReservation consumes it, releaseReservation returns it. This is the payout recipe — payout initiation → reserve (referenceProperty = the payout item's ref, so double-reserve is structurally impossible); afterPayoutPaid → commitReservation; afterPayoutFailed → releaseReservation — and it keeps the retry/attempt boundary clean: attempt chaos stays on the payout/outbox side while the ledger sees only reserve/commit/release. The sweep releases holds stale past `staleAfterSeconds`, restoring BOTH sides — the lots and the balance — in one transaction.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Enables two-phase holds for this ledger (generates the sys_<X>LedgerReservation object and the reserve/commitReservation/releaseReservation APIs). When false, the other fields in this block are inert (LEDGER_RESERVATION_CONFIG_INERT). |
| `staleAfterSeconds` | `Integer` | no | `172800` |  |  | Seconds after which an open hold counts as stale and the sweep releases it. Default 172800 (48 hours). |
| `sweepCron` | `String` | no | `"0 * * * *"` |  |  | Cron expression for the sweepReservations job. Default '0 * * * *' (hourly). |
| `referenceProperty` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Name of the generated reservation column carrying the caller's business ref for the hold. The framework adds a UNIQUE PARTIAL INDEX over OPEN holds on (owner, reference) — the same ref cannot hold twice concurrently, while committed/released history keeps its refs. |
| `kindProperty` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Optional name of a generated reservation column carrying a caller-defined kind discriminator (e.g. 'payout', 'checkout'). |
| `commitPolicy` | `LedgerCommitPolicy` | no | `"exact"` | `exact`, `partial` |  | exact (commit consumes exactly the reserved amount — the default) or partial (commit may consume less; the remainder is released in the same transaction). |

## Constraints

Property rules:

- `commitPolicy` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `referenceProperty`, `kindProperty` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
