# LedgerAdditionalProperties

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [LedgerAdditionalProperties in Part 1](../ontology/LedgerAdditionalProperties.md)

Designer-declared extra columns on the generated satellite objects — full DataProperty declarations, relations included. This is where REAL FKs live, in contrast to the metadata-only party refs. Names must not collide with the framework-owned generated fields of each satellite table (LEDGER_RESERVED_FIELD_COLLISION) nor with the column names configured on parties/entrySource/entryMaturity/reservation.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `entry` | [`DataProperty`](./DataProperty.md)[] | no |  |  |  | Extra columns on the sys_<X>LedgerEntry lot object. |
| `movement` | [`DataProperty`](./DataProperty.md)[] | no |  |  |  | Extra columns on the sys_<X>LedgerMovement append-only log object. |
| `reservation` | [`DataProperty`](./DataProperty.md)[] | no |  |  |  | Extra columns on the sys_<X>LedgerReservation object (only meaningful when reservation.enabled). |

## Constraints

Property rules:

- The items of `entry` must have distinct names (`basicSettings.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `movement` must have distinct names (`basicSettings.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `reservation` must have distinct names (`basicSettings.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
