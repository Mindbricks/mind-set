# ContentTransitionAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ContentTransitionAction in Part 2](../spec/ContentTransitionAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

BusinessApiAction that drives the publishing lifecycle of a declared ContentModel record from inside a composed workflow — publish, unpublish, schedule, unschedule, archive, restore. Runs the SAME transition pipeline as the content-layer transition routes (requiredToPublish checks, version capture, lifecycle events), so workflow-driven publishing (e.g. auto-publish a release note when a version ships, unpublish a product page when stock hits zero) stays consistent with editorial publishing. Writes the updated content record to the action context.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `contentTransitionActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.contentTransitionActions`
- `services.businessLogic.actions.contentTransitionActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
