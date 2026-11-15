# UpdateBusinessWorkflow

**Level:** `section` · **Family:** [BusinessWorkflow](./families.md#businessworkflow) (domain `BusinessApi`)

**Specification:** [UpdateBusinessWorkflow in Part 2](../spec/UpdateBusinessWorkflow.md)

Defines the execution milestones for an `update`-type Business API, used to modify an existing record. Each field represents a fixed lifecycle milestone. Custom action names placed under a milestone will be executed in order after that point. These workflows enable full customization of business logic without overriding default update behavior, and they support visual modeling of logic steps.

**Failure semantics — NO ROLLBACK.** The milestones run sequentially with no transaction. Everything up to and including `afterBuildDataClause` (and before it `afterFetchInstance` / `afterCheckInstance`) runs BEFORE the row is updated, so an action that throws there leaves the database untouched. From `afterMainUpdateOperation` onward the parent row is already committed, and an action that throws (`onActionError: throwError`, the default) aborts the remaining pipeline WITHOUT reverting that update or any write an earlier action already made — the classic corruption is a status-advancing update whose `afterMainUpdateOperation` child create 409s, leaving the record advanced and the child missing. Put child writes that may legitimately fail in `afterCheckInstance` or `afterBuildDataClause`; use `onActionError: completeApi` for post-main work that must not fail the api, and an explicit compensating api when a post-main write really can fail. `completeApi` alone is INCOMPLETE for an `updateCrudAction`: a selector that matched no row resolves `[]` without raising anything, so nothing lands in `this.<actionName>Error`; add `onNoRows: throwError` to the action when the row it addresses must exist. See `BusinessWorkflow` for the full contract.

## Contained in

- [BusinessWorkflow](./BusinessWorkflow.md) as `update`

Blueprint paths:

- `authentication.businessLogic.workflow.update`
- `services.businessLogic.workflow.update`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
