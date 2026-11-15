---
title: ApiManager
---

# ApiManager

Every `BusinessApi` you declare compiles to a per-API runtime unit, the
**ApiManager**. All of that API's business logic - reading parameters, the
auth gate, the where / data clauses, each action, each workflow milestone -
runs in this one object. Understanding what it holds and in which order it
runs is the fastest way to debug a business-logic bug: the manager *is* the
runtime context, and in MScript `this` IS the manager.

This page is the author-facing contract: what `this` holds, how
`BusinessApi` settings map onto the pipeline, and which step runs when. How
a compiler lays the manager out in a given target language (class hierarchy,
emitted method names, generated files) is covered in
[the compiler specification](../../compiler/index.md).

## `this` is the context

Everything the workflow touches is a property of the live manager:

- **Request parameters** become typed fields: each
  `parameters.requestParameters[].name` is populated by the read-parameters
  step. `this.orderId`, `this.reason` - the same names you reference in
  MScript.
- **Session** is `this.session` (`this.session.userId`,
  `this.session.role`, `this.session.tenantCodename`, and - on a
  multi-tenant project - the tenant id under the project's OWN tenant name,
  `this.session.<tenantName>Id`). There is no generic
  `this.session.tenantId`: nothing stamps it. `this._tenantId` is the
  manager's alias for the same value and is not a session field.
- **The route id** of a get / update / delete api is `this.<dataName>Id`
  (`this.orderId` for an `order` api): the read-parameters step reads the
  `:id` / `:orderId` path segment (or a body / query `id`) into it. There
  is no `this.id` on those apis, nor on a list: only a create binds
  `this.id` (the new row's primary key). A `this.id` read on a get /
  update / delete / list api (an api with no `crudType` builds as a get)
  is refused at design time with `MSCRIPT_THIS_ID_UNBOUND` (a where
  clause on it would match no row), unless the api declares a request
  parameter or a context property named `id`. Exactly two fallback
  spellings are only a warning: `this.id ?? this.orderId` and
  `this.id || this.orderId` (in that order, plain `this.` reads, not
  inside a `function` or class body), and only when the script has no
  call, assignment, update, `delete`, `await`, spread or for-in / for-of
  anywhere (any of them could clear `this.orderId` first), on a target whose
  manager really binds `this.orderId` (a get / update /
  delete api with an `:id` / `:orderId` route segment, or the default
  route without an authored where clause). Every other
  shape - a ternary or comparison on `this.id`, the reversed order, an
  optional chain - keeps the error, even when it would work: write
  `this.orderId` alone. The rule follows the service language: some targets
  mirror the route id and the request into the context so `this.id` is bound
  there (no finding). Prefer `this.<dataName>Id`, which is portable.
- **The located record** is `this.instance` (after the fetch step on
  get / update / delete).
- **Action results** land under each action's `contextPropertyName`
  (`this.buyer`, `this.quote`, ...).
- **The DB result** is `this.result`; the response is built from it.

So an MScript expression like
`this.instance.status === 'draft'` resolves against this object -
`this` is the manager, not a free-floating bag. (See
[Actions & workflow - overview](../workflow/overview.md)
for the same `this`-binding rule across actions.)

## How BusinessApi settings map onto the pipeline

The compiler walks the BusinessApi and produces three kinds of behaviour.

### 1. Pipeline steps

The pipeline has 13 steps. A step runs only if this API needs it, driven by
`crudType` and the `query` clauses:

| BusinessApi setting | Pipeline step |
|---|---|
| `requestParameters` (REST) | read parameters: reads body / query / urlpath / header / ... onto `this.<name>`. (The same step reads Kafka, gRPC, MCP, cron and Redis input per transport.) |
| parameter `transform` MScript | transform parameters |
| parameter `required` / `type` | check parameters |
| `authOptions` | check basic auth |
| `whereClause` (get / list / update / delete) | build where clause |
| update / delete | fetch instance: sets `this.instance` |
| `dataClauseItems` (create / update) | build data clause: sets `this.dataClause` |
| the crudType's DB op | main operation: calls the data-layer operation for the object (create, get by id, list, update by id, delete by id) and sets `this.result` |
| `addToResponseActions` | piggybacks on the build-output stage |
| `raiseApiEvent` | raise the API event |

### 2. One step per action

Each entry in the action store
([`BusinessApiActionStore`](../../spec/BusinessApiActionStore.md))
becomes an executable step named after the action's `name`, built from the
action type (`ValidationAction`, `FetchObjectAction`, `PublishEventAction`,
...) with the action's MScript fields pre-compiled. An action with an
unknown type does not run, which is a useful thing to know when an action
silently doesn't run.

### 3. Workflow stages -> milestone wiring

Each non-empty `workflow.<crudType>.<milestone>` runs after the matching
pipeline step. The stage names match the milestone names one-to-one -
`afterFetchInstance`, `afterMainUpdateOperation`, etc. The stage runs each
referenced action in declared order, honoring the action's `condition` gate,
`onActionError` policy, and SSE progress emission.

For an update API whose workflow is
`afterCheckInstance: ["checkDraft", "loadBuyer"]` and
`afterMainUpdateOperation: ["fireEvent"]`, the order is: the check-instance
step, then `checkDraft` (only if its `condition` holds), then `loadBuyer`;
later, after the main write, `fireEvent`.

An action declared in the store but **not** referenced from any
workflow milestone never runs - a common cause of "my action isn't
running."

## Lifecycle step -> milestone map

This mirrors the overview's [request lifecycle](overview.md#request-lifecycle).
When debugging, find the failing step here:

| # | Pipeline step | Workflow hook |
|---|---|---|
| 0 | start | `afterStartBusinessApi` |
| 1 | check valid login | none: `afterCheckValidLogin` is an internal hook, not a workflow milestone |
| 2 | read parameters (+ Redis) | `afterReadParameters` |
| 3 | transform parameters | `afterTransposeParameters` |
| 4 | check parameters | `afterCheckParameters` |
| 5 | check basic auth | `afterCheckBasicAuth` |
| 5e | approval milestone (create / list / a get that fetches no instance) | - |
| 6 | build where clause | `afterBuildWhereClause` |
| 7 | fetch instance (update / delete) | `afterFetchInstance` |
| 8 | check instance | `afterCheckInstance` |
| 8c | approval milestone (update / delete / an ownership-checked get) | - |
| 9 | build data clause (create / update) | `afterBuildDataClause` |
| 9b | moderation seam (create / update of an `objectModeration` object) | - |
| 10 | main operation | - |
| 11 | after main op | `afterMain<Crud>Operation` |
| 12 | build output | `afterBuildOutput` |
| 13 | after response (event) | `afterSendResponse`, `afterApiEvent` |

Steps 6-8 run only for non-create kinds; 7-8 only for update / delete;
9 only for create / update; 9b only on a create / update the
[`objectModeration`](../capabilities/object-moderation.md) seam covers (a held
`staged` write answers `202` there and steps 10-13 never run); 5e / 8c only on an api declaring
`requireApproval`; 13 runs *after* the response is sent (its errors are
logged, never propagated).

Step 0 runs **before** the login check, so an anonymous caller reaches
`afterStartBusinessApi` even on an api that requires a login. The stage is
for login-independent work. On an api with `loginRequired` true (the
default), an `InterserviceCallAction`, `AgentCallAction`,
`IntegrationAction` or `InterProjectCallAction` may not be scheduled there,
directly or inside a scheduled loop/parallel container: each forwards with
the service's own machine identity, so the target would see an anonymous
caller as a trusted machine caller. The same refusal covers
`SendMailAction` (with or without a `mailAccount`: the service sends with
the project's own mail credentials), `CheckMailboxAction` and
`ReadMailAction` (they read a project mailbox under the service M2M token),
`PublishEventAction` (the consuming api
treats a Kafka dispatch as a machine caller) and the notification sends
`SendSmsAction`, `SendWhatsAppAction` and `SendPushNotificationAction` (the
service sends with the project's notification-provider credentials).
Design time refuses the shape with `PRE_AUTH_MACHINE_AUTHORITY_ACTION`;
schedule those actions at `afterReadParameters` (the first milestone after the login check) or later.

### The approval milestone
An api that declares `authOptions.requireApproval` runs
the approval check at a FIXED point, never a workflow stage: after every
authorization check (steps 1-5, the type-level `permissionCheck` and
`parentOwnershipChecks`) and before the first stage that may write. For
`create`, `list` and a `get` that fetches no instance it is step **5e**, right
before the where-clause / data-clause steps; for `update`, `delete` and an
ownership-checked `get` it is step **8c**, after `afterCheckInstance` and the
object-level permission check, before the data-clause step. The SSE / events
pipeline runs it at the same two points. Without an `api-approval-id` the api
answers 403 `APPROVAL_REQUIRED` there and sends the code; with a valid id and
code it consumes the approval and continues. Workflow stages BEFORE the
milestone (`afterStartBusinessApi` through `afterCheckBasicAuth`, and for step
8c also `afterBuildWhereClause`, `afterFetchInstance`, `afterCheckInstance`)
therefore run on the challenged first call too: keep writes out of them
(`APPROVAL_GATE_AFTER_WRITE`). The full contract is on
[Business API auth](../system-services/authentication/business-api-auth.md#step-up-approval-requireapproval).

**Tenant-scoped protected apis authenticate first.** On a
multi-tenant project, a login-required api that is not SaaS-level and reads
tenant-scoped rows - its own object is tenant-scoped (a non-create api, the
tenant object itself included), or it carries a fetch, fetch-parent,
fetch-stats, update-crud or delete-crud action on a tenant-scoped object, or a
`parentOwnershipChecks` parent that is tenant-scoped - runs step 1 (the login
check, including the tenant check below), the caller-kind check and the early
role check BEFORE step 0, so `afterStartBusinessApi` never runs for a caller
those checks refuse. Each check runs once. Such an api also refuses a
logged-in user who carries no tenant: **403 `TENANT_REQUIRED`**
(`errMsg_TenantRequired`). The tenant that counts is the session's own tenant,
or, for a `superAdmin` session without one, a tenant the request explicitly
named with the tenant header that resolved to a real, non-root tenant. The
header alone never gives a plain user a tenant, and neither does the root
fallback. Login-free apis, cron runs, a verified machine (M2M) caller with no
user session and Kafka events from a system actor are not affected; a plain
create stamps the root tenant for a caller without one.
Every other api keeps the order in the table.

**A machine (M2M) caller is scoped to the tenant its token signs.** On a
multi-tenant project, right after the `x-m2m-token` is verified and before the
login check, the manager decides the tenant of a verified machine caller at one
place: a `callerTenantId` claim signed into the
token (set by the caller's interservice call, the agent hub client and the
agent harness runner's machine arm) scopes the whole call to that tenant exactly
as a session tenant would - the where-clause pin, the create stamp, the search-index pin,
the cache key and the authorization tenant all read it - and a tenant header
that resolved to a different, non-root tenant is refused **403
`M2M_TENANT_MISMATCH`**. A forwarded user session keeps the user's tenant, and a
claim that names another tenant is refused the same way; a cross-project
forwarded identity's tenant (the generic `tenantId` the sibling project
forwarded) counts as that session tenant. A machine call that names no tenant
at all (no session tenant, no claim, no header) on an api whose manager reads
the session tenant (the apis the API document declares the tenant header on)
is refused **403 `M2M_TENANT_REQUIRED`** instead of being served the root
tenant; a platform-level object and a SaaS-level api keep the root floor,
while the framework's own payment machine twins (their callers sign the
persisted ticket, order or mapping tenant) and a designer-declared
machine-only api (`requiredCallerKind`) are armed like any other. Single-tenant
projects are unaffected.

## Debugging checklist

- **An MScript reads `undefined`** -> the value's source step runs *after*
  the milestone you referenced it from. `this.instance` is null before
  step 7; an action result is absent before the action's milestone.
- **An action doesn't run** -> it isn't referenced from a
  `workflow.<crudType>` milestone, or its `condition` evaluated falsy.
- **An action of an unknown type** is skipped by the compiler (no step is
  produced for it), so it silently doesn't run; check the action type.
- **The wrong data-layer operation is called** -> check `crudType`; the main
  operation is selected purely by crudType (and by `dataViewName` for get /
  list).
- **A write hits more than expected** -> it can't on update / delete; the
  fetch step resolves the WHERE to a single `this.instance.id` first.

## See also

- [BusinessApi overview](overview.md) - the request lifecycle and the
  six chapters the manager is generated from
- Per-crudType pages: [Create](create-api.md) · [Get](get-api.md) ·
  [List](list-api.md) · [Update](update-api.md) · [Delete](delete-api.md)
- [Actions & workflow - overview](../workflow/overview.md) -
  the `this` context and action semantics
- Schema: [`BusinessApi`](../../spec/BusinessApi.md),
  [`BusinessApiActionStore`](../../spec/BusinessApiActionStore.md),
  [`BusinessWorkflow`](../../spec/BusinessWorkflow.md).
