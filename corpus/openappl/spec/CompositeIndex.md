# CompositeIndex

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [CompositeIndex in Part 1](../ontology/CompositeIndex.md)

**Name:** an instance is named by `indexName`.

Defines a composite index for a data object. Composite indexes improve database performance for queries that filter or sort based on multiple fields. Each index is created at the database level and can optionally handle duplicate conflicts during insert operations. Note that if you need unique constraints on a single field, you can use the `unique` property of the DataProperty instead. Composite indexes are particularly useful for optimizing complex queries that involve multiple fields, such as searching for users by email and client ID simultaneously or whne you need to ensure uniqueness across multiple fields (e.g., email and clientId). They are defined at the data object level and will be used across all related Business APIs.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `indexName` | `String` | yes |  |  |  | Unique name of the database index. Used in DDL statements and must be unique within the scope of the current data object. Choose a descriptive name that reflects the indexed fields (e.g., userEmailIndex). |
| `indexFields` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | List of field names that form the composite index. The order of fields matters for query optimization. For example, ['email', 'clientId'] allows fast lookups for email within a specific client context. |
| `onDuplicate` | `OnDuplicate` | yes |  | `doUpdate`, `throwError`, `stopOperation`, `doInsert` |  | Defines the behavior when an insert operation encounters a duplicate key on this index. Options include updating the existing row or throwing an error. Useful for implementing upsert logic. By default (nullsNotDistinct: false), a key that carries a NULL is never a duplicate: the generated duplicate check skips a record with any null index field and the database unique index treats NULLs as distinct, so for such a row every option except doInsert does nothing and the write inserts a new row. Validation warns (COMPOSITE_INDEX_NULLABLE_MEMBER) when an index other than doInsert includes a non-required property; make every member required (with a defaultValue sentinel where needed) when the index must hold one row per combination. Alternatively set nullsNotDistinct: true on PostgreSQL 15+ (declare serviceOptions.postgresMajorVersion >= 15) or MongoDB to apply onDuplicate to NULL-bearing logical keys.  WHAT THE WORKFLOW SEES. `stopOperation` and `doUpdate` make a create api idempotent: a replay answers 2xx with the existing row. The api manager reports which happened as `this.createOutcome` — `'created'` when a row was really inserted, `'duplicateStopped'` when this index matched and NOTHING was written, `'duplicateUpdated'` when it matched and the row was updated in place. Post-main actions still run on a replay (the pipeline is not skipped), so gate any side effect that must not repeat — a child create, a counter allocation, a published event — with `condition: "this.createOutcome === 'created'"`. Without that gate the replay re-runs every one of them against the row that already has them, silently: the response body looks correct and only the database shows the duplicate children. Available from `afterMainCreateOperation` on, and only on a `create` api whose object declares an index with one of these two policies. |
| `nullsNotDistinct` | `Boolean` | no | `false` |  |  | Opt-in NULL-equal logical keys, default false. Supported by nodejs, java, dotnet, rust and python on PostgreSQL 15+ (declare serviceOptions.postgresMajorVersion >= 15) and MongoDB only. A unique composite with this flag treats null members as equal; MongoDB also treats a missing member as null. create/createBulk apply onDuplicate to null-bearing keys. PostgreSQL emits NULLS NOT DISTINCT; MongoDB omits nullable-member type filters while retaining soft-delete and partialWhere predicates. Unsupported stores are rejected. Existing indexes require an explicit migration; reconcile never tightens an existing unique automatically. Cannot be combined with onDuplicate doInsert. |
| `partialWhere` | `Any` | no |  |  |  | A PARTIAL-index predicate: an equality map from first-level declared property names of the owning data object to scalar literals, e.g. { "isDefault": true }. The index then covers ONLY the rows that match every entry, so a unique index enforces uniqueness inside that row set and nowhere else ("at most one default per (userId, providerName)" is indexFields [userId, providerName] with partialWhere { isDefault: true }). Each key must be a declared Boolean, Enum or String property (not a framework column, not the tenant column); each value must be a string or boolean literal matching the property type. The predicate is ANDed onto the soft-delete predicate the index already carries on a useSoftDelete object (sequelize `where`, MongoDB `partialFilterExpression`), and the boot reconcile compares it like any declared `where`. Leave it unset (the default) for an index over every live row. On a database that already holds rows violating a new partial UNIQUE index, the index build fails and the service boots without it (the table is reported degraded and /health lists the pending migration) unless a data repair runs first. |

## Constraints

Property rules:

- `indexName`, `onDuplicate` must be present. (`REQUIRED_FIELD_MISSING`)
- `onDuplicate` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `indexFields` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `COMPOSITE_INDEX_NULLS_NOT_DISTINCT_LANGUAGE` | error | nullsNotDistinct is implemented only for nodejs, java, dotnet, rust and python services. |
| `COMPOSITE_INDEX_NULLS_NOT_DISTINCT_NON_UNIQUE` | error | nullsNotDistinct requires a unique index (onDuplicate must not be doInsert). |
| `COMPOSITE_INDEX_NULLS_NOT_DISTINCT_TARGET` | error | nullsNotDistinct requires PostgreSQL 15+ or MongoDB. |
| `COMPOSITE_INDEX_NULLS_NOT_DISTINCT_VERSION` | error | Declare serviceOptions.postgresMajorVersion >= 15 for nullsNotDistinct. |
