# ContentTransitionAction

Apply a publish, unpublish, schedule, unschedule, archive or restore transition to a record of a declared content model. A scheduled transition takes its go-live time from `publishAt`. The transition uses the same lifecycle checks as an editorial API. A publish fails when a field marked `requiredToPublish` is missing.

See the [pattern reference](../../spec/ContentTransitionAction.md) and the [content editorial guide](../capabilities/content-editorial.md).
