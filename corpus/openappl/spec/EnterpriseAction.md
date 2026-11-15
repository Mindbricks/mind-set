# EnterpriseAction

**Level:** `section` · **Family:** [EnterpriseModel](../ontology/families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Ontology:** [EnterpriseAction in Part 1](../ontology/EnterpriseAction.md)

**Name:** an instance is named by `name`.

An invokable platform-side business function (section) — a SAP BAPI / OData function import / action, a Salesforce Apex REST or invocable action, a Dataverse bound/unbound action, etc. A BusinessApi's ExternalBusinessAction (later slice) invokes it through the mcpbff bridge, mapping request params in and the platform result out.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique action identifier within this model. The name a BusinessApi's ExternalBusinessAction references. Must be a valid codeName. |
| `functionName` | `String` | yes |  |  |  | The platform-side function identifier — the BAPI / OData function-import / bound-action / Apex-method name to invoke (e.g. 'BAPI_SALESORDER_CREATEFROMDAT2', 'A_SalesOrder/com.sap.gateway...'). The authoring agent picks this from the design-time metadata. |

## Constraints

Property rules:

- `name`, `functionName` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
