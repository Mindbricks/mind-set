---
title: UpsertBulkCrudAction
---

# UpsertBulkCrudAction

Writes an array of rows into a data object with insert-or-update semantics: the bulk import twin of [`CreateBulkCrudAction`](./create-bulk-crud-action.md). Each row is matched to a stored row on `matchBy`; `matchMode` decides whether a match is updated, skipped or rejected and whether a miss is inserted; `columnPolicies` refine an update per column so a spreadsheet can enrich a table without clobbering it.

Every write goes through the child object's data-layer create / update-by-id operations, so hashed columns, db events, elastic indexing and the entity cache behave exactly as on a single create or update. Like `CreateBulkCrudAction` it is **cascading, never transactional**: rows written before a failure stay written.

## When to use it

- After a [`FileToDataAction`](./file-to-data-action.md): load a spreadsheet into a table, inserting new rows and refreshing existing ones by a business key (SKU, e-mail, code).
- Enrich a table from a partial file: `matchMode: update` plus `fillIfEmpty` policies add a phone number or a price without touching the rest of the row and without inserting strangers.
- Idempotent re-imports: running the same file twice updates rather than duplicates.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `childObject` | `DataObjectName` | yes | The **local** data object the rows are written into. A remote object is refused at design time (`UPSERT_BULK_REMOTE_OBJECT_UNSUPPORTED`): the per-row match reads the stored row through this service's data layer. |
| `objects` | `MScript` | yes | The array of row objects keyed by property name, typically `this.<parsed>.rows` from a `FileToDataAction`. |
| `matchBy` | `String[]` | no | The properties that identify a stored row. Must be `id`, one `unique` property, or exactly the fields of a declared composite index, otherwise `UPSERT_BULK_MATCH_KEY_NOT_UNIQUE`. Defaults to `["id"]`. A row with an empty key part cannot be matched and is treated as a miss. |
| `matchMode` | `BulkMatchModes` | no | `upsert` (default): update the match, insert the miss. `insert`: always insert. `update`: update the match, reject the miss. `skipExisting`: insert the miss, leave the match untouched. |
| `columnPolicies` | `BulkColumnPolicy[]` | no | Per-column behaviour when a **matched** row is updated: `overwrite` (default), `fillIfEmpty` (write only when the stored value is null or empty), `keep` (never on update: the seed-data `insertOnly` rule), `skipIfEmpty` (write only when the incoming value is not empty: the paste guard), `compute` (the policy's `value` MScript runs with `existing` and `row` in scope and its result is written; a compute policy always applies to a matched row, carried or not). |
| `emptyCells` | `BulkEmptyCellPolicies` | no | On update, what an empty incoming cell means for a column with no policy: `write` (default) writes the null, `skip` leaves the stored value alone. Set `skip` for pasted or partial sheets. Inserts always write the row as parsed. |
| `errorRowHandling` | `ErrorRowHandlings` | no | `collect` (default): a failed row (no match in `update` mode, a db refusal, a compute error) is listed under `rejected` and the action continues. `fail`: the action throws a typed 400 on the first failed row. |

Columns absent from an incoming row are never touched on update, so a three-column enrichment file cannot blank the other twenty properties. The `id` and the `matchBy` columns are never rewritten. A property with `allowUpdate: false` can only carry the `keep` policy; a `hashed` column can never carry `compute`.

Tenant and session-fed columns a row does not carry are filled from the session: an authored value wins, a missing one is filled from the session, and nothing is written null. (`CreateBulkCrudAction` differs on the tenant column: it writes the session tenant over an authored one unless the caller is a superAdmin or a root-tenant caller.)

### Result

`this.<contextPropertyName>` holds:

```json
{ "inserted": 12, "updated": 30, "skipped": 0, "rejected": [ { "rowIndex": 7, "reasons": ["unique violation"], "row": { "sku": "A-8" } } ] }
```

### Example

```json
{
  "name": "upsertProducts",
  "childObject": "product",
  "objects": { "js": "this.parsedProducts.rows" },
  "matchBy": ["sku"],
  "matchMode": "upsert",
  "columnPolicies": [
    { "property": "price", "onExisting": "fillIfEmpty" },
    { "property": "stock", "onExisting": "compute", "value": { "js": "(existing.stock ?? 0) + (row.stock ?? 0)" } }
  ],
  "errorRowHandling": "collect",
  "contextPropertyName": "productImport"
}
```

## Behaviour

Per row, in order:

1. Stamp the tenant and session-fed columns the row does not carry.
2. Build the match key from `matchBy`; a complete key is looked up with a direct db read of the object by that query (never the entity cache).
3. On a match: `skipExisting` counts it skipped; otherwise the patch is built from the carried columns under their policies plus every `compute` policy, and written as an update by id when it is not empty.
4. On a miss: `update` rejects it; every other mode writes the row as a create.
5. A refused write or a thrown error rejects the row (or aborts, under `fail`).

**A moderated target is written without a verdict.** Creates and updates go through the data layer, past the moderation seam of an object that carries [`objectModeration`](../capabilities/object-moderation.md): in `staged` mode nothing is staged, in `onPlace` mode created rows land `accepted`. The validator names each such action (`OBJECT_MODERATION_UNSTAGED_WRITE_PATH`, a warning). See [Writes the moderation seam never sees](../capabilities/object-moderation.md#writes-the-moderation-seam-never-sees).

### Compiler support

A compiler refuses a construct it does not implement. A compiler whose tabular-action port is not yet verified keeps the `TABULAR_ACTION_NOT_PORTED` advisory.
