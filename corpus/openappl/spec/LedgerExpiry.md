# LedgerExpiry

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerExpiry in Part 1](../ontology/LedgerExpiry.md)

**Activation:** the pattern is switched on by `enabled`.

Lot expiry sweep and pre-expiry reminders. When enabled, lots whose expiry falls due are swept in batches by the expire cron. THE SWEEP CONSUMES THE UNRESERVED REMAINDER ONLY: value held by an OPEN reservation survives expiry until the reservation commits or releases — a hold must never be silently voided by the calendar (framework-owned subtlety). `reminderLeadDays` + `reminderCron` drive the notifyExpiring job that publishes a pre-expiry reminder event.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Enables lot expiry for this ledger. When false, the other fields in this block are inert (LEDGER_EXPIRY_CONFIG_INERT). |
| `ttl` | `String` | no |  |  |  | ISO-8601 duration a lot lives from its credit instant (e.g. 'P365D'). The lot's expiry instant is computed at credit time. |
| `cronExpression` | `String` | no | `"15 2 * * *"` |  |  | Cron expression for the expire sweep. Default '15 2 * * *' (nightly at 02:15). |
| `batchSize` | `Integer` | no | `500` |  |  | Maximum lots swept per cron run. Default 500. |
| `reminderLeadDays` | `Integer` | no |  |  |  | Days before expiry at which the notifyExpiring job publishes a reminder event. Leave null to disable reminders. |
| `reminderCron` | `String` | no | `"0 8 * * *"` |  |  | Cron expression for the notifyExpiring job. Default '0 8 * * *' (daily at 08:00). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
