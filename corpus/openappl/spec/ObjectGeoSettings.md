# ObjectGeoSettings

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [ObjectGeoSettings in Part 1](../ontology/ObjectGeoSettings.md)

Design-time settings for the /geo REST surface a data object's geo-typed properties generate. The geo routes return full rows unless `selectProperties` narrows them, so an object whose moderation/publication state gates its BusinessApi reads needs the same discipline on the map surface: the access gate comes from `objectSettings.authorization.dataObjectAccess` (non-accessPublic ⇒ session required; accessPrivate additionally owner-scopes when the object has an owner field), and `visibilityFilter` narrows what any caller can see. TENANT ISOLATION IS NOT YOURS TO AUTHOR HERE: on a multi-tenant project the /geo quartet of an object declared `objectDataIsInTenantLevel: true` is pinned by the framework to the caller's own tenant, taken from the verified session and from nowhere else, and such an object therefore REQUIRES a session whatever `dataObjectAccess` says - an accessPublic tenant-level object is no longer anonymously readable on this surface, and a session that carries no tenant is answered 401 TENANT_REQUIRED rather than served. Previously no geo route carried a tenant term at all and a tenant-level object's map queries returned every tenant's rows.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `visibilityFilter` | `Any` | no |  |  |  | A STATIC where object merged into the query of every geo route of this object (all four ops, on relational/PostGIS and MongoDB storage alike). Keys are first-level property names of the owning data object; values are scalar literals (string, number, boolean, or null) a row must equal to be visible through the geo surface. Typical use: { "moderationStatus": "approved", "isPublished": true } so unmoderated or unpublished rows never leak through map queries. Non-scalar values are rejected at design time because array/object operands do not mean the same thing on both storage engines. Do NOT try to spell tenant isolation in here: a static literal would pin every geo query to one hard-coded tenant id, the framework already applies the tenant term itself, and it is merged AFTER this filter so a key that names the tenant column cannot override the session value. DECLARE IT WHENEVER THE OBJECT HAS A PUBLICATION GATE: with no filter here, the only narrowing left is the anonymous backstop, which recognises exactly three column shapes - `withdrawn` (Boolean), `isPublished` (Boolean) and `moderationStatus` (Enum carrying "approved") - and narrows a SESSION-LESS caller only. A `verificationStatus` column, a `moderationStatus` typed String rather than Enum, or an Enum whose publishable value is spelled anything else reads exactly like the covered shapes and narrows NOTHING, so unapproved rows stay plotted on the map while the object's list/get apis hide them. Validation reports that shape as GEO_PUBLIC_SURFACE_UNFILTERED (warning). |
| `selectProperties` | `String`[] | no |  |  |  | The columns the geo routes of this object answer with: a list of first-level property names of the owning data object. Leave it unset (or empty) to answer full rows, the default. When set, the projection is applied AT THE QUERY on every geo route (`attributes` on relational/PostGIS storage, a projection on MongoDB), so a column left out never leaves the database. Always kept, whether listed or not: `id`, the geo field the route queries, and every column the route's own filters compare (the visibilityFilter keys, the owner and tenant pins, the moderation and publication gates, `isActive` on a soft-delete object); the computed `distance_m` of the proximity routes stays too. Use it on a PUBLIC geo-indexed object (dataObjectAccess accessPublic) so internal columns such as review notes are not served to anonymous map callers. A name that is not a property of the object is a design-time error (PROPERTY_NOT_FOUND). |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `GEO_SETTINGS_WITHOUT_GEO_PROPERTY` | warning | geoSettings on "…" is inert: the object has no geo-typed property (GeoPoint/GeoRoute/GeoArea), so no /geo route is generated and the visibility filter never applies. |
| `GEO_VISIBILITY_FILTER_NOT_OBJECT` | error | visibilityFilter must be a plain object mapping first-level property names of "…" to scalar literals (e.g. |
| `GEO_VISIBILITY_FILTER_VALUE_NOT_SCALAR` | error | visibilityFilter.… must be a scalar literal (string, number, boolean, or null); … operands are refused because they do not mean the same thing on relational and MongoDB storage. |
