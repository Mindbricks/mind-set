# ArrowFunctionAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ArrowFunctionAction in Part 1](../ontology/ArrowFunctionAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

This action defines a reusable function and sets it to the context with the contextPropertyName name. Java supports a non-empty authored body only when it has at least one named parameter and exactly one return of a supported literal, parameter, or string concatenation; for example, parameterNames: ["tier"] with functionBody: "{ return 'Tier ' + tier; }". Callbacks, object/array literals, accumulators, and general JavaScript statements refuse generation with JAVA_ARROW_FUNCTION_BODY_UNPORTABLE and the actions.arrowFunctionActions[<name>].functionBody slot. An empty body remains a noop. The Intl currency formatter use-case is for Node.js; Java designers should use the supported formatter subset.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `parameterNames` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | An array of strings to represent the names of the function parameters |
| `functionBody` | `Text` | yes |  |  |  | The JavaScript function body, enclosed in a block ({}). For Java, use a parameterized single-return formatter such as { return 'Tier ' + tier; }; unsupported authored bodies are refused with their functionBody slot named. An empty block remains a noop. |

## Constraints

Property rules:

- `functionBody` must be present. (`REQUIRED_FIELD_MISSING`)
- `parameterNames` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

## Example

Use to define a small reusable inline function and store it on the context, so later actions (especially mapping or filtering steps) can call it — e.g. a formatter applied across several lists.

```json
{
  "name": "defineCurrencyFormatter",
  "description": "Build a reusable currency formatter bound to the request locale.",
  "parameterNames": [
    "amount",
    "currency"
  ],
  "functionBody": "{ return new Intl.NumberFormat(this.session.locale || 'en-US', { style: 'currency', currency: currency || 'USD' }).format(amount); }",
  "contextPropertyName": "formatCurrency"
}
```
