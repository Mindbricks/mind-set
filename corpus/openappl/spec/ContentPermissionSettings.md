# ContentPermissionSettings

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ContentPermissionSettings in Part 1](../ontology/ContentPermissionSettings.md)

Editorial permissions of a content model, expressed over the project's user roles (session.roleId). Editing (create/update/delete drafts) and publishing (publish/unpublish/schedule/archive transitions) are separate capabilities so a writer/editor split maps directly. Published-content READ access is public by default — the headless-delivery posture — and can be restricted to authenticated sessions with publicRead false (member-only knowledge bases, internal docs). Editorial access fails closed: a model that declares no editRoles is written, previewed and published only by the operators of its level until roles are declared: single-tenant superAdmin and admin; multi-tenant saas level superAdmin and saasAdmin; tenant level (contentBasics.contentIsInTenantLevel) superAdmin, saasAdmin, tenantOwner and tenantAdmin, each inside its own session tenant. On a tenant-level model declared roles are confined to the caller's tenant too.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `publicRead` | `Boolean` | no | `true` |  |  | When true (default), published records are served by the delivery routes WITHOUT authentication (public website content). When false, delivery requires an authenticated session (member/internal content). |
| `editRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Roles allowed to create/update/delete content and items, reorder items and restore a version to draft. Content CRUD guards also enforce this on designer-authored APIs. Empty/absent editRoles fails closed: only the operators of the model's level may edit (single-tenant superAdmin and admin; a multi-tenant saas-level model superAdmin and saasAdmin, because its rows are shared and a tenant role would write every tenant's content; a tenant-level model superAdmin, saasAdmin, tenantOwner and tenantAdmin, each inside its own session tenant). absoluteRoles bypasses the gate. A trusted system caller with no user session (a cron job of the service, a framework-internal or kafka-triggered call, a verified M2M token naming no user on an M2MAllowed api) passes the write guard of designer-authored APIs; an anonymous call (loginRequired: false) never does (warning CONTENT_ANONYMOUS_WRITE). Editorial reads (drafts, versions, preview by id) admit the edit roles (so the same operators when none are declared), publish, review and approve roles. |
| `publishRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Roles allowed to publish/unpublish/schedule/archive/restore (un-archive). Empty/absent falls back to editRoles; with no editRoles either, only the operators of the model's level (see editRoles) run transitions, and on a tenant-level model only inside the caller's tenant. Models without publishRoles or absoluteRoles receive the CONTENT_NO_PUBLISH_ROLES warning naming who publishes; declare actual project roles. restoreVersion edits a draft and never changes workflow state: only a draft or archived record restores; published, scheduled, inReview and approved are refused 409 (run the transition first). |
| `absoluteRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Role names that bypass all editorial permission checks. Examples: ['superAdmin']. |

## Constraints

Property rules:

- `editRoles`, `publishRoles`, `absoluteRoles` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
