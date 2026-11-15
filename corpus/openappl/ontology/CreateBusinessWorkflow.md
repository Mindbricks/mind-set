# CreateBusinessWorkflow

**Level:** `section` · **Family:** [BusinessWorkflow](./families.md#businessworkflow) (domain `BusinessApi`)

**Specification:** [CreateBusinessWorkflow in Part 2](../spec/CreateBusinessWorkflow.md)

Defines the standard execution milestones for a `create`-type Business API. Each field represents a milestone (a fixed lifecycle stage), and its value is an ordered list of action names executed by the API manager. These steps include all default, hardcoded logic (e.g., session handling, parameter extraction, DB insert) while leaving space for user-defined actions after each milestone. You can modify this workflow programmatically or visually.

**Failure semantics — NO ROLLBACK.** The milestones run sequentially with no transaction. Everything up to and including `afterBuildDataClause` runs BEFORE the row is inserted, so an action that throws there leaves the database untouched. From `afterMainCreateOperation` onward the new row is already committed, and an action that throws (`onActionError: throwError`, the default) aborts the remaining pipeline WITHOUT undoing that insert or any write an earlier action already made. Put child writes that may legitimately fail — a unique-index child create, an `interserviceCallAction` create on another service, an external api call — in `afterBuildDataClause`; use `onActionError: completeApi` for post-main work that must not fail the api. See `BusinessWorkflow` for the full contract.

## Contained in

- [BusinessWorkflow](./BusinessWorkflow.md) as `create`

Blueprint paths:

- `authentication.businessLogic.workflow.create`
- `services.businessLogic.workflow.create`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
