# InteractionSource

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [InteractionSource in Part 1](../ontology/InteractionSource.md)

**Name:** an instance is named by `name`.

A resolved descriptor of interaction records with known roles (recommendation ADR section 2). It names the event object that holds the interactions, the property path that plays each of the item, group, actor, time and weight roles, the signal label, and the records that count. Patterns publish these from their own config; a designer declares one for a hand-modelled data model. The same contract later serves trend analytics, segmentation and repeat-purchase reporting.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A unique name of this source among the object's sources; a list's evidence names it in `source`. |
| `from` | `InteractionSourceOrigin` | no | `"declared"` | `pattern`, `declared` |  | Where the descriptor comes from (InteractionSourceOrigin). A source stored in the blueprint is `declared` (the default); `pattern` descriptors are computed by the pattern's shared reader and never stored. |
| `pattern` | `InteractionSourcePattern` | no |  | `shoppingCart`, `checkout`, `invoicing`, `subscription`, `visits`, `videoAttendance`, `hubMessages` |  | For a `from: pattern` descriptor: the publishing pattern (InteractionSourcePattern). |
| `patternTarget` | `String` | no |  |  |  | For a `from: pattern` descriptor: which instance of the pattern, when the service has several (a cart config name, a visit-tracked object name). |
| `eventObject` | [`DataObjectName`](./DataObjectName.md) | no |  |  | names a [DataObject](./DataObject.md) | For a `from: declared` source: the data object whose rows are the interaction records (an order line, a play event). |
| `itemProperty` | `String` | yes |  |  |  | Property path, on the event object, to the item key. A path is a property of the event object or `<relation>.<property>` one relation hop away (a relation property, or the `<object>Id` foreign key of an object of the same service); deeper paths are refused (RECOMMENDATION_SOURCE_PATH_UNRESOLVED). |
| `itemLookup` | `String` | no | `"id"` |  |  | The item object's property the item key matches. Default `id`; a catalog cart keyed by barcode names `barcode`. |
| `groupProperty` | `String` | no |  |  |  | Property path to the group that `together` means: a basket, a session, a conversation. Required by `coPurchased` and `coViewed`. |
| `actorProperty` | `String` | no |  |  |  | Property path to the actor: a user id or an anonymous session key. Relation traversal is allowed (`order.ownerId`). Required by `coConsumed`, `consumedAfter` and `repeat`. |
| `timeProperty` | `String` | no |  |  |  | Property path to the interaction time. Required by the windowed and decayed relations. |
| `signal` | `String` | yes |  |  |  | The signal label of these interactions (`ordered`, `purchase`, `view`, `read`, `attend`, ...). Every recommendation response carries it, so a list built on `ordered` never claims `bought`. |
| `validWhen` | [`MScript`](./MScript.md) | no |  |  | MScript kind `mquery` | A where-clause (MScript query) selecting the records that count, e.g. `({ status: ['placed', 'shipped'] })`. Evaluated once per refresh, so it may use literals but no request value; its keys are properties of the event object or of an object a role path reaches (`order.status`), and its operators are equality, arrays (IN), `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$and`, `$or` and `$not`. A clause outside that vocabulary fails the refresh rather than counting every record. |
| `weightProperty` | `String` | no |  |  |  | Property path to an optional interaction strength, e.g. a line quantity. |

## Constraints

Property rules:

- `name`, `itemProperty`, `signal` must be present. (`REQUIRED_FIELD_MISSING`)
- `from`, `pattern` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `eventObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
