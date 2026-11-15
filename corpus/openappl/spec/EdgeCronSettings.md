# EdgeCronSettings

**Level:** `section` · **Family:** [EdgeController](../ontology/families.md#edgecontroller) (domain `Service`)

**Ontology:** [EdgeCronSettings in Part 1](../ontology/EdgeCronSettings.md)

Reserved cron settings of an edge controller. The block is accepted and validated, but NO code generator schedules an edge function today (nodejs emits only the REST and Kafka edge adapters, and the other languages none for cron): an edge controller with `cronEnabled: true` is never triggered by the clock, and validation warns (EDGE_CRON_NOT_SCHEDULED). For scheduled work use a service cron job (`Service.cronJobs[]`, which calls a library function once per tick across replicas) or a Business API cron controller (`ApiCronSettings`).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `cronEnabled` | `Boolean` | no | `false` |  |  | Reserved: setting it to true does NOT schedule the edge function on any language today (validation warns, EDGE_CRON_NOT_SCHEDULED). Use a service cron job (`Service.cronJobs[]`) or a Business API cron controller (`ApiCronSettings`) for scheduled work. Default is false. |
| `cronExpression` | `String` | no |  |  |  | Reserved, not read by any code generator today (see `cronEnabled`). Standard cron syntax (e.g., '0 0 * * *' for daily at midnight, '*/5 * * * *' for every 5 minutes). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
