# GetBusinessWorkflow

**Level:** `section` · **Family:** [BusinessWorkflow](../ontology/families.md#businessworkflow) (domain `BusinessApi`)

**Ontology:** [GetBusinessWorkflow in Part 1](../ontology/GetBusinessWorkflow.md)

Defines the execution milestones for a `get`-type Business API, which retrieves a single record. Each milestone represents a predefined point in the API lifecycle. Action names listed under a milestone will be executed in the given order immediately after that point is reached. This structure enables customized behaviors like access control, derived property enrichment, or API shaping without overriding core logic.

**Failure semantics — NO ROLLBACK.** The milestones run sequentially with no transaction. The main operation of a `get` api only reads, but any WRITING action you place in these stages (a `createCrudAction`, `updateCrudAction`, `publishEventAction`, `sendMailAction`, an external api call — e.g. an access-log or view-counter write) is committed on its own as soon as it completes. A later action that throws (`onActionError: throwError`, the default) aborts the remaining pipeline and answers the caller with an error, but does NOT undo those writes. See `BusinessWorkflow` for the full contract.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `afterStartBusinessApi` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executed first, just after the api is started by the controller and BEFORE the login check (pipeline step 0): the context has the raw request, and a session the caller sent is populated, but the api's login requirement has not been enforced yet, so an anonymous caller reaches this stage. Use it for login-independent work - fundamental request validations or preparing the context. On an api that requires a login (authOptions.loginRequired, default true) an InterserviceCallAction, AgentCallAction, IntegrationAction, InterProjectCallAction, SendMailAction, CheckMailboxAction, ReadMailAction, PublishEventAction, SendSmsAction, SendWhatsAppAction or SendPushNotificationAction may not be scheduled here, directly or inside a loop/parallel container: each acts with the service's or the project's own authority (a machine-identity forward, a mail, SMS, WhatsApp or push send or a mailbox read with the project's credentials, or a Kafka event its consumer treats as a machine caller), so an anonymous caller would borrow that authority. Design time refuses that shape (PRE_AUTH_MACHINE_AUTHORITY_ACTION); schedule those actions at afterReadParameters (the first milestone after the login check) or later. |
| `afterReadParameters` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executed after parameters are extracted from the request. This is the earliest milestone and is ideal for initial validation, normalization, or preprocessing. |
| `afterTransposeParameters` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Runs after parameter transformation, such as type coercion or merging Redis parameters. Use this stage to derive dependent values or reformat inputs. |
| `afterCheckParameters` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Triggered after core validations on required or custom parameters complete. Insert validation actions here to enforce business-specific input rules. |
| `afterCheckBasicAuth` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executed after basic role and permission checks are performed. Use this for object-level access guards or dynamic access logic based on user roles. |
| `afterBuildWhereClause` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Occurs once the main `WHERE` clause is generated for the query. Insert actions here to log or modify fetch conditions or add scoped audit logic. |
| `afterMainGetOperation` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Runs immediately after the object is fetched from the database. This is the best point for enrichment actions like fetching related data or computing derived properties. |
| `afterCheckInstance` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Triggered after the instance is dispatched and check for basic requirements like existence or ownership. Insert actions here to make your own checks on the instance that was fetched. |
| `afterMissingInstance` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Alternate branch for basics.apiOptions.onNotFound=`complete`. Runs only when the get target is missing; the normal afterMainGetOperation branch and API event are skipped, then execution rejoins at afterBuildOutput. |
| `afterBuildOutput` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Executes after the response payload is constructed but before it is sent. Use this to adjust formatting, inject extra context, or remove sensitive fields. |
| `afterSendResponse` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Triggered after the response is dispatched. Use for non-blocking post-response actions like logging, analytics, or starting asynchronous flows. This milestone is SUCCESS-ONLY: an api that aborted and answered 4xx/5xx skips it entirely, along with the api event and `afterApiEvent`, so nothing authored here runs and no event is published. |
| `afterApiEvent` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Runs after the optional API-level event has been emitted. This is the final milestone and is ideal for actions that should occur after the workflow is complete. Like `afterSendResponse`, this milestone is SUCCESS-ONLY: an api that answered 4xx/5xx never reaches it. |

## Constraints

Property rules:

- `afterStartBusinessApi`, `afterReadParameters`, `afterTransposeParameters`, `afterCheckParameters`, `afterCheckBasicAuth`, `afterBuildWhereClause`, `afterMainGetOperation`, `afterCheckInstance`, `afterMissingInstance`, `afterBuildOutput`, `afterSendResponse`, `afterApiEvent` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
