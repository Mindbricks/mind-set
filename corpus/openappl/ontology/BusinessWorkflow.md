# BusinessWorkflow

**Level:** `chapter` · **Family:** [BusinessWorkflow](./families.md#businessworkflow) (domain `BusinessApi`)

**Specification:** [BusinessWorkflow in Part 2](../spec/BusinessWorkflow.md)

Defines the execution flow milestones of a Business API. Only one of the sub-flows (create, update, delete, get, list) will be populated, based on the `crudType` of the API. Each workflow contains ordered arrays of action names to be executed at predefined lifecycle milestones (e.g., after reading parameters, after the main DB operation). Actions are referenced by NAME — the canonical workflow-ref form; legacy action ids remain accepted as input (older projects may still store them) but are never required. These workflows allow complete control of the API's logic and are fully compatible with visual workflow editors. When authoring, send only the api's own crudType with only its populated phases; omitted sections are equivalent to empty.

## Failure semantics — a workflow is NOT a transaction

The milestones of a workflow run as a plain sequential async pipeline. There is NO transaction, NO savepoint, NO automatic rollback and NO automatic compensation across the actions of an api. Every write an action performs — the main CRUD operation, a `createCrudAction` / `createBulkCrudAction` / `updateCrudAction` / `deleteCrudAction`, an `interserviceCallAction` write on another service, a published event, a sent mail, an external `apiCallAction` — is COMMITTED ON ITS OWN the moment that action completes.

When an action throws with `onActionError: throwError` (the default), the api aborts and the caller receives an error response, but every write that already happened STAYS COMMITTED. An `update` whose `afterMainUpdateOperation` child create fails therefore answers 4xx/5xx while the parent row is already updated — a half-applied request the caller cannot distinguish from a total failure. This is deliberate: the framework is choreographic (see `docs/ADR-project-saga-document.md`), so recovery is the designer's job, not the runtime's.

Design for it:

- **Order failure-prone writes BEFORE the main operation.** Actions placed in a pre-main stage run before `mainOperation()`, so a throw there leaves the database untouched. The pre-main write stages per crudType are: `afterBuildDataClause` for `create` and `update`; `afterCheckInstance` (or `afterFetchInstance`) for `update` and `delete`. A child create carrying a unique index, or an `interserviceCallAction` create on another service that may reject, belongs there — not in `afterMain<Crud>Operation`.
- **Keep post-main stages for work that is idempotent, retryable or genuinely optional.** In `afterMain<Crud>Operation`, `afterBuildOutput`, `afterSendResponse` and `afterApiEvent` the main row is already committed (and the last two run ONLY on a success response — see below); `onActionError: completeApi` is usually the honest setting there, since it stores the failure as `this.<actionName>Error` and still answers the caller. Note that a zero-row `updateCrudAction` / `deleteCrudAction` is NOT a failure by default: the db-layer helper resolves `[]` when the selector matched nothing, no error is raised and no `<actionName>Error` is written, so a post-main stamp or compensation that matched nothing looks successful to `completeApi`. Set `onNoRows: throwError` on such an action to turn the empty match into a typed 404 (`errorCode: ACTION_NO_ROWS_MATCHED`) that `completeApi` stores exactly like any other action error.
- **When a write must be allowed to fail after the main write, split the flow.** Use separate apis plus an explicit compensating api (for example a status-reverting update) or a saga-style retry, and record the intent in a `ProjectSaga` document. Remote/M2M and non-db actions (`sendMailAction`, `publishEventAction`, `apiCallAction`) could never be enrolled in a database transaction anyway.

## The post-response phase is SUCCESS-ONLY

`afterSendResponse` and `afterApiEvent` run only when the api answered a SUCCESS status. If the pipeline aborted and the response is 4xx/5xx, the runtime skips the whole post-response tail — `afterSendResponse`, the api event and `afterApiEvent` — so no action authored there runs and no event is published: events are domain facts, and a request that failed produced none. The skip is recorded as a `PostResponseSuppressedOnAbort` warning naming the withheld actions, so it is visible rather than silent.

What that means when authoring:

- **Never place failure cleanup or compensation in `afterSendResponse` / `afterApiEvent`.** On a failed request those milestones do not run at all. Compensating work belongs in the stage that owns the failure, or in a separate compensating api (see above).
- **A `publishEventAction` in `afterSendResponse` announces only operations that actually happened.** It cannot fire for a request that aborted at `afterCheckParameters` or `afterBuildDataClause`.
- **An explicitly completed missing-instance response (`onNotFound: complete`) is a SUCCESS branch.** It answers 2xx and still runs `afterSendResponse`; only its api event stays suppressed, because no CRUD operation took place.
- **An idempotency-key replay skips the post-response phase too.** The ORIGINAL execution already ran it; a cached replay is a response, not a second execution.

## Contained in

- [BusinessApi](./BusinessApi.md) as `workflow`

Blueprint paths:

- `authentication.businessLogic.workflow`
- `services.businessLogic.workflow`

## Contains

- `create`: [CreateBusinessWorkflow](./CreateBusinessWorkflow.md)
- `update`: [UpdateBusinessWorkflow](./UpdateBusinessWorkflow.md)
- `delete`: [DeleteBusinessWorkflow](./DeleteBusinessWorkflow.md)
- `get`: [GetBusinessWorkflow](./GetBusinessWorkflow.md)
- `list`: [ListBusinessWorkflow](./ListBusinessWorkflow.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
