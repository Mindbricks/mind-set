# ObjectAuthorization

**Level:** `section` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [ObjectAuthorization in Part 1](../ontology/ObjectAuthorization.md)

Defines access control scope for this data object, including tenant scoping and public accessibility. These settings are applied globally unless explicitly overridden at the Business API level.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dataObjectAccess` | `DataObjectAccess` | no | `"accessPrivate"` | `accessPrivate`, `accessProtected`, `accessPublic` |  | Specifies the default access level for this DataObject and its related get/list APIs. The value is defined by the DataObjectAccess enum, which determines whether the object is private (restricted to owner/admins), protected (available to all authenticated project users), or public (open to everyone, including anonymous). API-level configurations may override this default. |
| `objectDataIsInTenantLevel` | `Boolean` | no | `true` |  |  | Determines whether this object is scoped per tenant in a multi-tenant architecture. Only a stored true adds the implicit tenant ID field `<tenantName>Id` (e.g., clientId) that segregates data per tenant and filters the object's reads and scoped writes to the caller's tenant; a blueprint that omits the flag gets no tenant column and no tenant filter, although the pattern lists true as its default, so set it explicitly. Use this for tenant-owned data like projects or documents. |

## Constraints

Property rules:

- `dataObjectAccess` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
