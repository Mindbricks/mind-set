# ContentTransitionAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ContentTransitionAction in Part 1](../ontology/ContentTransitionAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

BusinessApiAction that drives the publishing lifecycle of a declared ContentModel record from inside a composed workflow — publish, unpublish, schedule, unschedule, archive, restore. Runs the SAME transition pipeline as the content-layer transition routes (requiredToPublish checks, version capture, lifecycle events), so workflow-driven publishing (e.g. auto-publish a release note when a version ships, unpublish a product page when stock hits zero) stays consistent with editorial publishing. Writes the updated content record to the action context.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `contentModel` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the target content model (must match a service contentModels[].contentBasics.name). |
| `contentId` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression evaluating to the id of the content record the transition targets. Example: `{ "js": "this.releaseNote.id" }`. |
| `transition` | `ContentTransition` | yes |  | 9 values, see [ContentTransition](#contenttransition) |  | The publishing transition to run. |
| `publishAt` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | For the 'schedule' transition: MScript expression evaluating to the ISO timestamp the record goes live at. Ignored by the other transitions. |

## Allowed values

### ContentTransition

`publish`, `unpublish`, `schedule`, `unschedule`, `archive`, `restore`, `submitForReview`, `approve`, `rejectToDraft`

## Constraints

Property rules:

- `contentModel`, `contentId`, `transition` must be present. (`REQUIRED_FIELD_MISSING`)
- `transition` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `contentModel` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
