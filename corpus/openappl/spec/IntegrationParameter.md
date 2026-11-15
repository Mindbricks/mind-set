# IntegrationParameter

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [IntegrationParameter in Part 1](../ontology/IntegrationParameter.md)

**Name:** an instance is named by `parameterName`.

Defines a single named input to be passed to a native integration provider action. Parameter values are evaluated using MScript and can be derived from session, context, or external input.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `parameterName` | `String` | yes |  |  |  | The name of the parameter as expected by the integration action (e.g., `bucketName`, `filePath`, `email`). |
| `parameterValue` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that resolves to the parameter value. This can reference current context, session variables, request parameters, or computed logic. |

## Constraints

Property rules:

- `parameterName`, `parameterValue` must be present. (`REQUIRED_FIELD_MISSING`)
