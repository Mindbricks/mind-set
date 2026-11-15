# PropertyRelation

**Level:** `section` · **Family:** [DataProperty](../ontology/families.md#dataproperty) (domain `DataObject`)

**Ontology:** [PropertyRelation in Part 1](../ontology/PropertyRelation.md)

Defines the foreign-key relationship for this property to another data object. Populate this block when `basicSettings.hasRelation === true`. Leave null/absent otherwise. The activation flag lives on basicSettings (next to `source`) so a single property-level write declares both the source and the relation.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `relationName` | `String` | yes |  |  |  | A single-word, human-readable name that identifies the relationship. This name is used in generated code and documentation to represent joined data via this relation. |
| `relationTargetObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the data object this property relates to. This defines the target of the foreign key relationship. |
| `relationTargetKey` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `relationTargetObject` | The property name (usually 'id') in the target object that this property references. This is the destination key for the relation. |
| `onDeleteAction` | `RelationOnDeleteAction` | yes |  | `doDelete`, `setNull`, `restrict`, `doNothing` |  | What happens to THIS row when the referenced (parent) row is deleted. THE ANSWER IS DECIDED BY THE SHAPE OF THE RELATION, NOT BY WHICH OPTION SOUNDS SAFEST — do not reach for setNull because a cascade sounds destructive; on a required FK setNull is not an option at all. Ask two questions in order. (1) Is this row PART OF the parent — a whole/part relationship, meaningless once the parent is gone (an experience of a creator profile, a ticket of an event)? Then `doDelete`. It is no longer a schema default: an omitted onDeleteAction now arrives unset, so state `doDelete` explicitly. (2) Otherwise this row merely POINTS AT the parent and is an independent thing (a venue pointing at whoever created it, a subscription pointing at its plan). Then ask what this row owes the pointer. (a) The pointer may go empty and the row stays meaningful — set basicSettings.isRequired to false FIRST, then `setNull`. (b) The row must keep naming the parent, and the parent must not be deletable while it does — `restrict`, which refuses the parent's deletion. (c) The row must keep naming the parent, but the parent may still be deleted and this row simply survives unchanged — `doNothing`. Rows are soft-deleted, so the kept reference still resolves, to an archived parent; this is how a sold ticket keeps naming its buyer, or an audit row its actor. NOTE: setNull writes NULL into this column, so on a NOT NULL column (isRequired true, which is also the DEFAULT when isRequired is omitted) it is unimplementable and is REJECTED at validation with RELATION_SETNULL_ON_REQUIRED_FK; the lawful answers for a required FK are doDelete, restrict and doNothing. |
| `relationIsRequired` | `Boolean` | yes |  |  |  | Defines whether the relation is mandatory. If true, the property must always reference a valid record in the related data object. |

## Constraints

Property rules:

- `relationName`, `relationTargetObject`, `relationTargetKey`, `onDeleteAction`, `relationIsRequired` must be present. (`REQUIRED_FIELD_MISSING`)
- `onDeleteAction` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `relationTargetObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `relationTargetKey` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
