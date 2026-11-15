# EnterpriseAction

**Level:** `section` · **Family:** [EnterpriseModel](./families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Specification:** [EnterpriseAction in Part 2](../spec/EnterpriseAction.md)

An invokable platform-side business function (section) — a SAP BAPI / OData function import / action, a Salesforce Apex REST or invocable action, a Dataverse bound/unbound action, etc. A BusinessApi's ExternalBusinessAction (later slice) invokes it through the mcpbff bridge, mapping request params in and the platform result out.

## Contained in

- [EnterpriseModel](./EnterpriseModel.md) as `enterpriseActions` (a list)

Blueprint paths:

- `enterpriseHub.enterpriseModels.enterpriseActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
