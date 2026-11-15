# ListJointFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ListJointFilter in Part 1](../ontology/ListJointFilter.md)

**Name:** an instance is named by `name`.

ListJointFilter definition object for a joint filter from the main object to another related data object to filter the main list result. This is like lefy join in the where clause. If you want to filter your list result with a criteria which is evaluated in a related object other than main object, you can use joint filter.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A human readble single code safe word to name the JointFilter deifnition. |
| `condition` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression evaluates to Boolean and specifies wheather this filtering should be made or not in code level. Note that this condition can not reference to the main object list, for complex joint filters use a BFF View. |
| `joinedDataObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the data object to be joined. Note that this object should be defined a s a related object in the relation settings of one of the main object properties. Or the joined object should have got a relation defined in one of its properties. The relation may be either in the same service or in a remote service. The compiler will arrange the code to make the join either through db or the elastic search index. |
| `selector` | `String` | yes |  |  |  | The selector defines how the main (operating) object is related to the joined object when more than one relation exists. It uses the syntax mainObjectKey-\>joinedObjectKey. The left side (mainObjectKey) MUST be a property of the main object being operated on. The right side (joinedObjectKey) MUST be a property of the joined (target) object. Example: main object = user, joined object = project → id-\>ownerId (user projects). Example: main object = project, joined object = user → ownerId-\>id (project owner). If selector is null or empty, the first detected relation is used. Optional shorthand forms are supported: '-\>' or empty selects the first relation, '-\>someKey' selects the first relation matching the joined object's property, 'someKey-\>' selects the first relation originating from the given main object property. For clarity and to avoid ambiguity, the full mainObjectKey-\>joinedObjectKey syntax is strongly recommended. |
| `whereClause` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `mquery` | An Mscript query to select the object id array from th target object. Note that the result object id list will be used in the main where clause. |
| `fuzzyDomainFilters` | [`FuzzyDomainFilter`](./FuzzyDomainFilter.md)[] | no |  |  |  | Fuzzy filters on the JOINED object (FuzzyDomainFilter): each narrows the joined rows this joint filter selects by `property IN (<qualifying values>)` before their keys are collected, with `targetProperty` naming a property of `joinedDataObject`. Optional. |

## Constraints

Property rules:

- `name`, `condition`, `joinedDataObject`, `selector`, `whereClause` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `joinedDataObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- The items of `fuzzyDomainFilters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
