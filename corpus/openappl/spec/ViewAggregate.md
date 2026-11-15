# ViewAggregate

**Level:** `section` · **Family:** [DataView](../ontology/families.md#dataview) (domain `BFFService`)

**Ontology:** [ViewAggregate in Part 1](../ontology/ViewAggregate.md)

**Name:** an instance is named by `name`.

Defines an aggregate (join) within a DataView that links related objects to the main object, similar to SQL-style joins. Aggregates are resolved at the Elasticsearch layer using replicated microservice data. Each aggregate pulls in one or more records from a child object based on matching keys and optional conditions, then embeds them under the specified property name in the final view output.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The property name under which the joined data will be added in the DataView. This is typically a descriptive alias for the child object, like 'userRoles' or 'companyInfo'. |
| `childObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the data object being joined (child object). This is the source of the aggregated data. Relation-target validation resolves a child DataView through its viewBasics.mainObject, including cycle-safe view-of-view chains, before comparing the parent-key relation target. |
| `parentKey` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>viewBasics.mainObject` | The key field from the main object used to perform the join. Often this is a foreign key like 'companyId' or 'userId'. |
| `childKey` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `childObject` | The key field from the child object that is matched against the parent key. Typically this would be the child's primary identifier or a linking field. |
| `oneToMany` | `Boolean` | yes |  |  |  | Specifies whether the relationship is one-to-many (true) or one-to-one (false). If true, the result will be an array of records from the child object. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript condition evaluated on the main object to decide whether this aggregation should be executed. The condition runs with the main record bound to `this`, so read record fields as `this.<field>` — e.g. `{ "js": "this.userId != null" }`. A bare field name (`userId != null`) does not resolve in the generated aggregator and fails the bff build. |
| `properties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `childObject` | The list of property names to extract from the child object. Only these fields will be included in the aggregated result. |
| `checkIn` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript condition evaluated on each child record to determine whether it should be included in the final aggregation result. The condition runs with the child record bound to `this`, so read record fields as `this.<field>` — e.g. `{ "js": "this.isActive === true" }`. A bare field name does not resolve in the generated aggregator and fails the bff build. |

## Constraints

Property rules:

- `name`, `childObject`, `parentKey`, `childKey`, `oneToMany` must be present. (`REQUIRED_FIELD_MISSING`)
- `childObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `parentKey`, `childKey`, `properties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PROPERTY_NOT_FOUND` | warning |  |
| `VIEW_AGGREGATE_CHECKIN_SESSION_BOUND` | warning | checkIn on aggregate "…" reads the request `session`, which the DataView aggregation path does not carry — the aggregate is recomputed by Kafka listeners and by the index repair walk, neither of which has a request … |
| `VIEW_AGGREGATE_CONDITION_SESSION_BOUND` | warning | condition on aggregate "…" reads the request `session`, which the DataView aggregation path does not carry — the aggregate is recomputed by Kafka listeners and by the index repair walk, neither of which has a request … |
| `VIEW_AGGREGATE_PROPERTY_COLLISION` | warning | Aggregate "…" collides with a sibling aggregate of the same name in this view — both write the same output property `source['…']` and the generated per-aggregate functions collide. |
| `VIEW_AGGREGATE_RELATION_MISMATCH` | warning | parentKey "…" on "…" declares a relation to "…", but this aggregate's childObject is "…" — the join follows the key into a different object than the relation declares. |
