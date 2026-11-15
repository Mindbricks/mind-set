# BusinessApiAction

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [BusinessApiAction in Part 1](../ontology/BusinessApiAction.md)

**Name:** an instance is named by `name`.

Abstract base class for all Business API actions. Every action in a Business API workflow inherits from this type. It defines shared fields such as name, execution condition, and response behavior. This class is never instantiated directly—subclasses implement specific logic units like fetch, validation, or API calls. Any subclass is distinguished from the array (in actions property of the business api) it is inserted

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | `String` | no |  |  |  | The unique identifier of the action, used to reference this action from within a Business API workflow step. |
| `name` | `String` | yes |  |  |  | A unique human readable camle case name for the action , will also be used as the method name of the api context class. |
| `description` | `Text` | no |  |  |  | An optional text to describe the purpose and logic of the action, what it does and why it does. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript boolean expression. If provided, the action will only run when this condition evaluates to true. |
| `contextPropertyName` | `String` | no |  |  |  | The name of the property under which the result of the action will be written to the context. The result of an business api action can be accessed by other actions using `this.<contextPropertyName>`. Leave this field null if your action result will not be used by further actions. The value exists only AFTER this action runs: an MScript scheduled earlier — in an earlier stage, or earlier in the same stage's array — reads `undefined`, which in a `shouldBeTrue: false` validation action passes the guard vacuously. See the `workflow` ordering rules. |
| `writeToResponse` | `Boolean` | no | `false` |  |  | If true, the result of the action will be written to the API response directly, typically under the property matching the contextPropertyName. |
| `onActionError` | `BusinessApiActionErrorOption` | no | `"throwError"` | `throwError`, `completeApi` |  | Defines what happens when the action throws an error. `throwError` (default) re-throws, aborts the remaining pipeline and answers the caller with the error — but it rolls NOTHING back: every write this api already performed (the main CRUD operation, earlier crud actions, `interserviceCallAction` writes on other services, published events, sent mails) stays committed, so the request ends half-applied. See the failure-semantics section of `BusinessWorkflow`, and prefer ordering a failure-prone write into a pre-main stage. `completeApi` catches the error, stores it as `this.<actionName>Error` on the context so subsequent actions can inspect the failure, and lets the API continue. An `updateCrudAction` / `deleteCrudAction` whose selector matched NO row does not throw at all unless it also sets `onNoRows: throwError`, so `completeApi` alone cannot observe an empty match. Do not combine `completeApi` with a guard that is meant to abort the flow (a `validationActions`, `permissionCheckActions`, `objectPermissionActions` or `membershipCheckActions` entry whose effective `checkType` throws): the failure is only logged and the api continues into the branch the guard exists to prevent, and validation reports `GUARD_ACTION_NEUTRALIZED_BY_COMPLETE_API`. What an UNSET `checkType` means depends on the target language: the nodejs, java, dotnet, python, rust and golang emitters read it as `storedCheck` (no throw) for the permission/membership families; ValidationAction keeps its `liveCheck` (throwing) default, and the warning names the lane it judged; a saved project is judged on the lane its services are actually built for, and only a language-blind run (an offline or file-loaded validation) is fail-safe, warning as if the lane were one of the throwing ones. Use an explicit `checkType: "storedCheck"` for a check that is genuinely advisory. |
| `emitProgressInSSEContext` | `Boolean` | no | `false` |  |  | When true and the API is running in SSE context, this action automatically emits a progress event before and after execution. When false (default) or when called via REST, no progress is emitted. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `onActionError` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ACTION_ID_CONFLICT` | error | BusinessApiAction carries both "id" and "actionId" with different values. |
