# SeedData

**Level:** `chapter` · **Family:** [SeedData](./families.md#seeddata) (domain `Service`)

**Specification:** [SeedData in Part 2](../spec/SeedData.md)

A declarative seed-data record upserted into one of the service's DataObjects at service startup, after migrations run and after the kafka producer is wired. That order means the tables exist and each seeded row's create/update publishes its db-event and elastic-index messages like any other write. Each entry is `{ seedBasics, values }`: `seedBasics` holds the record's identity and upsert policy — the target `dataObject`, the `matchBy` set of property names used to locate an existing row (the idempotency key), and the `insertOnly` names seeded once and never refreshed — and `values` is the map (property → MScript) describing the record to insert when absent or refresh when present. A legacy entry carrying `dataObject`/`matchBy`/`insertOnly` FLAT beside `values` is auto-migrated into `seedBasics` with a warning, so author the nested shape. Generated as a `seed-data` BootstrapModule that runs once on boot via the db-layer. Replaces hand-written bootstrap routines (super-admin / root-tenant / admin-group); reusable by any custom service that needs initial system records. The SAME data object may appear in multiple SeedData entries (e.g. one row per subscription plan); each entry upserts independently, keyed by its `matchBy` values, so rows of one object must differ in their seeded matchBy values (SEED_ROW_NOT_DISTINGUISHABLE otherwise). Each row persists in its own storage slot keyed by that matchBy identity, so N rows survive write→read intact; the item-addressed `seedData/{<dataObject>}` path resolves the object's full row set (a single row object, or an array when several rows are stored).

## Contained in

- [Service](./Service.md) as `seedData` (a list)

Blueprint paths:

- `services.seedData`

## Contains

- `seedBasics`: [SeedDataBasics](./SeedDataBasics.md)
- `values`: [DataMapItem](./DataMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
