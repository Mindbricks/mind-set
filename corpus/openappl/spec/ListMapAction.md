# ListMapAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ListMapAction in Part 1](../ontology/ListMapAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

This action creates a new list out of a current list by mapping its items with MScript. By default the new list is stored under `contextPropertyName` for later actions to read — it does NOT change the api response. On a `list` api set `replacesResult: true` to make the mapped rows BE the response rows: this is the supported way to add a derived field to every row (or to reshape rows) of a list, and it must run in the `afterMainListOperation` stage, before `buildOutput` composes the envelope. To only DROP fields per row, prefer `RemoveFromResponseAction` with `applyToListRows: true` — it is declarative and needs no MScript.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `sourceList` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression to reference the source array to map from. On a `list` api the rows the main operation fetched are bound under the PLURALIZED object name — `this.gatherings` for a `gathering` list — which is the source to use together with `replacesResult`. |
| `itemName` | `String` | yes |  |  |  | A codesafe string which will be used in code to reference the item of the source array. eg. user |
| `mapScript` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript to return the new item based on the source item. Reference to the source item using the itemName given. eg. `{ name: user.name, email: user.Email, firstName: user.name.split(' ')[0] }`. If you need a multi-lined script to make precalculations use an arrow function definition called inline. eg: `((user) => { /* your code here */ })(user)` |
| `replacesResult` | `Boolean` | no | `false` |  |  | List apis only. When true, the mapped array is assigned back to the api's result rows, so `buildOutput` ships THEM — this is how a derived field reaches every row of a list response. Without it the mapped array only lands on the workflow context (and `contextPropertyName: "result"` does NOT replace the response — it is a reserved name and an ERROR). The action must be wired into the `afterMainListOperation` stage: earlier there are no rows yet, and from `afterBuildOutput` on the envelope is already composed. The map is 1:1, so the paging totals stay correct. To drop fields rather than add them, `RemoveFromResponseAction.applyToListRows` is the simpler construct. |

## Constraints

Property rules:

- `sourceList`, `itemName`, `mapScript` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `LISTMAP_MISSING_SOURCE` | error | ListMapAction declares a mapScript but sourceList is empty. |

## Example

Use to transform a list into a reshaped list — projecting, renaming, or deriving fields per item. Without `replacesResult` the new array is stored in context for downstream actions; with `replacesResult: true` on a list api it replaces the rows the response ships.

```json
{
  "name": "deriveGatheringStatus",
  "description": "Add a computed derivedStatus to every row of the gathering list response.",
  "sourceList": { "js": "this.gatherings" },
  "itemName": "gathering",
  "mapScript": { "js": "({ ...gathering, derivedStatus: LIB.deriveStatus(gathering.startTime, gathering.publicationStatus) })" },
  "replacesResult": true
}
```
