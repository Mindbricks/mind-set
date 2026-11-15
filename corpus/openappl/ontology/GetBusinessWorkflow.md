# GetBusinessWorkflow

**Level:** `section` · **Family:** [BusinessWorkflow](./families.md#businessworkflow) (domain `BusinessApi`)

**Specification:** [GetBusinessWorkflow in Part 2](../spec/GetBusinessWorkflow.md)

Defines the execution milestones for a `get`-type Business API, which retrieves a single record. Each milestone represents a predefined point in the API lifecycle. Action names listed under a milestone will be executed in the given order immediately after that point is reached. This structure enables customized behaviors like access control, derived property enrichment, or API shaping without overriding core logic.

**Failure semantics — NO ROLLBACK.** The milestones run sequentially with no transaction. The main operation of a `get` api only reads, but any WRITING action you place in these stages (a `createCrudAction`, `updateCrudAction`, `publishEventAction`, `sendMailAction`, an external api call — e.g. an access-log or view-counter write) is committed on its own as soon as it completes. A later action that throws (`onActionError: throwError`, the default) aborts the remaining pipeline and answers the caller with an error, but does NOT undo those writes. See `BusinessWorkflow` for the full contract.

## Contained in

- [BusinessWorkflow](./BusinessWorkflow.md) as `get`

Blueprint paths:

- `authentication.businessLogic.workflow.get`
- `services.businessLogic.workflow.get`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
