# CollateListsAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CollateListsAction in Part 1](../ontology/CollateListsAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Use CollateListsAction to collate a list of objects to another list of objects like aggregating an adress list to a user list.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `sourceList` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An Mscript that will be evaluated to the source object array where the source objects will be collected from. |
| `targetList` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript that will be evealuted to the target object array that the collected objects will be aggregated to. |
| `sourceKey` | `String` | yes |  |  |  | The name of the property of the source object to match with the target object. If multiple objects are collected and targetIsArray is afalse, only the first object  will be aggregated. |
| `targetKey` | `String` | yes |  |  |  | The name of the property of the target object to match with the osurce object. If multiple targets are found the source objects will be copied to all matching targets. |
| `nameInTarget` | `String` | yes |  |  |  | The name of the property that will be created in the target object to store the copied source object or objects. |
| `targetIsArray` | `Boolean` | yes |  |  |  | Make this option true if you want the target property to be an array that will expect multiple source objects. |

## Constraints

Property rules:

- `sourceList`, `targetList`, `sourceKey`, `targetKey`, `nameInTarget`, `targetIsArray` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `COLLATE_SOURCE_REQUIRED` | error | CollateListsAction.sourceList is required — provide an MScript expression for the source list. |
| `COLLATE_TARGET_REQUIRED` | error | CollateListsAction.targetList is required — provide an MScript expression for the target list. |

## Example

Use to stitch one fetched list onto another by a shared key — e.g. attach each user's address records onto the matching user object so the response carries nested data without N+1 queries.

```json
{
  "name": "attachAddressesToUsers",
  "description": "Group fetched addresses under each user by userId.",
  "sourceList": { "js": "this.addresses" },
  "targetList": { "js": "this.users" },
  "sourceKey": "userId",
  "targetKey": "id",
  "nameInTarget": "addresses",
  "targetIsArray": true
}
```
