# CreateObjectAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CreateObjectAction in Part 1](../ontology/CreateObjectAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Constructs an in-memory JavaScript object from key-value pairs and writes it to the context. This action does not persist data to the database. It is typically used to prepare structured data for use in other actions such as sending emails, rendering templates, API calls, or forming response objects.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `payload` | [`ObjectData`](./ObjectData.md)[] | no |  |  |  | An array of key-value pairs (as `ObjectData`) representing the base fields of the constructed object. Values are evaluated using MScript. |
| `mergeObject` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An optional MScript expression that returns an object. Its keys and values will be shallow-merged into the base object after `payload` is evaluated. This allows for dynamic or computed properties. |

## Constraints

Property rules:

- The items of `payload` must have distinct names (`key`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CREATE_OBJECT_PAYLOAD_REQUIRED` | error | CreateObjectAction.payload must have at least one key/value entry. |

## Example

Use to assemble an in-memory object (not persisted) for use by later actions — an email model, a template payload, or an API request body — optionally merging in a computed object.

```json
{
  "name": "buildWelcomeEmailModel",
  "description": "Compose the data model passed to the welcome-email template.",
  "payload": [
    {
      "key": "firstName",
      "value": { "js": "this.user.fullName.split(' ')[0]" }
    },
    {
      "key": "activationUrl",
      "value": { "js": "`https://app.example.com/activate/${this.activationToken}`" }
    },
    {
      "key": "year",
      "value": { "js": "new Date().getFullYear()" }
    }
  ],
  "mergeObject": { "js": "{ plan: this.organization.plan.name }" },
  "contextPropertyName": "welcomeModel"
}
```
