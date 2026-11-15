# PropertyStaticJoin

**Level:** `section` · **Family:** [DataProperty](../ontology/families.md#dataproperty) (domain `DataObject`)

**Ontology:** [PropertyStaticJoin in Part 1](../ontology/PropertyStaticJoin.md)

Static join settings define how this property's value is derived from another data object at the time of creation when this block is populated. The join is resolved on every create write path - an API create, a create CRUD action writing a child object, and a seed-data row of the same service - and never on an update (a seeded row is the one exception: the seed refresh re-resolves it on every boot). This approach is useful when a field in the current object depends on a static value from a related object, and that value is not expected to change frequently. Unlike dynamic joins, static joins store the fetched value directly to allow for faster queries and avoid repeated lookups. A common use case is transferring tenant or client identifiers from a parent object into a child record. For example, when creating an email job for a specific user, the system can use the userId to join the User object, fetch its clientId, and statically assign it to the EmailJob object. This makes it easy to query email jobs by clientId without needing to join back to the User table at runtime. Note that static joins are resolved AFTER the API's dataClauseItems are evaluated, so a dataClauseItems expression cannot read the joined value; when a dataClauseItems entry names the joined property itself, its value is written first and the join only fills the column while it is still null. A join keyed on the property it writes (`jointForeignKey` naming this property) can never fire and is refused (STATIC_JOIN_SELF_FOREIGN_KEY). Leave the wrapping object null when no static-join is configured.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `jointSource` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name and optionally the service of the source object from which the value will be joined. If the source is in another service, the generated service will automatically use Elasticsearch indexing to perform the join. |
| `jointRead` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `jointSource` | The name of the property in the source object whose value will be copied into the current property. Defaults to the same name as this property if not specified. |
| `jointSourceKey` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `jointSource` | The key in the source object used to identify the matching record. This is typically 'id' as the primary identifier of the source object. This field acts as the join source in the static join relationship. |
| `jointForeignKey` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `currentDataObject` | The property in the current object used as a reference to the source object (i.e., the foreign key). For example, if joining user.clientId via userId, the foreign key is 'userId'. |
| `defaultValue` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An optional fallback MScript value to use when static join cannot find a source record, or when the joined read value resolves to null/undefined. |

## Constraints

Property rules:

- `jointSource`, `jointRead`, `jointSourceKey`, `jointForeignKey` must be present. (`REQUIRED_FIELD_MISSING`)
- `jointSource` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `jointRead`, `jointSourceKey`, `jointForeignKey` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `STATIC_JOIN_SELF_FOREIGN_KEY` | error | staticJoin on property "…" sets `jointForeignKey` to "…" — the property the join itself writes. |
