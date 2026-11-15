# BusinessApi

**Level:** `namespace` · **Family:** [BusinessApi](../ontology/families.md#businessapi)

**Ontology:** [BusinessApi in Part 1](../ontology/BusinessApi.md)

**Name:** an instance is named by `basics.apiOptions.name`.

Defines a Business API, a high-level abstraction representing a specific business operation on a primary data object. It encapsulates intent (e.g., get, create, delete), parameters, trigger mechanisms, and a structured workflow composed of modular actions. Each Business API offers more expressive and decoupled control over behavior and access.

## Field applicability by `apiOptions.crudType`

Most option blocks apply to every crudType, but the data-shaping clauses and the `*Options` blocks are restricted. Populating a block on a crudType that ignores it is a design-time mistake: the codegen silently drops the configuration. The validator emits a `BUSINESSAPI_BLOCK_IGNORED` warning when this happens.

| Block               | create | get | list | update | delete |
|---------------------|:------:|:---:|:----:|:------:|:------:|
| `apiOptions`        |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `authOptions`       |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `requestParameters` |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `dataClauseItems`   |   ✓    |  —  |  —   |   ✓    |   —    |
| `redisParameters`   |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `restSettings`      |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `grpcSettings`      |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `kafkaSettings`     |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `sseSettings`       |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `cronSettings`      |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `internalCallSettings` | ✓   |  ✓  |  ✓   |   ✓    |   ✓    |
| `actions`           |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `workflow`          |   ✓    |  ✓  |  ✓   |   ✓    |   ✓    |
| `selectClause`      |  ans.  |  ✓  |  ✓   |  ans.  |  ans.  |
| `whereClause`       |   —    |  ✓  |  ✓   |   ✓    |   ✓    |
| `getOptions`        |   —    |  ✓  |  —   |   —    |   —    |
| `listOptions`       |   —    |  —  |  ✓   |   —    |   —    |
| `paginationOptions` |   —    |  —  |  ✓   |   —    |   —    |
| `deleteOptions`     |   —    |  —  |  —   |   —    |   ✓    |

Reader's guide:
- `selectClause` shapes the read projection on `get` / `list`. On `create` / `update` / `delete` (`ans.`) only `selectProperties` is read, as the boundary of the answer: the written row narrowed to the declared properties + `id`, the write itself never projected; `selectJoins` there is ignored.
- `whereClause` locates the target record(s). It applies to every read or mutation that has to identify what to operate on; `create` is excluded because it makes a new record.
- `dataClauseItems` carries the write payload — each entry maps a property name to a value MScript or literal that the framework writes at create / update time. `sessionSettings` and `staticJoin` properties are auto-injected and don't need entries here. Only `create` and `update` mutate fields; a `delete` writes no payload at all — it either archives the row (`isActive: false`) or removes it, and that choice is made by the data object's `objectSettings.basicSettings.useSoftDelete`, NOT by `deleteOptions`.
- `getOptions` / `listOptions` / `paginationOptions` / `deleteOptions` are the four crudType-specific knobs. Each is meaningful for exactly one crudType. `deleteOptions.useSoftDelete` is the one exception that is inert: no generator reads it, so a per-API soft-vs-hard override does not exist; the validator warns (DELETE_OPTIONS_SOFTDELETE_IGNORED) when it contradicts the data object's flag.

When in doubt, consult the per-field doc on each option block — every block whose applicability is restricted repeats the rule in its own `__doc`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `basics` | [`BusinessApiBasics`](./BusinessApiBasics.md) | yes |  |  |  | Core identity and authentication settings for this Business API. |
| `parameters` | [`BusinessApiParameters`](./BusinessApiParameters.md) | no |  |  |  | Custom and Redis-derived parameters fed into the workflow context. Optional — omit (or null) when unused; never []. |
| `controllers` | [`BusinessApiControllers`](./BusinessApiControllers.md) | no |  |  |  | Transport bindings (REST, gRPC, Kafka, SSE, cron, internal call) that expose this Business API. Optional — omit (or null) when unused; never []. |
| `query` | [`BusinessApiQuery`](./BusinessApiQuery.md) | no |  |  |  | Data-access shape: select / where / data / list / pagination clauses. Optional — omit (or null) when unused; never []. |
| `actions` | [`BusinessApiActionStore`](./BusinessApiActionStore.md) | no |  |  |  | Represents the available logic actions that can be referenced by the Business API's workflow. Actions include data fetches, validation, permission checks, interservice calls, transformations, and output shaping. Author sparsely: include only the action-type arrays you use — omitted arrays normalize to [] server-side. Every action needs a unique name (its handle in workflow refs); ids are auto-assigned — never write them. |
| `workflow` | [`BusinessWorkflow`](./BusinessWorkflow.md) | no |  |  |  | Defines the logical flow of the Business API, composed of sequenced action names grouped by lifecycle stages. Workflow entries reference actions from the api's action store by NAME (unique within the store); legacy action ids are accepted on input and resolve to the same action, but the stored form is the name. This workflow is generated visually in the architecture UI or programmatically inferred from the API's type. Author sparsely: send only the api's own crudType with only its populated phases; omitted sections are equivalent to empty.  ## Ordering — what an action may read  Stages run in the fixed ApiManager pipeline order: `afterStartBusinessApi` (before the login check), `afterReadParameters`, `afterTransposeParameters`, `afterCheckParameters`, `afterCheckBasicAuth`, `afterBuildWhereClause`, `afterFetchInstance`, `afterCheckInstance`, `afterBuildDataClause`, `afterMain<Crud>Operation`, `afterBuildOutput`, then (post-response) `afterSendResponse`, `afterApiEvent`. The key order of the stored JSON is irrelevant — this table is.  WITHIN one stage, actions run in the DECLARATION ORDER of that stage's array. There is no dependency resolution and no topological sort. A workflow write MERGES additively, and `options.replace: true` replaces an array wholesale — it does NOT reorder one; to put a producer ahead of a consumer already listed before it, rewrite the whole array or move the producer to an EARLIER stage.  Two clause slots are evaluated by the framework rather than by an action, and both run BEFORE the stage that shares their name: `query.whereClause` at `buildWhereClause()` (so it may read through `afterCheckBasicAuth`) and `query.dataClauseItems[].value` at `buildDataClause()` (so it may read through `afterCheckInstance`).  An MScript that reads `this.<name>` of a value produced LATER evaluates to `undefined` — it does not throw and it is not a syntax error. In a `shouldBeTrue: false` validation action (`if (result) throw`) that is falsy, so the guard does not fire and the request is answered as though the check had passed. The validator reports it as `ACTION_CONTEXT_READ_BEFORE_PRODUCED` (error for a `validationActions` script or a `dataClauseItems` value, warning elsewhere), naming both the reading action and the producing one.  The SAME rule judges the framework's own MID-pipeline bindings. Most `this.<X>` the framework binds — `this.session`, `this.request`, `this.crudType`, the request-parameter mirrors, the route segments — exists before any action runs and is never an ordering question. Six do not: `this.result` (written by `executeMainOperation()`), its `mainOperation()` aliases `this.data` and `this.dbResult`, and on a CREATE the singular `this.<objectName>` plus `this.createOutcome` (also `executeMainOperation()`) — all available only from `afterMain<Crud>Operation` on — and `this.output`, written by `buildOutput()` and available only from `afterBuildOutput` on. An action scheduled earlier reads `undefined`: a `publishEventActions` message that is an object literal then ships an event whose every key is `undefined` and which serializes as `"data": {}`. A framework step cannot be rescheduled, so the remedy is always to move the READER to the producing stage or later. On a `get`, an `update` or a `delete` the `this.<objectName>` alias is bound by `fetchInstance()` at step 7 instead, which is why only a `create` is judged on it. `this.createOutcome` exists only on a `create`, and it is what separates a real insert from an idempotent replay: `'created'`, `'duplicateStopped'` (an `onDuplicate: 'stopOperation'` unique index matched and NOTHING was written) or `'duplicateUpdated'`. A post-main side effect that must not repeat on a replay is gated with `condition: "this.createOutcome === 'created'"`; read from an earlier stage it is `undefined`, the comparison is false for the GENUINE create too, and the gate suppresses exactly the run it was meant to allow.  The pipeline produces `this.instance` the same way: `fetchInstance()` runs at step 7, so the row is `null` at every stage from `afterStartBusinessApi` through `afterBuildWhereClause` and is loaded only from `afterFetchInstance` on. A check whose expression reads `this.instance.<field>` from an earlier stage therefore compares `undefined` and REFUSES every caller — a 403 with no database read behind it. The validator reports that as `INSTANCE_READ_BEFORE_FETCH` (error on a gate action or the where clause, warning elsewhere); the two fixes are to schedule the check at `afterFetchInstance` or later, or to derive its key from a request-scoped value (`this.<paramName>`, `this.session.<field>`) that is already available at the stage it runs. Only `update`, `delete` and an ownership-gated `get` fetch a row at all; on a `create`, a `list` or a plain `get` there is no `this.instance` at ANY stage.  ## Failure semantics — no rollback  A workflow is NOT a transaction. Actions run sequentially, every write commits on its own, and an action that throws (`onActionError: throwError`, the default) aborts the rest of the pipeline WITHOUT rolling back the main operation or anything an earlier action already wrote. Order a write that may legitimately fail into a pre-main stage — `afterBuildDataClause` for `create`/`update`, `afterCheckInstance` for `update`/`delete` — so it fails before the main row is written. The full contract is on the `BusinessWorkflow` page. |

## Constraints

Property rules:

- `basics` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ABSOLUTE_ROLES_ONLY_ON_PUBLIC_WRITE` | error | API "…" declares absoluteRoles […] and NOTHING ELSE: checkRoles is empty, ownershipCheck is off, and there is no permission, membership, parent-ownership, validation or session-scoped gate. |
| `ABSOLUTE_ROLES_WITHOUT_GATE` | error | API "…" declares absoluteRoles […] but no gate, so it restricts NOTHING - absoluteRoles GRANTS unconditional access (it bypasses role, permission, ownership and membership checks); checkRoles is what restricts. |
| `ADMIN_ROUTE_OPEN` | warning |  |
| `ADMIN_ROUTE_OPEN_JOBSTREAM_HIDDEN` | warning | API "…" mutates data under an /admin route path (…) with no effective role gate, but this route is NEVER MOUNTED: the api is a JobStream target without keepPublicRoute and declares no gRPC/SSE/kafka controller either, so … |
| `API_AUTH_GATE_NOT_GENERATED` | error | BusinessApi "…" declares …, but its service is generated in …, whose code generator does not emit … on …: the check would silently not run and the api would answer every caller its other gates admit. |
| `BODY_PARAM_ON_BODYLESS_METHOD` | error, warning |  |
| `BUSINESSAPI_BLOCK_IGNORED` | warning | BusinessApi "…" has crudType "…" but `query.…` is populated. |
| `CONDITION_LITERAL_FALSE` | warning | Condition on … is the literal `false` — the guarded element can never run, yet it still ships in the generated code. |
| `CRON_NO_EFFECT` | warning | BusinessApi "…" runs on a cron schedule with crudType "…", but it has no actions and an empty whereClause — each cron tick has nothing to scope the … and no action to run, so the job has no effect. |
| `CRON_ON_PARAM_ROUTE` | warning | BusinessApi "…" has a cron controller but its effective route … contains path parameter(s) :…. |
| `CURSOR_MODE_IGNORES_SORT` | warning | BusinessApi "…" declares paginationOptions.cursorMode, so its rows are ordered by the fixed keyset `createdAt ASC, id ASC` and `listSortBy` is IGNORED. |
| `CURSOR_MODE_IGNORES_TOPPICK` | warning | BusinessApi "…" declares paginationOptions.cursorMode, so `topPick` is IGNORED. |
| `DATA_CLAUSE_ITEM_NOT_EMITTED` | error | … API "…" declares a `dataClauseItems` entry for "…", but the generated `buildDataClause` DROPS it: …. |
| `DATA_CLAUSE_ITEM_SHADOWED_BY_STATIC_JOIN` | warning | BusinessApi "…" (crudType create) authors a `dataClauseItems` entry for "…", and that property of data object "…" also declares a `staticJoin` (from "…".…). |
| `DATAVIEW_GET_WITHOUT_ID_ADDRESS` | warning | BusinessApi "…" is a DataView-sourced get (apiOptions.dataViewName "…") whose effective route … binds no id: it carries neither a ":…" nor an ":id" segment. |
| `DATAVIEW_JOIN_NAME_SHADOWED` | warning | api "…" declares a select-join "…" and its DataView "…" attaches an aggregate/stat of the same name. |
| `DATAVIEW_MISSING_DATA_OBJECT` | error | dataObjectName is required when dataViewName ("…") is set. |
| `DATAVIEW_READ_TIME` | warning | DataView "…" is DYNAMIC (`viewBasics.isStored` is not true), so api "…" binds it at READ TIME: the … reads "…" from the DATABASE with its own selectBy / fullWhereClause / additionalClauses exactly as authored (fresh on … |
| `DATAVIEW_READ_TIME_UNBOUNDED` | warning | api "…" is a read-time list over the dynamic DataView "…" and declares `paginationOptions.unpaged: true`. |
| `DATAVIEW_SELECT_PROPERTIES_INERT` | warning | BusinessApi "…" declares selectProperties (…) on a DataView-sourced … (apiOptions.dataViewName "…"), where the declaration has no effect. |
| `DATAVIEW_UNKNOWN_NAME` | error | DataView "…" is not declared in bffService.dataViews. |
| `DEBRIS_API` | warning | API name "…" contains the scaffolding word "…" — it looks like debris left over from development, but it ships as a real endpoint. |
| `DELETE_OPTIONS_SOFTDELETE_IGNORED` | warning | deleteOptions.useSoftDelete: false… has no effect — the per-api soft-delete override is not implemented, and data object "…" soft-deletes (`useSoftDelete` is true, the default), so this api still ARCHIVES the row … |
| `DELETE_OPTIONS_SOFTDELETE_UNAVAILABLE` | warning | deleteOptions.useSoftDelete: true… has no effect — the per-api soft-delete override is not implemented, and data object "…" is declared `useSoftDelete: false`, so it carries no `isActive` column to archive into and this … |
| `EXPOSE_SECRETS_NOT_IN_VIEW` | warning | api "…" opens … through exposeSecrets, but it answers the DataView "…" row, and the view does not project … (viewBasics.properties). |
| `FILTER_PARAM_ACK_STALE` | warning | acknowledgedShadowedFilterParams entry "…" on API "…" matches no shadowed filter parameter: ":…" is …. |
| `FILTER_PARAM_SHADOWED_BY_ROUTE` | warning | Property "…" on data object "…" is marked isFilterParameter:true but also appears as ":…" in routePath … of this LIST api. |
| `HOLLOW_EFFECT` | warning | API "…" runs … with read crudType "…", but the result context… … feed… no write, publish or response sink — the computation runs every trigger and its result is discarded. |
| `IDLESS_SELECTBY_UNBINDABLE` | error | BusinessApi "…" has crudType "…" with an authored query.whereClause.selectBy (…), but nothing on the request can ever bind it: the effective route … carries no ":" path parameter that composes into the row address, and … |
| `IDLESS_SELECTBY_VESTIGIAL` | warning | BusinessApi "…" has crudType "…" with an authored query.whereClause.selectBy (…) that nothing on the request can bind: the effective route … carries no composing ":" path parameter and no declared requestParameter or … |
| `INCLUDE_SOFT_DELETED_ON_CREATE` | warning | includeSoftDeleted… is set on a create api — a create builds no main-object where clause, so its main-object filter is unchanged. |
| `INCLUDE_SOFT_DELETED_ON_DELETE` | error | includeSoftDeleted… is set on a delete api. |
| `INCLUDE_SOFT_DELETED_WITHOUT_SOFT_DELETE` | warning | includeSoftDeleted… is set, but data object "…" has `useSoftDelete: false` — it has no `isActive` column, so its main-object archived-row filter is unchanged. |
| `JOBSTREAM_HIDDEN_TARGET_PARAM_UNBINDABLE` | warning | Request parameter "…" declares httpLocation="…" on a JobStream-hidden target: this api's REST route is suppressed (it is a jobStreams[].targetApi without keepPublicRoute), so the only caller left is the stream's worker, … |
| `LIST_SELECTBY_UNBINDABLE` | error | BusinessApi "…" list selectBy term "…" has no binding source, so every call is refused with 400. |
| `MISSING_DATA_CLAUSE_ITEM` | error | BusinessApi "…" (crudType create) targets data object "…" whose property "…" is required but has no value source — and "…" is a credential column (`basicSettings.…`, a secret-property-registry member). |
| `OWNER_CLAUSE_SHADOWED_BY_SESSION` | error | BusinessApi "…" (crudType create) authors a `dataClauseItems` entry for "…", but that property is the owner field of data object "…" (`sessionSettings.isOwnerField`). |
| `OWNER_PROVENANCE_PAYLOAD_WITH_REST_CREATE` | error | BusinessApi "…" is a caller-facing (…) create on data object "…", whose owner property "…" declares `sessionSettings.ownerProvenance: "payload"`. |
| `OWNER_PROVENANCE_PAYLOAD_WITH_SESSION_PARAM` | error | BusinessApi "…" (crudType create) targets data object "…", whose owner property "…" declares BOTH `sessionSettings.ownerProvenance: "payload"` and `sessionSettings.sessionParam: "…"`. |
| `OWNER_PROVENANCE_SESSION_OR_INTERNAL_LANGUAGE` | error | BusinessApi "…" (crudType create) targets data object "…", whose owner property "…" declares `sessionSettings.ownerProvenance: "sessionOrInternalPayload"`, but the service generates as …. |
| `OWNERSHIP_CHECK_NOT_APPLICABLE` | warning | BusinessApi "…" declares authOptions.ownershipCheck=true on a "…" API, which cannot make an ownership check logically — there is no target row yet, and the caller becomes the owner of the row being created. |
| `OWNERSHIP_CHECK_WITHOUT_OWNER_FIELD` | error | BusinessApi "…" has authOptions.ownershipCheck=true but data object "…" has no session-bound owner property (no property with sessionSettings.isOwnerField=true). |
| `OWNERSHIP_WRITE_RESPONSE_UNBOUNDED` | warning | BusinessApi "…" declares ownershipCheck on a … but no resolved selectProperties response list, so its answer contains the full stored row, including internal bookkeeping columns. |
| `PARAM_NOT_STORED` | warning | Request parameter "…" on API "…" (crudType …) matches stored property "…" on "…", but no dataClauseItems entry writes that property — a caller that sends "…" gets a success response while the value is silently dropped. |
| `PARAM_UNUSED` | warning | Request parameter "…" on kafka-consumer API "…" binds a producer envelope key that the consumer does not read — nothing references `this.…` in a whereClause, dataClause or action MScript. |
| `PARENT_OWNERSHIP_CHECK_INCOMPLETE` | error | BusinessApi "…" declares a parentOwnershipChecks entry missing a required field. |
| `PARENT_OWNERSHIP_OBJECT_NOT_FOUND` | error | BusinessApi "…" declares a parentOwnershipChecks entry whose parentObject "…" is not a data object in this service. |
| `PARENT_OWNERSHIP_OWNER_FIELD_NOT_FOUND` | error | BusinessApi "…" declares a parentOwnershipChecks entry whose ownerField "…" does not exist on parent object "…". |
| `PARENT_OWNERSHIP_UNSUPPORTED_LANGUAGE` | error | BusinessApi "…" declares authOptions.parentOwnershipChecks, but its service is generated in …, and the … code generator does not emit the parent-ownership gate…: the generated api would never fetch the parent row or … |
| `PAYMENT_START_NO_CALLER_PARAMS` | warning | PaymentAction "…" runs at stage "start" on BusinessApi "…", which builds the provider intent from this api's bound request parameters: the emitted action spreads `this.params` into the intent input and PaymentManager … |
| `PUBLIC_API_WITH_M2M_ONLY_INTENT` | warning | BusinessApi "…" declares authOptions.M2MAllowed:true together with loginRequired:false. |
| `PUBLIC_API_WITH_ROLE_GATE` | error | BusinessApi "…" declares authOptions.loginRequired:false together with … — and loginRequired:false DISABLES …. |
| `REQUEST_PARAM_URLPATH_NOT_IN_ROUTE` | error | Request parameter "…" has httpLocation="urlpath" but ":…" is not a segment of the route path …. |
| `REQUIRED_PARAM_NOT_STORED` | warning | Required request parameter "…" matches stored property "…" on "…", but no dataClauseItems entry writes that property — the caller-supplied value is never stored. |
| `ROUTE_PARAM_FIELD_UNBOUND` | error | Undeclared route parameter ":…" on API "…" names property "…" of data object "…", but nothing binds it: no whereClause, selectBy, dataClause or action MScript reads `this.…`. |
| `SELECT_JOIN_NAME_SHADOWS_COLUMN` | warning | selectJoin "…" is named like a column of data object "…". |
| `SERVICE_MANAGER_NAME_COLLISION` | error | BusinessApi name "…" collides with the generated service-level manager class "…": service "…" emits that class as the base of every api manager, and this api's own manager is generated under the same name ("…"), so the … |
| `SINGLE_ACCESS_ROUTE_MISSING_ID` | error | BusinessApi "…" has crudType "…" but its auto-calculated route … has no path parameter, because …. |
| `UPDATE_ACTION_WITHOUT_WRITE` | error | Update API "…" on "…" declares no dataClauseItems and no request parameter that names a stored property of "…", so its data clause is empty on every call — a parameter naming no column has nowhere to land, and only … |
| `UPDATE_DELETE_WITHOUT_ROW_SELECTOR` | error | BusinessApi "…" has crudType "…" but nothing identifies the row it acts on: its explicit route … has no ":" path parameter, and query.whereClause declares no selectBy, fullWhereClause or additionalClauses. |
| `UPDATE_WRITES_NOTHING` | error | Update API "…" declares payload parameter(s) … that name stored properties on "…", but its dataClauseItems write set is EMPTY — nothing is ever written. |

## Example

Use a BusinessApi to expose a business operation on a primary data object — declaring its crudType, auth, the full request shape via requestParameters, the write payload via dataClauseItems (create/update only), transport bindings, and an optional action workflow. This example is a create API that registers a project, taking the name/slug from the caller and auto-injecting the owner from the session.

```json
{
  "basics": {
    "apiOptions": {
      "dataObjectName": "project",
      "crudType": "create",
      "name": "createProject",
      "apiDescription": "Create a new project owned by the current user within their tenant.",
      "isDefaultApi": true
    },
    "authOptions": {
      "loginRequired": true,
      "checkRoles": [
        "projectManager",
        "admin"
      ]
    }
  },
  "parameters": {
    "requestParameters": [
      {
        "name": "name",
        "type": "String",
        "required": true,
        "httpLocation": "body",
        "description": "Human-readable project name."
      },
      {
        "name": "slug",
        "type": "String",
        "required": true,
        "httpLocation": "body",
        "description": "URL-safe unique slug for the project."
      }
    ]
  },
  "query": {
    "dataClauseItems": [
      {
        "name": "name",
        "value": { "js": "this.name" }
      },
      {
        "name": "slug",
        "value": { "js": "this.slug" }
      },
      {
        "name": "status",
        "value": { "js": "'draft'" }
      },
      {
        "name": "ownerId",
        "value": { "js": "this.session.userId" }
      }
    ]
  },
  "controllers": {
    "restSettings": {
      "hasRestController": true,
      "routePath": "$default"
    }
  }
}
```
