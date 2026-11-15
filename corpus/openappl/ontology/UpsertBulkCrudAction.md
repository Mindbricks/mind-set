# UpsertBulkCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [UpsertBulkCrudAction in Part 2](../spec/UpsertBulkCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Writes an array of rows into a data object with insert-or-update semantics—the bulk import twin of CreateBulkCrudAction. Each row is matched to a stored row on the `matchBy` key (the id, a unique property or a declared composite index); `matchMode` decides whether a match is updated, skipped or rejected and whether a miss is inserted; `columnPolicies` refine an update per column (overwrite, fillIfEmpty, keep, compute). Every write goes through the service's db-layer create/update helpers, so hashed columns, db events, elastic indexing and the entity cache behave exactly as on a single create or update. Columns absent from an incoming row are never touched on update. The action stores `{ inserted, updated, skipped, rejected }` in its context property. Like CreateBulkCrudAction it is CASCADING, never transactional: rows written before a failure stay written. Language lanes: implemented by the nodejs, java and dotnet generators; golang and rust emit a typed 501 and python raises NotImplementedError, and a design on such a service gets the TABULAR_ACTION_NOT_PORTED warning.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `upsertBulkCrudActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.upsertBulkCrudActions`
- `services.businessLogic.actions.upsertBulkCrudActions`

## Contains

- `columnPolicies`: [BulkColumnPolicy](./BulkColumnPolicy.md), a list

## References

- `childObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
