# ApiAggregateData

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ApiAggregateData in Part 1](../ontology/ApiAggregateData.md)

**Name:** an instance is named by `dataProperty`.

Defines a single property-value pair used to populate a related data object during an aggregated operation. This structure is used in `CreateCrudAction` and `UpdateCrudAction` to specify how each property of the child object should be assigned—either statically or dynamically—from the API execution context.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dataProperty` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `(03)childObject` | The name of the target property on the child object that will be set during the operation. This must match a valid property name defined in the child data object schema. |
| `dataValue` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | The MScript expression or static value used to assign a value to the specified property. This can reference current context (`this`), a parameter (`this.input`), or the loop iteration variable when executed inside a `LoopAction` — by the name configured on `LoopAction.loopItemName` (e.g. if `loopItemName` is `customerItem`, reference `customerItem.id`). The legacy name `crudItem` is also bound as an alias for backward compatibility with older specs. |

## Constraints

Property rules:

- `dataProperty`, `dataValue` must be present. (`REQUIRED_FIELD_MISSING`)
- `dataProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_CLAUSE_ALLOWUPDATE_FALSE` | warning | dataClause row targets property "…" on "…", but the property has allowUpdate:false — the update codegen filters it out, so this value is silently never written. |
