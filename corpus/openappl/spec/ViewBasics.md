# ViewBasics

**Level:** `section` · **Family:** [DataView](../ontology/families.md#dataview) (domain `BFFService`)

**Ontology:** [ViewBasics in Part 1](../ontology/ViewBasics.md)

Configuration for a DataView's identity and structure. It specifies whether the view is stored (in Elasticsearch) or dynamic (evaluated at runtime), the name of the view, the main source object it is built upon, and the list of core properties to retrieve from the main object.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A unique name for the DataView. Avoid using a name that matches any existing data object to prevent conflicts. Prefer descriptive names like 'userDetailsView' that clearly indicate the view's purpose. For services resolved to Java, authored Kafka listener names and group IDs are limited to 249 Unicode code points; longer values are refused at design time before Spring listener startup. This Java-specific bound does not refuse other service languages or unresolved contexts. Use this exact name in apiOptions.dataViewName, eventDataSettings.dataViewName, view-of-view mainObject/childObject references and LIB.dataViews calls. An unreferenced name canonicalizes normally. If canonicalization would change a name with live old-name referents, validation refuses the rename with LIVE_REFERENCE_NAME_CANONICALIZATION and lists the referent paths. Update the declaration and the listed references together using the suggested name. Validation never silently migrates other objects. |
| `isStored` | `Boolean` | yes |  |  |  | Whether the view is MATERIALISED in Elasticsearch. `true`: an index is built and kept in sync from the source events, and consumers read the joined document from it (fast, seconds-stale, the right answer when the collected data is more than SQL serves well). `false` (the default): nothing is indexed and the view is computed when read - an api that binds it with `apiOptions.dataViewName` reads its main object from the DATABASE with its own where clause (fresh, so a liveness read like remaining capacity is exact) and the view's aggregates/stats are joined onto each row per request; `LIB.dataViews.<name>()` computes it for custom code; a notification bound to it computes the document when the event arrives. A dynamic view costs its joins on every read, so a read-time list that declares `paginationOptions.unpaged: true` is warned about (DATAVIEW_READ_TIME_UNBOUNDED); every list is paged unless it declares `unpaged`. |
| `mainObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The primary data object or existing view that the DataView is structured around. This object serves as the root of the aggregation. |
| `properties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `mainObject` | An array of property names from the main object that should be included in the view's result. An empty list (or an omitted one) means every column of the main object is projected: the aggregation writes the whole source document, and a stored view's index declares a mapping for every source column. A hashed or isSecret column is the exception: whether it belongs to the main object or to an aggregate's child, it is never stored in a view document and gets no mapping. List properties only to narrow the view to a subset of them. |

## Constraints

Property rules:

- `name`, `isStored`, `mainObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `mainObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `properties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `LEDGER_RAW_MINOR_COLUMN_BINDING` | error | The DYNAMIC DataView "…" declares no properties, so it binds every column of "…", including the MINOR-UNIT column(s) … of the … ledger, stored as integers at scale …. |
