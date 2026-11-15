# SeedDataBasics

**Level:** `section` · **Family:** [SeedData](../ontology/families.md#seeddata) (domain `Service`)

**Ontology:** [SeedDataBasics in Part 1](../ontology/SeedDataBasics.md)

Identity and upsert policy of one seed record: the target DataObject, the matchBy idempotency key, and the value names that are seeded once and never refreshed.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dataObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The target DataObject to upsert into. The generator resolves the db-layer get/create/update helpers from this name. |
| `matchBy` | `String`[] | no |  |  |  | Property names that identify an existing row (the idempotency key). On boot the seeder looks a row up by these properties — reading each one's value from `values` — and inserts if none is found, otherwise refreshes the `values`. Defaults to ['id'] when empty. |
| `insertOnly` | `String`[] | no |  |  |  | Value names (from `values`) that are seeded ONLY when the row is first inserted and never refreshed on a later boot. Values for `hashed` DataProperties (credentials) are always insert-only, implicitly; list a name here to give a non-hashed value the same seed-once contract — e.g. the super-admin `passwordChangeRequired` bootstrap flag, which a runtime password rotation clears and a reboot must not re-set. |

## Constraints

Property rules:

- `dataObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `dataObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
