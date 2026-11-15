# UpsertBulkCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [UpsertBulkCrudAction in Part 1](../ontology/UpsertBulkCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Writes an array of rows into a data object with insert-or-update semantics—the bulk import twin of CreateBulkCrudAction. Each row is matched to a stored row on the `matchBy` key (the id, a unique property or a declared composite index); `matchMode` decides whether a match is updated, skipped or rejected and whether a miss is inserted; `columnPolicies` refine an update per column (overwrite, fillIfEmpty, keep, compute). Every write goes through the service's db-layer create/update helpers, so hashed columns, db events, elastic indexing and the entity cache behave exactly as on a single create or update. Columns absent from an incoming row are never touched on update. The action stores `{ inserted, updated, skipped, rejected }` in its context property. Like CreateBulkCrudAction it is CASCADING, never transactional: rows written before a failure stay written. Language lanes: implemented by the nodejs, java and dotnet generators; golang and rust emit a typed 501 and python raises NotImplementedError, and a design on such a service gets the TABULAR_ACTION_NOT_PORTED warning.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `childObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The LOCAL data object the rows are written into. Remote objects are not supported on this action: an import writes through the owning service's db-layer so the per-row match and the column policies see the stored row. |
| `objects` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the array of row objects to write, keyed by property name—typically `this.<parsed>.rows` from a FileToDataAction, or any array built by an earlier action. |
| `matchBy` | `String`[] | no |  |  |  | The property names that identify a stored row: `id`, one `unique` property, or the fields of a declared composite index. Defaults to ["id"]. A row whose key values are all empty cannot be matched and is treated as a miss. |
| `matchMode` | `BulkMatchModes` | no | `"upsert"` | `upsert`, `insert`, `update`, `skipExisting` |  | One of the BulkMatchModes values: upsert (default), insert, update or skipExisting. |
| `columnPolicies` | [`BulkColumnPolicy`](./BulkColumnPolicy.md)[] | no |  |  |  | Per-column onExisting policies applied when a matched row is updated. A column without an entry is overwritten by the incoming value. |
| `errorRowHandling` | `ErrorRowHandlings` | no | `"collect"` | `collect`, `fail` |  | collect (default): a row that fails (no match in update mode, a db refusal, a compute error) is listed under `rejected` and the action continues. fail: the action throws on the first failed row. |
| `emptyCells` | `BulkEmptyCellPolicies` | no | `"write"` | `write`, `skip` |  | On UPDATE of a matched row, what an empty incoming cell means for a column without its own policy: `write` (default) writes the null, `skip` leaves the stored value alone. Set `skip` for pasted or partial sheets so a blank cell can never erase a value; inserts always write the row as parsed. |

## Constraints

Property rules:

- `childObject`, `objects` must be present. (`REQUIRED_FIELD_MISSING`)
- `matchMode`, `errorRowHandling`, `emptyCells` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `childObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- The items of `columnPolicies` must have distinct names (`property`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_OBJECT_NOT_FOUND` | error | DataObject "…" not found in this service. |
| `UPSERT_BULK_COLUMN_NOT_UPDATABLE` | error | "…" is declared allowUpdate: false, so an update can never write it; only the keep policy is valid for it. |
| `UPSERT_BULK_COMPUTE_ON_HASHED` | error | "…" is a hashed (credential) column; a computed update over its stored hash is never meaningful. |
| `UPSERT_BULK_COMPUTE_VALUE_REQUIRED` | error | The 'compute' policy on "…" needs a value MScript (existing and row are in scope). |
| `UPSERT_BULK_DUPLICATE_POLICY` | error | Property "…" has more than one column policy. |
| `UPSERT_BULK_ID_POLICY` | error | The id column is never rewritten on update; only the keep policy is valid for it. |
| `UPSERT_BULK_MATCH_BY_IGNORED` | warning | matchMode 'insert' performs no matching; matchBy is ignored. |
| `UPSERT_BULK_MATCH_KEY_NOT_UNIQUE` | error | matchBy […] cannot identify a single stored row of "…": …. |
| `UPSERT_BULK_OBJECTS_REQUIRED` | error | UpsertBulkCrudAction.objects is required — an MScript evaluating to the array of rows to write (e.g. |
| `UPSERT_BULK_POLICY_INERT` | warning | Column policies apply to UPDATED rows only; matchMode '…' never updates, so this policy is inert. |
| `UPSERT_BULK_POLICY_PROPERTY_REQUIRED` | error | A column policy must name the property it applies to. |
| `UPSERT_BULK_POLICY_VALUE_IGNORED` | warning | value is read only by the 'compute' policy; it is ignored under '…'. |
| `UPSERT_BULK_REMOTE_OBJECT_UNSUPPORTED` | error | DataObject "…" belongs to another service. |
| `UPSERT_BULK_UNKNOWN_POLICY_PROPERTY` | error | Property "…" does not exist on DataObject "…". |

## Example

Use after a FileToDataAction to load or enrich a table from a spreadsheet: match on a business key and update what the file carries, insert what is new.

```json
{
  "name": "upsertProducts",
  "description": "Upsert the parsed product rows by SKU; never overwrite a stored price with an empty cell and add incoming stock to the stored stock.",
  "childObject": "product",
  "objects": { "js": "this.parsedProducts.rows" },
  "matchBy": [
    "sku"
  ],
  "matchMode": "upsert",
  "columnPolicies": [
    {
      "property": "price",
      "onExisting": "fillIfEmpty"
    },
    {
      "property": "stock",
      "onExisting": "compute",
      "value": { "js": "(existing.stock ?? 0) + (row.stock ?? 0)" }
    }
  ],
  "errorRowHandling": "collect",
  "contextPropertyName": "productImport"
}
```
