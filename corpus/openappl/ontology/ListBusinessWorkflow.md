# ListBusinessWorkflow

**Level:** `section` · **Family:** [BusinessWorkflow](./families.md#businessworkflow) (domain `BusinessApi`)

**Specification:** [ListBusinessWorkflow in Part 2](../spec/ListBusinessWorkflow.md)

Defines the execution milestones for a `list`-type Business API, which returns a paginated set of records. Each field represents a fixed lifecycle milestone. Action names added to a milestone will be executed in order after that point. This structure enables modular extension of logic for filtering, permission enforcement, data enrichment, and more—without overriding the main query behavior.

**Failure semantics — NO ROLLBACK.** The milestones run sequentially with no transaction. The main operation of a `list` api only reads, but any WRITING action you place in these stages (a `createCrudAction`, `updateCrudAction`, `publishEventAction`, `sendMailAction`, an external api call — e.g. an audit or export record) is committed on its own as soon as it completes, and per-item writes inside a `loopAction` commit one by one. A later action that throws (`onActionError: throwError`, the default) aborts the remaining pipeline and answers the caller with an error, but does NOT undo the writes that already succeeded. See `BusinessWorkflow` for the full contract.

## Contained in

- [BusinessWorkflow](./BusinessWorkflow.md) as `list`

Blueprint paths:

- `authentication.businessLogic.workflow.list`
- `services.businessLogic.workflow.list`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
