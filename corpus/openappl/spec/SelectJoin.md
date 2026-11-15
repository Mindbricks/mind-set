# SelectJoin

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [SelectJoin in Part 1](../ontology/SelectJoin.md)

**Name:** an instance is named by `joinName`.

Select join is a definition object for a join from the main object to another related data object to select additional properties from it.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `joinName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A human readable single code safe word to name the SelectJoin definition. This name is also used as the property name of the joined object or object list in the main data object. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression evaluates to Boolean and specifies whether this join should be made or not in code level, e.g (this.includeProductData). Note that this condition can not reference to the main object or main object list, for complex joins use a BFF View. |
| `joinedDataObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the data object to be joined. Note that this object should be defined as a related object in the relation settings of one of the main object properties. Or the joined object should have got a relation defined in one of its properties. If the relation is to the main object form another object, the join result will be an array for an object list. The relation may be either in the same service or in a remote service. The compiler will arrange the code to make the join either through db or the elastic search index. |
| `selector` | `String` | no |  |  |  | The selector defines how the main (operating) object is related to the joined object when more than one relation exists. It uses the syntax mainObjectKey-\>joinedObjectKey. The left side (mainObjectKey) MUST be a property of the main object being operated on. The right side (joinedObjectKey) MUST be a property of the joined (target) object. Example: main object = user, joined object = project → id-\>ownerId (user projects). Example: main object = project, joined object = user → ownerId-\>id (project owner). If selector is null or empty, the first detected relation is used. Optional shorthand forms are supported: '-\>' or empty selects the first relation, '-\>someKey' selects the first relation matching the joined object's property, 'someKey-\>' selects the first relation originating from the given main object property. For clarity and to avoid ambiguity, the full mainObjectKey-\>joinedObjectKey syntax is strongly recommended. |
| `properties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `joinedDataObject` | An array of property names to return in the join response. Leave empty to return all fields. |
| `sortBy` | [`SortByItem`](./SortByItem.md)[] | no |  |  |  | A sort definition to sort if result fetched by join is an array in case the tarrget has a parental relation with the main object. Leave it null for one to one joins where only one or no object will be fetched. |
| `topPick` | `Integer` | no |  |  |  | A number to limit the number of objects in array result fecthed in case the tarrget has a parental relation with the main object. Leave it null for one to one joins where only one or no object will be fetched. If top pick is 1, the result will be a single object even though teh fetch is an array. Example usage, to get the older member of a club in a getClub api, the member join will be sorted by -age desc- and topPick will be 1. |

## Constraints

Property rules:

- `joinName`, `joinedDataObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `joinName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `joinedDataObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `properties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
- The items of `sortBy` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PROPERTY_NOT_FOUND` | warning | Property "…" not found in joined data object "…" — removed from selectJoin properties. |
| `SELECT_JOIN_SECRET_COLUMN` | error | selectJoin "…" selects "…", which data object "…" declares secret (hashed / isSecret). |

## Example

Use a SelectJoin in a get/list API's selectClause to pull selected fields from a related object into the response under joinName — using the mainKey->joinedKey selector to disambiguate the relation. This example joins each order's customer fields onto the order.

```json
{
  "joinName": "customer",
  "joinedDataObject": "customer",
  "selector": "customerId->id",
  "properties": [
    "fullName",
    "email",
    "loyaltyTier"
  ]
}
```
