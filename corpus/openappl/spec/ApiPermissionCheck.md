# ApiPermissionCheck

**Level:** `subsection` · **Family:** [BusinessApiBasics](../ontology/families.md#businessapibasics) (domain `BusinessApi`)

**Ontology:** [ApiPermissionCheck in Part 1](../ontology/ApiPermissionCheck.md)

Per-BusinessApi NATIVE permission gate (ADR-native-permission-system §9.5). `permission` is a declared `PermissionGroup` permission name the caller must hold for this API; the runtime resolver decides it through the layered model (object/user override → object-role → multi-scope membership → global role → ownership). `scopeFields` is an OPTIONAL multi-scope channel: the request/instance FK fields whose ids form the `scopeMap` the resolver checks object-roles (L3) + memberships (L4) on. This is the native counterpart to `foreignPermissionCheck` (the two are mutually exclusive per API).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `permission` | `String` | yes |  |  |  | The permission name the caller must hold. Must resolve to a permission declared in a `PermissionGroup` (RBACSettings). The resolver checks it against the subject's overrides, object-roles, memberships, global role grants, and ownership per the ADR §5 precedence. |
| `scopeFields` | `Any` | no | `null` |  |  | OPTIONAL multi-scope channel (ADR-native-permission-system §5.0/§9.5). The target object's own declared scope-FK fields whose ids form the `scopeMap` ({scopeName→scopeObjectId}) the resolver checks object-roles (L3) and memberships (L4) on (union across scopes). Two forms: an ARRAY of FK field names (`['orgId','projectId']`) — each scope name is the field minus a trailing `Id` (`orgId→org`); or a MAP of explicit `{ scopeName: fkField }` (`{ org: 'orgId', project: 'parentProjectId' }`) when the scope name must differ from the field. The runtime gate reads each field off the request/fetched instance and threads `decide(permission, scopeMap, objectId)`. Omit for a single-object check (scopeMap empty → L4 abstains, L3 falls back to the objectId).  THE SCOPE NAME IS LOAD-BEARING: it must equal the SCOPE OBJECT'S OWN NAME, because that is the key the compiled membership config is built with. `['organizationId']` derives `organization`, which works only if the membership-bearing object is named `organization`; when it is not, name it explicitly (`{ org: 'orgId' }` for an object called `org`). A name that matches no membership-bearing object is silently fatal at runtime — the membership layer abstains, a single record falls through to deny-by-default and a list narrows to zero rows, with no diagnostic anywhere — so it is a design-time ERROR (`PERMISSION_CHECK_SCOPE_UNKNOWN`). |

## Constraints

Property rules:

- `permission` must be present. (`REQUIRED_FIELD_MISSING`)
