# SimpleCheck

**Level:** `unclassified` · **Family:** [Standalone patterns](../ontology/families.md#standalone-patterns)

**Ontology:** [SimpleCheck in Part 1](../ontology/SimpleCheck.md)

**Name:** an instance is named by `name`.

Defines a lightweight conditional validation. A SimpleCheck runs a script to evaluate a specific business rule and throws an error if the condition fails. Used to enforce custom rules dynamically within access or execution flows.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | Identifier for the check logic, used for documentation and traceability. It should clearly describe the business rule, e.g., `isDocumentVisible` or `userHasNotRevokedAccess`. |
| `condition` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to a boolean. If the result is false, the check fails and an error is thrown with the specified message and status. |
| `errorMessage` | `String` | yes |  |  |  | The message shown to the user or logged when the check fails. It should clearly communicate the reason for denial. |
| `errorStatus` | `ErrorStatus` | yes |  | 9 values, see [ErrorStatus](#errorstatus) |  | The HTTP status code to be returned when the check fails. This helps convey the nature of the error (e.g., 403 for forbidden access, 404 for missing data, 429 for a rate-limit or quota refusal that clears with time, 503 for a dependency that is down right now). The value set is the ErrorStatus vocabulary; 429 and 503 are retried by callers, so never use them for a permanent refusal. |

## Allowed values

### ErrorStatus

`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`, `503`

## Constraints

Property rules:

- `name`, `condition`, `errorMessage`, `errorStatus` must be present. (`REQUIRED_FIELD_MISSING`)
- `errorStatus` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
