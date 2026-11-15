# SeedData

**Level:** `chapter` · **Family:** [SeedData](../ontology/families.md#seeddata) (domain `Service`)

**Ontology:** [SeedData in Part 1](../ontology/SeedData.md)

**Name:** an instance is named by `seedBasics.dataObject`.

A declarative seed-data record upserted into one of the service's DataObjects at service startup, after migrations run and after the kafka producer is wired. That order means the tables exist and each seeded row's create/update publishes its db-event and elastic-index messages like any other write. Each entry is `{ seedBasics, values }`: `seedBasics` holds the record's identity and upsert policy — the target `dataObject`, the `matchBy` set of property names used to locate an existing row (the idempotency key), and the `insertOnly` names seeded once and never refreshed — and `values` is the map (property → MScript) describing the record to insert when absent or refresh when present. A legacy entry carrying `dataObject`/`matchBy`/`insertOnly` FLAT beside `values` is auto-migrated into `seedBasics` with a warning, so author the nested shape. Generated as a `seed-data` BootstrapModule that runs once on boot via the db-layer. Replaces hand-written bootstrap routines (super-admin / root-tenant / admin-group); reusable by any custom service that needs initial system records. The SAME data object may appear in multiple SeedData entries (e.g. one row per subscription plan); each entry upserts independently, keyed by its `matchBy` values, so rows of one object must differ in their seeded matchBy values (SEED_ROW_NOT_DISTINGUISHABLE otherwise). Each row persists in its own storage slot keyed by that matchBy identity, so N rows survive write→read intact; the item-addressed `seedData/{<dataObject>}` path resolves the object's full row set (a single row object, or an array when several rows are stored).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `seedBasics` | [`SeedDataBasics`](./SeedDataBasics.md) | yes |  |  |  | Target DataObject, the matchBy idempotency key, and the insert-only value names. |
| `values` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | The record to write, as a list of property → MScript value items. Values may be literals or MScript expressions. Values for `hashed` DataProperties (e.g. password) must be PLAINTEXT — the db-layer create/update bcrypts them once on write, so pre-hashing would double-hash and make the row unauthenticatable. The seed scope provides an `md5(text)` helper for avatar fields. Compiled exactly like a BusinessApi dataClauseItems map. |

## Constraints

Property rules:

- `seedBasics` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `values` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

## Migration

> **Warning:** deprecated and relocated properties. They are listed so that older blueprints can be updated; new blueprints must not use them.

| Property | Status | Use instead | Note |
| --- | --- | --- | --- |
| `dataObject` | moved | `seedBasics.dataObject` | Write the value at the new path. |
| `matchBy` | moved | `seedBasics.matchBy` | Write the value at the new path. |
| `insertOnly` | moved | `seedBasics.insertOnly` | Write the value at the new path. |
