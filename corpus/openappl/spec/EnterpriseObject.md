# EnterpriseObject

**Level:** `section` · **Family:** [EnterpriseModel](../ontology/families.md#enterprisemodel) (domain `EnterpriseHubConfig`)

**Ontology:** [EnterpriseObject in Part 1](../ontology/EnterpriseObject.md)

**Name:** an instance is named by `name`.

A reference to a business object in the platform's metadata (section) — e.g. SAP A_BusinessPartner, Salesforce Account, HubSpot contacts. It can be read/searched through the mcpbff bridge, used as an action's param/result shape, or projected onto a DataObject (objectSettings.enterpriseProjection, later slice) with a field map. Defining an EnterpriseObject does NOT require a DataObject — projection is a separate, optional step.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique object identifier within this model. The name services reference. Must be a valid codeName. |
| `platformObject` | `String` | yes |  |  |  | The object's identifier in the platform's metadata — the entity set / sObject / object type name (e.g. 'A_BusinessPartner', 'Account', 'contacts'). The authoring agent picks this from the design-time metadata snapshot. |
| `externalIdField` | `String` | no |  |  |  | The platform field that is the object's primary key / stable identity (e.g. 'BusinessPartner', 'Id'). Used to dedupe on read and to key upserts when the object is projected/synced. |
| `selectedFields` | `String`[] | no |  |  |  | The subset of the platform object's fields this model works with (metadata field names). Empty/null means all fields. Drives which columns are read and which are offered when mapping to a DataObject. |

## Constraints

Property rules:

- `name`, `platformObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
