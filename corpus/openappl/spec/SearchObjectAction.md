# SearchObjectAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SearchObjectAction in Part 1](../ontology/SearchObjectAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Searches one or more records from the main data object or a foreign or related data object and stores the result in the context as an id array. The search is made in elastic search index and the returned id array can be used in the where clause of the main query.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `targetObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Specifies the name of the data object to make the search data from. Can reference to the main data object, a different data object in the same service or any service within the same OpenAPPL application. |
| `keyword` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression whose result will be used as the key to match against the target object's searched properties. For example, `{ "js": "this.keyword" }`. |
| `searchProperties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `targetObject` | The properties of the target object used for matching. A stored-DataView-bound list accepts projected field and aggregate column paths from the view. Searchability warnings use each resolved source column mapping; bare stat or aggregate object names are not searchable columns. |

## Constraints

Property rules:

- `targetObject`, `keyword` must be present. (`REQUIRED_FIELD_MISSING`)
- `targetObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `searchProperties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SEARCH_OBJECT_NO_SEARCH_PROPERTIES` | warning | SearchObjectAction declares no searchProperties, so it can never match a keyword and always returns an empty list. |

## Example

Use when you need a full-text / keyword search over an Elasticsearch index to produce a list of matching record ids that a later query's where clause can filter on — e.g. resolve a user's search box input into candidate product ids.

```json
{
  "name": "searchProducts",
  "description": "Full-text search products by the caller's keyword to narrow the main listing query.",
  "targetObject": "product",
  "keyword": { "js": "this.keyword" },
  "searchProperties": [
    "title",
    "description",
    "tags"
  ],
  "contextPropertyName": "matchedProductIds"
}
```
