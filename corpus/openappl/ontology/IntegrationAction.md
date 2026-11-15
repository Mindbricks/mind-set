# IntegrationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [IntegrationAction in Part 2](../spec/IntegrationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Calls a third-party API integration from the platform integration catalog (e.g., AWS S3, Stripe, Google Maps). The provider is identified by its string key matching an integration picked for the project. Each integration exposes a set of predefined actions, and this object triggers one of them with dynamically computed parameters. The result is stored in the context and can be used in follow-up steps.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `callIntegration` | `const { callIntegration } = require("common")` | Call an integration method from your code, through the same project MCP-BFF bridge an `IntegrationAction` uses: `await callIntegration(provider, action, params)`. | nodejs |
| `IntegrationBridgeError` | `const { IntegrationBridgeError } = require("common")` | The error class for recognized integration bridge error envelopes; other transport errors can propagate unchanged. | nodejs |

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `integrationActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.integrationActions`
- `services.businessLogic.actions.integrationActions`

## Contains

- `parameters`: [IntegrationParameter](./IntegrationParameter.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
