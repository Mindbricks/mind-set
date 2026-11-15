# DeleteBusinessWorkflow

**Level:** `section` · **Family:** [BusinessWorkflow](./families.md#businessworkflow) (domain `BusinessApi`)

**Specification:** [DeleteBusinessWorkflow in Part 2](../spec/DeleteBusinessWorkflow.md)

Defines the execution milestones for a `delete`-type Business API, which removes or soft-deletes a single record. Each field corresponds to a lifecycle milestone. Custom actions inserted at any milestone are executed in order after that point. This enables fine-grained control over logic such as confirmation checks, permission gating, logging, or external integrations—without needing to override the default deletion behavior.

**Failure semantics — NO ROLLBACK.** The milestones run sequentially with no transaction. Everything up to and including `afterCheckInstance` runs BEFORE the row is deleted, so an action that throws there leaves the database untouched. From `afterMainDeleteOperation` onward the delete is already committed, and an action that throws (`onActionError: throwError`, the default) aborts the remaining pipeline WITHOUT restoring the deleted row or undoing any write an earlier action already made — a cascade cleanup that fails half-way stays half-done. Put dependent deletes and guard-style child writes that may legitimately fail in `afterFetchInstance` / `afterCheckInstance`; use `onActionError: completeApi` for post-main cleanup that must not fail the api. `completeApi` alone is INCOMPLETE for a `deleteCrudAction`: a selector that matched no row resolves `[]` without raising anything, so nothing lands in `this.<actionName>Error`; add `onNoRows: throwError` to the action when the row it addresses must exist. See `BusinessWorkflow` for the full contract.

## Contained in

- [BusinessWorkflow](./BusinessWorkflow.md) as `delete`

Blueprint paths:

- `authentication.businessLogic.workflow.delete`
- `services.businessLogic.workflow.delete`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
