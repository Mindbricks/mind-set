---
title: Authorization model
---

# 6. Authorization model

This chapter specifies how a generated business API decides whether a caller may do
what it asks. The decisions are part of C1: for the same blueprint, the same session and
the same stored data, every conforming compiler **MUST** reach the same decision and
answer with the same HTTP status.

The configuration lives in three places:

- per API: `authOptions` ([`ApiAuthOptions`](../spec/ApiAuthOptions.md)): `loginRequired`,
  `checkRoles`, `absoluteRoles`, `ownershipCheck`, `parentOwnershipChecks`,
  `permissionCheck`, `foreignPermissionCheck`, `apiInSaasLevel`, `crossTenantScopeOf`,
  `M2MAllowed`, `requiredCallerKind`;
- per project: `authentication` ([`ProjectAuthentication`](../spec/ProjectAuthentication.md)):
  roles, permissions, tenancy, the foreign permission provider;
- per data object and property: the tenant scope flag
  (`objectSettings.authorization.objectDataIsInTenantLevel`) and the owner field
  (`sessionSettings.isOwnerField` on a property).

Workflow actions (permission, membership and validation checks) add further decisions at
the milestones where the blueprint places them ([chapter 5](05-business-apis.md)).

## 6.1 Callers

Every request has exactly one **caller kind**:

| Caller kind | How it is recognised |
|---|---|
| **User** | A valid session token (bearer header or session cookie, [chapter 9.1](09-01-authentication-and-sessions.md)). |
| **Machine** | A valid machine-to-machine token in the `x-m2m-token` header, issued to another service. It may name a user on whose behalf it calls. |
| **Trusted system** | A scheduled job, or an in-process call from one API of the service to another. Never reachable from outside. |
| **Anonymous** | None of the above. |

An invalid or expired session token **MUST NOT** produce an error by itself: the request
continues as anonymous, and the login gate decides. Rationale: public APIs must keep
working for a client that holds a stale token.

## 6.2 Order of decisions

A conforming API **MUST** evaluate the gates in the following order, and **MUST** answer
with the status of the first gate that refuses. The order matters because it decides
which status a caller sees when several gates would refuse.

| # | Gate | Refusal |
|---|---|---|
| 1 | **Tenant resolution** (multi-tenant projects): resolve the tenant the request names (6.6). | unknown tenant **404**; tenant store unreachable **503** |
| 2 | **Session**: resolve the token to a session. A session that must log in again is refused. | **401** |
| 3 | **Tenant replay guard**: a request that names a tenant other than the session's own. | **403** |
| 4 | **Machine identity**: verify the machine token and the caller allow and block lists. | **403** (refused issuer), **503** (key set unreachable) |
| 5 | **Login** (`loginRequired`): a caller must be identified. | **401** |
| 6 | **Session state**: a pending password change or second factor. | **403** |
| 7 | **Tenant required**: a tenant-scoped API needs a trusted tenant (6.6). | **403** `TENANT_REQUIRED` |
| 8 | **Caller kind** (`requiredCallerKind`). | **403** |
| 9 | **Roles** (`checkRoles`, after the absolute-role bypass, 6.3). | **403** |
| 10 | *Parameters are read and checked* ([chapter 5](05-business-apis.md)). | **400** |
| 11 | **Foreign permission check** (6.8). | **403**, or the status the provider gives |
| 12 | **Permission, type level** (`permissionCheck`, 6.4). Final for create and a plain get; deferred to step 16 for update, delete and list. | **403** |
| 13 | **Parent ownership** (`parentOwnershipChecks`). | **403** |
| 14 | **Query scope**: build the where clause; tenant, ownership (list), permission (list), soft-delete terms are added (6.5, 6.6). | narrows, never refuses |
| 15 | **Fetch** the addressed record (get, update, delete) through the scoped query. | **404** |
| 16 | **Ownership, instance mode** (6.5); **permission, object level** (6.4). | **403** |
| 17 | The main operation and the workflow ([chapter 5](05-business-apis.md)). | as specified there |

Steps 1 to 4 run once per request for every API. A compiler **MAY** run them in shared
middleware. The roles gate **MAY** be evaluated twice (before and after parameters) as
long as the outcome is the same.

> **To verify:** the exact status and body of gates 1, 3 and 6 against the reference
> error catalogue. Generated table goes here (S9): the error-code catalogue with codes and
> statuses.

## 6.3 Roles and absolute roles

**Roles** come from the session's `roleId`. When the project allows several roles per
user (`usersHaveMultipleRoles`), `roleId` is an array.

- `checkRoles` **MUST** pass when **any** role the caller holds is in the list.
- Role names **MUST** be compared case-insensitively.
- There is **no** role hierarchy: holding `superAdmin` does not satisfy
  `checkRoles: ["admin"]` (but see absolute roles below).
- A caller with no role matches nothing.
- Named custom role predicates (`customRoleLookups`) **MAY** satisfy `checkRoles`; they
  never make a caller absolute.

**System roles** exist in every project whether or not RBAC is active:

| Project kind | System roles |
|---|---|
| Single tenant | `superAdmin`, `admin`, `user` |
| Multi-tenant | `superAdmin`, `saasAdmin`, `saasUser`, `tenantOwner`, `tenantAdmin`, `tenantUser` |

In a multi-tenant project, `admin` and `user` do not exist; a reference to them is a
validation error. Designer roles come from the RBAC settings and **MUST NOT** reuse a system
role name.

> **To verify:** the default role of a newly registered user (`user` / `tenantUser`) and
> that the creator of a tenant gets `tenantOwner`. Stated in the schema documentation,
> not yet checked in the reference's behaviour.

**Absolute roles** are roles that pass every role, ownership and permission gate of an
API. The effective list of an API **MUST** be:

```text
absolute(api) = authored absoluteRoles
              ∪ { superAdmin }                    if the API requires login
              ∪ { tenantOwner }                   if the tenant filter is in force (6.6)
```

and empty when the API does not require login.

| An absolute role bypasses | An absolute role does **not** bypass |
|---|---|
| the roles gate (9) | the tenant scope of the query (14), ever |
| the foreign permission check (11) | the login gate: it needs a session |
| the permission check, type and object level (12, 16), and the permission term of a list (the caller sees all rows) | `TENANT_REQUIRED` (7) |
| parent ownership (13) and ownership (16), including the ownership term of a list | `requiredCallerKind` (8) |
| workflow permission and membership check actions | validation actions whose status is not 401 or 403 |
| validation actions whose status is 401 or 403 | the content moderation hold |

Rationale: the operator must be able to act on every record of their tenant, but no role
may break tenant isolation.

Rule example:

```json
{
  "apiOptions": { "name": "deleteOrder", "crudType": "delete", "dataObjectName": "order" },
  "authOptions": { "loginRequired": true, "checkRoles": ["clerk"], "ownershipCheck": true }
}
```

| Caller | Order | Result |
|---|---|---|
| `clerk`, owner of the order | same tenant | 200 |
| `clerk`, not the owner | same tenant | 403 |
| `manager` (not listed) | same tenant | 403 |
| `tenantOwner` of the tenant | same tenant | 200 (absolute) |
| `superAdmin` | another tenant, no tenant named | 404 (tenant scope still applies) |
| no session | any | 401 |

## 6.4 Permissions

A project declares named permissions in permission groups
([`PermissionBasics`](../spec/PermissionBasics.md)). When `pbacIsActive` is true, grants
are stored as records and resolved per request. An API asks for one permission with
`permissionCheck: { permission, scopeFields }`.

### The resolver

For permission `P`, caller `S`, object `O` and the scope ids derived from `scopeFields`,
the decision is taken by the first layer that does not abstain:

| Layer | Grant record that matches |
|---|---|
| L0 | the caller holds a project-wide absolute role: **allow** (cannot be denied) |
| L1 | a grant of `P` to `S` on object `O` |
| L2 | a grant of `P` to `S` on no object (user override) |
| L3 | a role granted to `S` on `O` or on a scope id, whose role carries `P` |
| L4 | a membership of `S` in a scope object, whose membership role carries `P` |
| L5 | a grant of `P` to one of the caller's roles |
| L6 | ownership, when the API also checks ownership |
| L7 | **deny** (deny by default) |

- Inside one layer, a **deny** grant **MUST** beat an **allow** grant.
- An attribute rule (`ABACDefinition`) **MUST** act as a condition on existing grants of
  the permissions it lists: a grant counts only when the condition is true. It **MUST
  NOT** grant a permission on its own. A condition that cannot be evaluated **MUST**
  count as false (fail closed).

> **To verify:** layer L6 compares an owner property of the record with the caller; the
> reference reads a property that ordinary records do not carry, so in practice ownership
> is decided by `ownershipCheck` (6.5). Also unverified: whether user-group grants take
> part in this resolver (they are honoured by the workflow permission action).

### Effect per API type

| API type | Deny at type level | Deny at object level |
|---|---|---|
| create, plain get | **403** | — |
| update, delete | deferred | **403** after the fetch |
| list | the list is filtered: only records the caller may see; zero rows when none | — |

### When PBAC is off

When `pbacIsActive` is false, there are no grants, and a `permissionCheck` **MUST** deny
every caller except absolute-role holders, trusted system callers and session-less machine
callers on `M2MAllowed` APIs. A list answers with zero rows. Validators reject this
combination; a compiler that accepts it anyway **MUST** keep the deny-closed behaviour.

Rationale: a permission check that cannot be decided must never pass.

## 6.5 Ownership

The **owner** of a record is the value of the property marked `isOwnerField`. The
reference also treats the `id` of the authentication service's `user` object as its own
owner field. By default the owner field is filled from the creating caller's session
(`userId`); it is the creator, never derived later.

`ownershipCheck: true` **MUST** behave as follows:

| API type | Behaviour |
|---|---|
| get, update, delete | Fetch through the scoped query; **404** when nothing matches; then **403** when the record's owner is not the caller. |
| list | Add `owner = caller` to the query; answer **200** with the caller's records only. |
| create | No effect (the caller becomes the owner). |

- A blueprint that sets `ownershipCheck` on an object without an owner field is a
  validation error. A compiler **MUST NOT** silently ignore the flag.
- Ownership is bypassed by absolute roles, trusted system callers and public APIs.
- A machine caller without a user identity **MUST** be refused (**403**) by an ownership
  check; a machine token that names a user is checked as that user.
- `parentOwnershipChecks` fetches the parent named by a request field and **MUST** answer
  **403** when the parent is missing or not owned by the caller.

Note the observable difference: a record of the caller's tenant owned by somebody else
answers **403**, so its existence is visible; a record of another tenant answers **404**.

## 6.6 Tenant isolation

A project is multi-tenant when `tenantSettings.useMultiTenantFeature` is true. Its
`tenantName` (for example `store`) names the tenant concept and the tenant column
(`storeId`). Tenants are flat. A user belongs to exactly one tenant; there is no path by
which membership in one tenant grants access to another.

**Which objects are scoped.** A data object is tenant-scoped when
`objectDataIsInTenantLevel` is `true`. A scoped object carries the tenant column
([chapter 4](04-data-layer.md)).

> **To verify:** the default of `objectDataIsInTenantLevel`. The schema declares `true`,
> but the reference scopes an object only when the value is stored as `true` in the
> blueprint. Until this is settled, a blueprint **SHOULD** state the value explicitly.

**The request tenant.** The tenant of a request is, in this order: the session's own
tenant; else the tenant named by the request; else the root tenant. A request names a
tenant by the header `mbx-<tenantName>-codename` (or the header name the project
configures), else a body or query field `_<tenantName>`, carrying the tenant's codename.
The root tenant's codename is `root`.

**The tenant filter.** For get, list, update and delete on a scoped object, unless the API
is `apiInSaasLevel`, the compiler **MUST** add `<tenantName>Id = <request tenant>` to the
final query **after** every authored where clause, ownership, permission and membership
term, so that nothing the blueprint says can remove it. This is the "tenant filter in
force" condition used by 6.3. On create, the tenant column **MUST** be stamped from the
request tenant.

| Situation | Status |
|---|---|
| Id of a record in another tenant (get, update, delete) | **404** |
| List | only the request tenant's records |
| Request names tenant B, session belongs to tenant A, caller not `superAdmin` | **403** |
| Request names an unknown tenant codename | **404** |
| Tenant-scoped API, user session without a tenant | **403** `TENANT_REQUIRED` |
| `superAdmin` naming a tenant in the request | acts in that tenant |
| `apiInSaasLevel: true` | no tenant filter; no automatic `tenantOwner` |

A **trusted** tenant for the `TENANT_REQUIRED` gate is the session's own tenant, a tenant a
`superAdmin` names, or a machine token's tenant claim. Request data alone, and the root
fallback, are never trusted.

Rule example:

```json
{
  "authentication": { "loginDefinition": { "tenantSettings": {
    "useMultiTenantFeature": true,
    "configuration": { "tenantName": "store" } } } }
}
```

with a scoped object `product` and a list API on it. A `tenantAdmin` of store A calls the
list: the answer holds only rows whose `storeId` is store A's id. They call the get API
with the id of a store B product: **404**.

## 6.7 Machine callers

- A machine token **MUST** be verified against the issuing service's published key set,
  and the issuer **MUST** pass the service's allow and block lists (open when neither is
  set).
- `M2MAllowed: true` only **widens** an API: a machine caller without a user identity
  passes the login, roles and permission gates. It never passes an ownership check.
- `requiredCallerKind` only **narrows**: `machine` refuses user callers,
  `machineWithoutUserIdentity` refuses machine tokens that name a user. Absolute roles do
  not bypass it.
- A machine token that names a user, or forwards a user's bearer token, is held to that
  user's rights at every gate.
- In a multi-tenant project, a machine call's tenant is its token's tenant claim, else
  the tenant it names; a tenant-scoped API without either answers **403**.

## 6.8 Foreign permission check

A project may delegate decisions to an external permission service
(`authentication.foreignPermissionProvider`, REST or gRPC). An API that declares
`foreignPermissionCheck.params` calls it after the roles gate and before the native
permission check.

- The call **MUST** carry the session bindings the provider declares.
- A provider answer that matches `denyWhen` **MUST** refuse with `statusFrom(result)`, or
  **403** when that is empty, and the message `denyMessage`, else `messageFrom(result)`,
  else a generic message.
- A transport error, timeout or unexpected answer **MUST** refuse with **403**, unless the
  provider is configured `failOpen`.
- The check is skipped for trusted system callers and absolute roles.

> **To verify:** the provider call timeout and the generic message wording (documented as
> 10 seconds and "Permission check unavailable").

## 6.9 Public APIs

`loginRequired: false` makes an API public. It **MUST** switch off the login, roles,
ownership, parent ownership and native permission gates, and no role is absolute on it.
Validators reject role or permission gates on a public API. The tenant filter still
applies to scoped objects, with the request tenant as resolved in 6.6.

`loginRequired` defaults to `true`.

> **To verify:** the schema documentation says `loginRequired` inherits from the data
> object; the reference defaults it to `true`. This chapter follows the reference.

## 6.10 Profiles

| Feature | Note for profiles |
|---|---|
| Approval (`requireApproval`) | Not available on every reference target; a compiler **MAY** refuse it. |
| Foreign permission provider | A separate family; **MAY** be refused. |
| PBAC grants, membership roles, ABAC | One family with the permission resolver; **MAY** be refused as a whole, never in part. |
