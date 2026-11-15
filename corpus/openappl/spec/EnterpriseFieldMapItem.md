# EnterpriseFieldMapItem

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [EnterpriseFieldMapItem in Part 1](../ontology/EnterpriseFieldMapItem.md)

**Name:** an instance is named by `property`.

One property↔field binding in an EnterpriseProjection.fieldMap (subsection). Maps a local DataObject property to a field on the external platform object, with a flow direction.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `property` | `String` | yes |  |  |  | The local DataObject property name this entry binds. Must be a real property of the owning DataObject. |
| `externalField` | `String` | yes |  |  |  | The platform field name this property maps to (a field of the EnterpriseObject's platformObject, e.g. 'BusinessPartnerName'). When the EnterpriseObject declares selectedFields, this must be one of them. |
| `direction` | `EnterpriseFieldDirection` | no | `"in"` | `in`, `out`, `both` |  | Flow direction for this field, INDEPENDENT of syncMode: `in` (platform → local, read/pull), `out` (local → platform, write-back), `both`. Defaults to `in`. A projection may mix directions per field — e.g. pull invoice fields (`in`) and push `paymentDueDate` back (`out`) under the same pullMirror projection. The read side (`in`/`both`) is wired in slice 3.2; the write-back side (`out`/`both`) in slice 3.3. |

## Constraints

Property rules:

- `property`, `externalField` must be present. (`REQUIRED_FIELD_MISSING`)
- `direction` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
