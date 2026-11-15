# ObjectGeoSettings

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [ObjectGeoSettings in Part 2](../spec/ObjectGeoSettings.md)

Design-time settings for the /geo REST surface a data object's geo-typed properties generate. The geo routes return full rows unless `selectProperties` narrows them, so an object whose moderation/publication state gates its BusinessApi reads needs the same discipline on the map surface: the access gate comes from `objectSettings.authorization.dataObjectAccess` (non-accessPublic ⇒ session required; accessPrivate additionally owner-scopes when the object has an owner field), and `visibilityFilter` narrows what any caller can see. TENANT ISOLATION IS NOT YOURS TO AUTHOR HERE: on a multi-tenant project the /geo quartet of an object declared `objectDataIsInTenantLevel: true` is pinned by the framework to the caller's own tenant, taken from the verified session and from nowhere else, and such an object therefore REQUIRES a session whatever `dataObjectAccess` says - an accessPublic tenant-level object is no longer anonymously readable on this surface, and a session that carries no tenant is answered 401 TENANT_REQUIRED rather than served. Previously no geo route carried a tenant term at all and a tenant-level object's map queries returned every tenant's rows.

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `geoSettings`

Blueprint paths:

- `authentication.dataObjects.objectSettings.geoSettings`
- `services.dataObjects.objectSettings.geoSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
