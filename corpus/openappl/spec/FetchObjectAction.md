# FetchObjectAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [FetchObjectAction in Part 1](../ontology/FetchObjectAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Fetches one or more records from a foreign or related data object and stores the result in the context or response. Supports key-based lookup or complex query filtering. Commonly used to enrich the current object with external data before proceeding with workflow logic. It can return null or raise a 404 error when no objects found according to isRequired property.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `targetObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Specifies the name of the foreign data object to fetch data from. Can reference a data object in the same service or any service within the same OpenAPPL application. |
| `matchValue` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression whose result will be used as the key to match against the target object's property. For example, `{ "js": "this.customerId" }`. |
| `localKey` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `targetObject` | The property of the target object used for matching — `id`, or any unique/indexed field like `email` or `slug`. There is NO compile-time default: the generated fetch adds its match term only when BOTH `matchValue` and `localKey` are set, so leaving `localKey` empty while `matchValue` is authored silently drops the match from the query. Validation REFUSES the blueprint with FETCH_MATCH_VALUE_WITHOUT_LOCAL_KEY (ERROR). Always set it when `matchValue` is used. An MScript slot is EMPTY when no language source in it carries anything: an absent slot, `null`, and the untouched multilanguage envelope the authoring panel scaffolds (`{ "js": null, "java": null, ... }`) all count as empty, so a section you have not authored yet is never refused. |
| `whereClause` | [`MScript`](./MScript.md) | no |  |  | MScript kind `mquery` | Optional MScript query to define an advanced condition for the fetch. It does NOT override `matchValue`/`localKey` — the generated fetch MERGES them: the whereClause query is evaluated first and the `localKey: matchValue` term is added on top (AND semantics; if the whereClause constrains the same key as `localKey`, the match term wins for that key). Leave `matchValue` empty when the whereClause alone should select the record. |
| `properties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `targetObject` | An array of field names to include in the result. Leave empty to fetch all fields. Dot notation is allowed for nested fields (e.g., `profile.name`). |
| `isArray` | `Boolean` | no | `false` |  |  | If true, the action will return a list of objects. If false, a single object is expected. This affects both response shape and loop behavior. |
| `isRequired` | `Boolean` | no | `false` |  |  | Set to true if you want to use this fetch also for an existince validation. If isRequired is true, a null or empty result will create a 404 error, however this error either can be thrown or logged according to the onError property of the main action configuration. |
| `notFoundMessage` | `String` | no | `null` |  |  | The message of the 404 a REQUIRED fetch answers when it finds nothing (`isRequired: true`), e.g. `Patient profile not found` instead of the generated `<targetObject> not found`. A plain string, not MScript; unset (the default) keeps the generated message. The status stays 404, and `onActionError` still decides whether the error is thrown or logged. It has no effect while `isRequired` is false (an optional fetch never answers 404, it leaves its context property null) or on a list fetch (`isArray: true`), which answers an empty list instead of 404. |

## Constraints

Property rules:

- `targetObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `targetObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `localKey`, `properties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

## Example

Use when a workflow needs to load a related or foreign record (and optionally enforce its existence) before continuing — e.g. fetch the customer behind an order so later steps can read its tier or email.

```json
{
  "name": "fetchCustomer",
  "description": "Load the customer that placed this order and 404 if it no longer exists.",
  "targetObject": "customer",
  "matchValue": { "js": "this.order.customerId" },
  "localKey": "id",
  "properties": [
    "fullName",
    "email",
    "loyaltyTier"
  ],
  "isArray": false,
  "isRequired": true,
  "contextPropertyName": "customer"
}
```
