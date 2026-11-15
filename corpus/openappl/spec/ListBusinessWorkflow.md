# ListBusinessWorkflow

**Level:** `section` · **Family:** [BusinessWorkflow](../ontology/families.md#businessworkflow) (domain `BusinessApi`)

**Ontology:** [ListBusinessWorkflow in Part 1](../ontology/ListBusinessWorkflow.md)

Defines the execution milestones for a `list`-type Business API, which returns a paginated set of records. Each field represents a fixed lifecycle milestone. Action names added to a milestone will be executed in order after that point. This structure enables modular extension of logic for filtering, permission enforcement, data enrichment, and more—without overriding the main query behavior.

**Failure semantics — NO ROLLBACK.** The milestones run sequentially with no transaction. The main operation of a `list` api only reads, but any WRITING action you place in these stages (a `createCrudAction`, `updateCrudAction`, `publishEventAction`, `sendMailAction`, an external api call — e.g. an audit or export record) is committed on its own as soon as it completes, and per-item writes inside a `loopAction` commit one by one. A later action that throws (`onActionError: throwError`, the default) aborts the remaining pipeline and answers the caller with an error, but does NOT undo the writes that already succeeded. See `BusinessWorkflow` for the full contract.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `afterStartBusinessApi` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executed first, just after the api is started by the controller and BEFORE the login check (pipeline step 0): the context has the raw request, and a session the caller sent is populated, but the api's login requirement has not been enforced yet, so an anonymous caller reaches this stage. Use it for login-independent work - fundamental request validations or preparing the context. On an api that requires a login (authOptions.loginRequired, default true) an InterserviceCallAction, AgentCallAction, IntegrationAction, InterProjectCallAction, SendMailAction, CheckMailboxAction, ReadMailAction, PublishEventAction, SendSmsAction, SendWhatsAppAction or SendPushNotificationAction may not be scheduled here, directly or inside a loop/parallel container: each acts with the service's or the project's own authority (a machine-identity forward, a mail, SMS, WhatsApp or push send or a mailbox read with the project's credentials, or a Kafka event its consumer treats as a machine caller), so an anonymous caller would borrow that authority. Design time refuses that shape (PRE_AUTH_MACHINE_AUTHORITY_ACTION); schedule those actions at afterReadParameters (the first milestone after the login check) or later. |
| `afterReadParameters` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executed immediately after request and Redis parameters are read into context. Use this stage for early validations or transformations on raw inputs. |
| `afterTransposeParameters` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Runs after parameter reshaping or normalization logic. Use this for refining structured inputs or deriving helper values for downstream use. |
| `afterCheckParameters` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executed after required and custom parameters have been validated. Place custom validation or cross-field logic actions here. |
| `afterCheckBasicAuth` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Runs after role-based access checks. Use this milestone to insert actions that enforce access based on session, membership, or other dynamic conditions. |
| `afterBuildWhereClause` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Triggered after the main query’s `WHERE` clause has been finalized. Insert logic here for audit logging or external query construction monitoring. |
| `afterMainListOperation` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Runs after the paginated list has been retrieved from the database. Use this milestone for data enrichment, parallel fetches, or computed fields. |
| `afterBuildOutput` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executed after the response payload has been shaped. This is the best point to inject additional context, sanitize outputs, or apply output transformations. |
| `afterSendResponse` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Runs after the list result has been sent to the client. Use this for analytics, usage tracking, or triggering asynchronous actions. This milestone is SUCCESS-ONLY: an api that aborted and answered 4xx/5xx skips it entirely, along with the api event and `afterApiEvent`, so nothing authored here runs and no event is published. |
| `afterApiEvent` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executed after the optional API-level event is published (if configured). This is the final milestone for clean-up or system-level broadcasting. Like `afterSendResponse`, this milestone is SUCCESS-ONLY: an api that answered 4xx/5xx never reaches it. |

## Constraints

Property rules:

- `afterStartBusinessApi`, `afterReadParameters`, `afterTransposeParameters`, `afterCheckParameters`, `afterCheckBasicAuth`, `afterBuildWhereClause`, `afterMainListOperation`, `afterBuildOutput`, `afterSendResponse`, `afterApiEvent` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
