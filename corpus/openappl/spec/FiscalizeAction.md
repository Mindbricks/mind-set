# FiscalizeAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [FiscalizeAction in Part 1](../ontology/FiscalizeAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Drives the regulatory fiscalization lifecycle for a fiscalization-enabled DataObject through the generated per-object FiscalizationManager. `operation` picks the step: submit (serialize the finalized invoice snapshot and submit it through the jurisdiction policy pipeline), cancel (the network's cancellation flow for an accepted document), or queryStatus (a one-shot provider poll dispatched through the same event path the status cron uses). The InvoiceAction family's fiscal twin (ADR-invoice-fiscalization sec. 7.5) and the imperative escape hatch for `submitPolicy: manual` designs - the declarative submitPolicy trigger (onInvoiceFinalized) runs without any action. The effective provider binding is the owning DataObject's FiscalizationConfig (fiscalProviderName -> the project's single declared fiscal provider); there is NO framework-internal fiscal provider. resubmit retries a rejected or failed fiscal document through the existing correction pipeline using fiscalDocumentIdProperty; the operator route remains available.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `operation` | `FiscalOperation` | no | `"submit"` | `submit`, `cancel`, `queryStatus`, `resubmit` |  | The fiscal operation to perform: submit \| cancel \| queryStatus \| resubmit. |
| `providerName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Lookup key into projectSettings.fiscalProvidersSettings.fiscalProviders[].name - a design-time capability check. When null/omitted (the normal shape), the binding is the owning DataObject's fiscalization.configuration.fiscalProviderName (or the project's single declared fiscal provider). At RUNTIME the object's FiscalizationManager always executes against the object-level binding; declaring a DIFFERENT provider here than the object resolves is a design error the validator reports. |
| `sourceIdProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | operation=submit: property holding the SOURCE row id whose finalized invoice is fiscalized. When omitted, the api's own persisted row id is used. |
| `fiscalDocumentIdProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Required for cancel / queryStatus / resubmit: property holding the fiscal document id (the sys_<X>FiscalDocument row id) to operate on. |
| `reasonProperty` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | operation=cancel: optional property holding the cancellation reason. |

## Constraints

Property rules:

- `operation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `sourceIdProperty`, `fiscalDocumentIdProperty`, `reasonProperty` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `FISCAL_ACTION_MISSING_DOCUMENT_ID` | error | FiscalizeAction with operation="…" requires fiscalDocumentIdProperty - without it the emitted action cannot address the fiscal document to operate on. |
| `FISCAL_ACTION_PROVIDER_MISMATCH` | error | FiscalizeAction declares providerName "…", but its target object "…" resolves the fiscalization binding "…" - the emitted action executes through the object's FiscalizationManager, whose provider is baked from the OBJECT … |
| `FISCALIZATION_NOT_CONFIGURED` | error | Fiscalization is not activated for FiscalizeAction's target. |
| `UNKNOWN_FISCAL_PROVIDER` | error | Fiscal provider "…" is not declared in projectSettings.fiscalProvidersSettings.fiscalProviders[]. |

## Example

Use inside a manual fiscalization workflow - submit the fiscal document for an order's finalized invoice on an operator's approval, cancel an accepted document inside the legal window, or poll the authority verdict on demand.

```json
{
  "name": "submitOrderFiscalDocument",
  "description": "Submit the e-document for this order's finalized invoice.",
  "operation": "submit",
  "sourceIdProperty": "orderId",
  "contextPropertyName": "fiscalResult"
}
```
