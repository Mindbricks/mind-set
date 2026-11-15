# ValidationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ValidationAction in Part 1](../ontology/ValidationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines a flexible business rule that performs a dynamic condition check during Business API execution. Unlike permission or membership checks, a ValidationAction is fully script-based and domain-specific, allowing complex logical conditions such as subscription status, object states, quota limits, feature flags, or compliance rules. If the validation fails, the system either throws an error (liveCheck) or stores the result in context for later decision-making (storedCheck).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `description` | `Text` | yes |  |  |  | A short, human-readable description explaining the intent of the validation—such as 'User must be active subscriber', 'Quota must not be exceeded', or 'Document must be in draft state'. |
| `shouldBeTrue` | `Boolean` | no | `true` |  |  | Indicates the expected outcome of the validation logic. If `true`, the validation passes when the condition evaluates to `true`. Set to `false` when the validation should pass on a `false` condition (e.g., `!isUserBanned`). |
| `checkType` | `ApiCheckType` | no | `"liveCheck"` | `storedCheck`, `liveCheck` |  | Specifies how the result of the validation is handled. If `liveCheck`, the API throws an error immediately when the validation fails. If `storedCheck`, the result is saved to context and execution continues—allowing deferred or compound logic. |
| `validationScript` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that returns a boolean value based on current API context. This defines the actual validation condition. If the result does not match `shouldBeTrue`, the validation fails. |
| `errorMessage` | `String` | no |  |  |  | Message returned to the client if the validation fails and `checkType` is `liveCheck`. This should be clear and relevant to the context, e.g., 'Your plan does not allow creating more projects.' |
| `errorStatus` | `ErrorStatus` | no | `"400"` | 9 values, see [ErrorStatus](#errorstatus) |  | The HTTP status code to return when the validation fails and `checkType` is set to `liveCheck`. Choose by semantic: `400` for malformed/invalid input, `401`/`403` for authorization failures (the generated service bypasses these for users with absolute roles like `superAdmin`), `404` for missing resources, `409` for uniqueness/duplicate conflicts (a team is already registered, a stage window already exists, an active application is already submitted — prefer 409 over 403 when the issue is conflict, not auth), `422` for semantic / business-rule violations on otherwise valid input (eligibility not confirmed, prerequisite not met), `429` for a rate-limit or quota refusal that clears with time (errorCode TOO_MANY_REQUESTS), `500` for internal errors, `503` when a dependency the api needs is down right now (errorCode SERVICE_UNAVAILABLE, the authored message is kept). Callers retry 429 and 503, so never use either for a permanent refusal. There is no `402`: a payment-required refusal is `422`. Default `400`. |

## Allowed values

### ErrorStatus

`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, `503`

## Constraints

Property rules:

- `description`, `validationScript` must be present. (`REQUIRED_FIELD_MISSING`)
- `checkType`, `errorStatus` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

## Example

Use for a script-based domain rule — quota limits, object state, subscription status, eligibility — that throws (liveCheck) or records its result (storedCheck) with a semantically chosen error status.

```json
{
  "name": "checkProjectQuota",
  "description": "Block creation when the organization is at its plan's project limit.",
  "validationScript": { "js": "this.organization.projectCount < this.organization.plan.maxProjects" },
  "shouldBeTrue": true,
  "checkType": "liveCheck",
  "errorMessage": "Your plan does not allow creating more projects. Upgrade to add more.",
  "errorStatus": "422"
}
```
