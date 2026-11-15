# IntegrationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [IntegrationAction in Part 1](../ontology/IntegrationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Calls a third-party API integration from the platform integration catalog (e.g., AWS S3, Stripe, Google Maps). The provider is identified by its string key matching an integration picked for the project. Each integration exposes a set of predefined actions, and this object triggers one of them with dynamically computed parameters. The result is stored in the context and can be used in follow-up steps.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `callIntegration` | `const { callIntegration } = require("common")` | Call an integration method from your code, through the same project MCP-BFF bridge an `IntegrationAction` uses: `await callIntegration(provider, action, params)`. | nodejs |
| `IntegrationBridgeError` | `const { IntegrationBridgeError } = require("common")` | The error class for recognized integration bridge error envelopes; other transport errors can propagate unchanged. | nodejs |

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | The provider key identifying the integration to call (e.g., `amazonS3`, `Stripe`, `googleMaps`). Must match the providerKey of an integration that has been picked for the current project. |
| `action` | `String` | yes |  |  |  | The specific action or method to invoke on the integration provider. For example: `uploadFile`, `createRecord`, `deleteObject`, `listItems`. Action names must match the methods exposed by the integration class code. |
| `parameters` | [`IntegrationParameter`](./IntegrationParameter.md)[] | no |  |  |  | An array of parameter objects that define the inputs to pass to the integration action. Each parameter includes a name and a dynamically evaluated value from context. |

## Constraints

Property rules:

- `provider`, `action` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `parameters` must have distinct names (`parameterName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `INTEGRATION_METHOD_NOT_FOUND` | error | Method "…" does not exist on integration "…". |
| `INTEGRATION_MISSING_REQUIRED_PARAM` | warning | Required parameter "…" for "…" on "…" is not provided. |
| `INTEGRATION_PROVIDER_NOT_IN_PROJECT` | error |  |
| `INTEGRATION_REF_AMBIGUOUS` | error | IntegrationAction provider "…" matches … integrations of that provider (…) and names none of them. |

## Example

Use to invoke a catalog integration (e.g. amazonS3, googleMaps) by its provider key and action method, passing dynamically-computed named parameters; the result lands on context.

```json
{
  "name": "uploadReceiptToS3",
  "description": "Upload the generated receipt PDF to the receipts bucket.",
  "provider": "amazonS3",
  "action": "uploadFile",
  "parameters": [
    {
      "parameterName": "bucketName",
      "parameterValue": { "js": "'example-receipts'" }
    },
    {
      "parameterName": "filePath",
      "parameterValue": { "js": "`receipts/${this.order.id}.pdf`" }
    },
    {
      "parameterName": "content",
      "parameterValue": { "js": "this.invoicePdf.content" }
    },
    {
      "parameterName": "contentType",
      "parameterValue": { "js": "'application/pdf'" }
    }
  ],
  "contextPropertyName": "uploadResult"
}
```
