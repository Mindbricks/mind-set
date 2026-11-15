# EnterpriseProjection

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [EnterpriseProjection in Part 1](../ontology/EnterpriseProjection.md)

Projects a DataObject onto an EnterpriseObject (section, under objectSettings). Binds this local object to an external business object on an enterprise platform: `enterpriseModelName` + `enterpriseObjectName` name the asset in enterpriseHub, `fieldMap` maps local properties to platform fields, and `syncMode` picks the data-flow direction. The mcpbff bridge performs the platform I/O; slice 3.1 covers read/search (readThrough / pullMirror), write modes land later.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enterpriseModelName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The EnterpriseModel this projection targets — must match an enterpriseHub.enterpriseModels[].modelBasics.name. Identifies which integration/platform the object lives on. |
| `enterpriseObjectName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The EnterpriseObject within the model — must match one of that model's enterpriseObjects[].name. Its `platformObject` is the actual entity read/written on the platform. |
| `syncMode` | `EnterpriseSyncMode` | no | `"readThrough"` | `readThrough`, `pullMirror` |  | The READ / STORAGE strategy for this projection. `readThrough`: reads proxy to the platform live, nothing is stored locally. `pullMirror`: the platform is the source of truth, records are pulled into this object and persisted (read + event upsert). This axis is INDEPENDENT of write-back — whether fields are pushed to the platform is governed per-field by `fieldMap[].direction` (`out`/`both`), not by syncMode. A projection can pull most fields (`in`) and push a few (`out`) under either syncMode (e.g. mirror SAP invoices, write `paymentDueDate` back). |
| `fieldMap` | [`EnterpriseFieldMapItem`](./EnterpriseFieldMapItem.md)[] | no |  |  |  | Maps this DataObject's properties to the external object's fields. Each entry binds one local property to one platform field with a direction. Properties not mapped are local-only; platform fields not mapped are ignored. |

## Constraints

Property rules:

- `enterpriseModelName`, `enterpriseObjectName` must be present. (`REQUIRED_FIELD_MISSING`)
- `syncMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `enterpriseModelName`, `enterpriseObjectName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `fieldMap` must have distinct names (`property`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `UNKNOWN_ENTERPRISE_EXTERNAL_FIELD` | error | External field "…" is not in enterprise object "…"'s selectedFields. |
| `UNKNOWN_ENTERPRISE_MODEL` | error | Enterprise model "…" is not declared in enterpriseHub.enterpriseModels[]. |
| `UNKNOWN_ENTERPRISE_OBJECT` | error | Enterprise object "…" is not declared in model "…". |
