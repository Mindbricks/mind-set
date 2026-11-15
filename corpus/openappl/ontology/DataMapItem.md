# DataMapItem

**Level:** `section` · **Family:** [SeedData](./families.md#seeddata) (domain `Service`)

**Specification:** [DataMapItem in Part 2](../spec/DataMapItem.md)

Represents a single key-value pair used in most context. The value can be defined dynamically using an MScript.

## Contained in

- [ApiForeignPermissionCheck](./ApiForeignPermissionCheck.md) as `params` (a list)
- [BusinessApiQuery](./BusinessApiQuery.md) as `dataClauseItems` (a list)
- [EventDataSettings](./EventDataSettings.md) as `includeData` (a list)
- [GetOptions](./GetOptions.md) as `setAsRead` (a list)
- [GrpcCallRequest](./GrpcCallRequest.md) as `fields` (a list)
- [InterProjectCallAction](./InterProjectCallAction.md) as `apiParameters` (a list)
- [InterserviceCallAction](./InterserviceCallAction.md) as `apiParameters` (a list)
- [ListOptions](./ListOptions.md) as `setAsRead` (a list)
- [LoginDefUserSettings](./LoginDefUserSettings.md) as `superAdminData` (a list)
- [RBACSettingsConfig](./RBACSettingsConfig.md) as `customRoleLookups` (a list)
- [SeedData](./SeedData.md) as `values` (a list)
- [VisitTracking](./VisitTracking.md) as `ownerReadMapping` (a list)

Blueprint paths:

- `authentication.businessLogic.query.dataClauseItems`
- `services.businessLogic.query.dataClauseItems`
- `services.seedData.values`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
