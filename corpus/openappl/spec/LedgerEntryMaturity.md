# LedgerEntryMaturity

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerEntryMaturity in Part 1](../ontology/LedgerEntryMaturity.md)

Lot maturity. There is NO separate pending-lot concept — 'pending points with an abandonment sweep' is exactly 'unmatured lot + maturity deadline', one concept. Each lot carries a nullable availableAt: set from `defaultDelay` at credit time (or supplied per earn call); until it passes, the lot counts toward the balance's PENDING number and cannot be consumed or reserved — and consume/getBalance filter maturity IN THE QUERY, never post-query in application code. The maturity cron matures due lots (pending → available) and publishes `<prefix>.entry.matured`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `availableAtProperty` | `String` | no | `"availableAt"` |  | format [codeName](./value-formats.md#codename) | Name of the generated lot column carrying the maturity instant. Default 'availableAt'. |
| `defaultDelay` | `String` | no |  |  |  | ISO-8601 duration (e.g. 'P14D', 'PT1H') added to the credit instant when the earn call does not supply availableAt. Leave null for immediate maturity unless the caller supplies availableAt explicitly. |
| `cronExpression` | `String` | no | `"0 * * * *"` |  |  | Cron expression for the maturity job that flips due lots from pending to available and publishes the matured event. Default '0 * * * *' (hourly). |

## Constraints

Property rules:

- `availableAtProperty` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
