# ContentPermissionSettings

**Level:** `section` · **Family:** [ContentModel](./families.md#contentmodel) (domain `Service`)

**Specification:** [ContentPermissionSettings in Part 2](../spec/ContentPermissionSettings.md)

Editorial permissions of a content model, expressed over the project's user roles (session.roleId). Editing (create/update/delete drafts) and publishing (publish/unpublish/schedule/archive transitions) are separate capabilities so a writer/editor split maps directly. Published-content READ access is public by default — the headless-delivery posture — and can be restricted to authenticated sessions with publicRead false (member-only knowledge bases, internal docs). Editorial access fails closed: a model that declares no editRoles is written, previewed and published only by the operators of its level until roles are declared: single-tenant superAdmin and admin; multi-tenant saas level superAdmin and saasAdmin; tenant level (contentBasics.contentIsInTenantLevel) superAdmin, saasAdmin, tenantOwner and tenantAdmin, each inside its own session tenant. On a tenant-level model declared roles are confined to the caller's tenant too.

## Contained in

- [ContentModel](./ContentModel.md) as `permissionSettings`

Blueprint paths:

- `services.contentModels.permissionSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
