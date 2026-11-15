# EdgeCronSettings

**Level:** `section` · **Family:** [EdgeController](./families.md#edgecontroller) (domain `Service`)

**Specification:** [EdgeCronSettings in Part 2](../spec/EdgeCronSettings.md)

Reserved cron settings of an edge controller. The block is accepted and validated, but NO code generator schedules an edge function today (nodejs emits only the REST and Kafka edge adapters, and the other languages none for cron): an edge controller with `cronEnabled: true` is never triggered by the clock, and validation warns (EDGE_CRON_NOT_SCHEDULED). For scheduled work use a service cron job (`Service.cronJobs[]`, which calls a library function once per tick across replicas) or a Business API cron controller (`ApiCronSettings`).

## Contained in

- [EdgeController](./EdgeController.md) as `edgeCronSettings`

Blueprint paths:

- `services.edgeControllers.edgeCronSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
