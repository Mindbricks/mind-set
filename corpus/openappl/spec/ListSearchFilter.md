# ListSearchFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ListSearchFilter in Part 1](../ontology/ListSearchFilter.md)

Searches one or more records from the main data object and uses the id array in the where clause of the list. The search is made in elastic search index and the result id array is appended to the where clause of the main query.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasSearchFilter` | `Boolean` | yes |  |  |  | A Boolean value to define if a search filter definition is active in the api or not |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An optional MScript which evaluates to a boolean that defines id the search filter will be used or not |
| `keyword` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression whose result will be used as the key to match against the target object's searched properties. For example, `{ "js": "this.keyword" }`. |
| `searchProperties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `currentObject` | The properties of the target object used for matching. |

## Constraints

Property rules:

- `hasSearchFilter` must be present. (`REQUIRED_FIELD_MISSING`)
- `searchProperties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PROPERTY_NOT_FOUND` | error | Property "…" not found in DataView "…". |
| `SEARCH_PROPERTY_NOT_FULLTEXT` | warning |  |
