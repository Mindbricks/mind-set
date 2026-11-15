# EnterpriseObject

**Level:** `section` · **Family:** [EnterpriseModel](./families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Specification:** [EnterpriseObject in Part 2](../spec/EnterpriseObject.md)

A reference to a business object in the platform's metadata (section) — e.g. SAP A_BusinessPartner, Salesforce Account, HubSpot contacts. It can be read/searched through the mcpbff bridge, used as an action's param/result shape, or projected onto a DataObject (objectSettings.enterpriseProjection, later slice) with a field map. Defining an EnterpriseObject does NOT require a DataObject — projection is a separate, optional step.

## Contained in

- [EnterpriseModel](./EnterpriseModel.md) as `enterpriseObjects` (a list)

Blueprint paths:

- `enterpriseHub.enterpriseModels.enterpriseObjects`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
