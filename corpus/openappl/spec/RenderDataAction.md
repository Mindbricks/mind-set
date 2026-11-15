# RenderDataAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [RenderDataAction in Part 1](../ontology/RenderDataAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Renders a literal string with flat ${key} substitutions from inputData on nodejs. The inputData expression is evaluated as MScript; the template itself is literal text. Placeholders use word-character top-level keys. Missing or undefined values become empty text; present values use String(), including null as 'null'. There is no file lookup, EJS, Mustache, expression evaluation, nested-key lookup or HTML escaping. The rendered result is saved into context with contextPropertyName and can be reused by later actions.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `inputData` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression producing the value map used for flat ${key} substitutions in the literal template. |
| `template` | `String` | yes |  |  |  | Literal text containing ${key} placeholders; keys use word characters and read top-level inputData properties. Missing/undefined values become empty text; present values use String() (null becomes 'null'). No file lookup, EJS/Mustache, expressions, nested keys or HTML escaping is performed. |

## Constraints

Property rules:

- `inputData`, `template` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `RENDER_TEMPLATE_IS_LIBRARY_NAME` | warning | RenderDataAction.template "…" equals the name of the library template "…", but RenderDataAction does not resolve library templates or evaluate EJS: the action returns the literal text "…". |
| `RENDER_TEMPLATE_REQUIRED` | error | RenderDataAction.template must be a non-empty string: the literal template text with ${key} placeholders (not a file path or a library template name). |

## Example

Substitute a top-level name into literal text from the evaluated user profile.

```json
{
  "name": "renderGreeting",
  "description": "Render literal text with the top-level name.",
  "template": "Hello ${name}",
  "inputData": { "js": "this.userProfile" },
  "contextPropertyName": "greeting"
}
```
