# BuiltInApiCheck

**Level:** `chapter` · **Family:** [BuiltInApiCheck](../ontology/families.md#builtinapicheck) (domain `ProjectAuthentication`)

**Ontology:** [BuiltInApiCheck in Part 1](../ontology/BuiltInApiCheck.md)

One validation check attached to a built-in auth API at one step of its workflow (see `authentication.builtInApiChecks`). The check runs after the built-in actions of that step and refuses the call with its own `errorStatus` and `errorMessage` when it fails.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `apiName` | `String` | yes |  |  |  | The name of the built-in auth API the check attaches to, exactly as the auth service generates it (`createUser`, `updateUser`, `updateUserRole`, ...). Only generated auth APIs are accepted; a custom `businessLogic` API declares its validations in its own workflow. |
| `workflowStep` | `String` | yes |  |  |  | The workflow step of that built-in API where the check runs, an `after<Step>` name of the API's crud type: the step names of `CreateBusinessWorkflow` for a create API (e.g. `afterCheckParameters`, `afterCheckBasicAuth`, `afterBuildDataClause`), of `UpdateBusinessWorkflow` for an update API (e.g. `afterFetchInstance`, `afterCheckInstance`), and so on. The check is appended after the built-in actions of that step; a check that reads the stored record of an update API belongs at `afterFetchInstance` or later. |
| `validation` | [`ValidationAction`](./ValidationAction.md) | yes |  |  |  | The `ValidationAction` to run. Its `validationScript` is evaluated in the built-in API's context, the same scope a validation of a custom API has (the API's parameters, e.g. `this.roleId` and `this.clinicId` on `createUser`, and the session); `errorStatus` and `errorMessage` answer the refusal. Its `name` must not collide with an action the built-in API already declares. |

## Constraints

Property rules:

- `apiName`, `workflowStep`, `validation` must be present. (`REQUIRED_FIELD_MISSING`)
