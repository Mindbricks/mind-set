---
title: Multi-tenancy guide
---

# Multi-tenancy guide

This is the **cross-cutting** guide to multi-tenancy in OpenAPPL - how a
single deployed backend serves many isolated **tenants** (organizations,
workspaces, clients, accounts) while keeping their data, sessions, access
control, and events apart.

Two narrower views link back here rather than duplicating:

- [Authentication - Multi-tenancy](../system-services/authentication/multi-tenancy.md)
  - defining, registering, and naming tenants on the auth side.
- [Data modeling - Multi-tenancy](../data-modeling/multi-tenancy.md) - the
  data-scoping slice (the per-object override and the injected tenant id).

## The mental model: global by default, overridable per object

Multi-tenancy in OpenAPPL is **global**. You enable it **once**, at the
project level, on the [`LoginDefTenantSettings`](../../spec/LoginDefTenantSettings.md)
of the login definition. When it is on, **every part of the generated system
respects it** - authentication, sessions, tokens, data objects, business
APIs, the BFF and its DataViews, Elasticsearch indexes, MCP-BFF routed
calls, and events.

That global default is then **overridable per object** (and per part). A
data object is either:

- **tenant-level** (`objectDataIsInTenantLevel: true`) - rows belong to one
  tenant and are isolated from the others, or
- **SaaS-level** (`objectDataIsInTenantLevel: false`) - rows are global,
  shared across all tenants (shared catalogs, plans, configuration).

So objects **can** be defined inside the tenancy or outside it - that is a
first-class override, not an impossibility. The right framing is **"global
default plus explicit per-object override"**, never "tenancy is not an
object concern."

> Multi-tenancy (a tenant owns the row) is a different dimension from
> [membership](../composition/membership.md) (specific users are granted
> access to a specific record). A row can be both tenant-scoped and
> membership-shared.

## Enabling multi-tenant mode

Multi-tenancy is off by default - a project is single-tenant unless
`tenantSettings` is present and active.

```json
{
  "authentication": {
    "loginDefinition": {
      "tenantSettings": {
        "useMultiTenantFeature": true,
        "configuration": { "tenantName": "workspace" }
      }
    }
  }
}
```

- `useMultiTenantFeature: true` turns the global tenancy on.
- `configuration.tenantName` names the tenant concept (`client`, `store`,
  `workspace`, `organization`, ...). It must be a valid code name.

For MongoDB, a unique property on a tenant-level object uses the tenant column first, once. Authored composite and partial index declarations keep their own scope. At boot the replacement property index must build before an old global property unique is removed by its catalog name. A failed build keeps the old protection; a refused drop leaves both indexes and is logged. Currently declared authored partial indexes are retained during this reconciliation. Nullable members keep their BSON-type guards, and soft-delete objects retain the live-row filter.

See the auth page for `tenantRegisterIsPublic`, `uniqueTenantName`,
`compositeIndexSettings` and `tenantAutoAvatarScript`.

## The tenant concept

When tenancy is on, the compiler generates a **tenant data object** whose name
is `tenantName`. Each tenant record carries:

| Field | Purpose |
|-------|---------|
| `id` | Unique tenant id. |
| `name` | Human-friendly name. Not unique by default; set `uniqueTenantName: true` to make it a real identity (see below). |
| `codename` | Unique machine identifier (slug) - the canonical routing key. |
| `fullname` | Display name. |
| `avatar` | Public image URL (can be auto-generated). |
| `ownerId` | The user who created the tenant. |
| custom fields | Anything you declare under `tenantProperties`. |

Custom tenant fields are ordinary [`DataProperty`](../../spec/DataProperty.md)
entries on `authentication.tenantProperties` - e.g. a `subscriptionLevel`
enum that downstream PBAC and business logic can branch on. They become
available in registration, BFF DataViews, access control, and API logic.

### Name vs codename

Every tenant has a human **`name`** and a machine **`codename`** (lowercase
slug). The **codename is the canonical identifier** used everywhere the
runtime resolves tenancy: request headers, query/body params, token and
cookie names, access control, DB and Elasticsearch filters, and frontend
routing. Display the `name`; route and authorize with the `codename`.

The codename is **unique but never contested**: the db layer mints it from the
name with a counter suffix (`acme`, then `acme1`), precisely so a create always
succeeds. So codename uniqueness refuses nothing, and by default two tenants
may share a `name`. Set
`tenantSettings.configuration.uniqueTenantName: true` when the tenant name is a
real identity in your product: the `name` column then carries a unique database
index of its own (partial on `isActive`, so a soft-deleted tenant releases its
name), the owner-provisioning APIs refuse a replay with a `409` before writing
anything, and two concurrent registrations resolve to one winner and one
refusal. Names are compared EXACTLY - case and interior whitespace are
significant. For a tenant identity that is a PAIR of columns, declare
`compositeIndexSettings` on the same block instead; a composite covering `name`
supersedes the single-name rule. See
[Multi-tenancy (auth slice)](../system-services/authentication/multi-tenancy.md).

## How the tenant context is resolved per request

The runtime resolves the active tenant codename from each incoming request,
checked in this order (the tenant header/field name is derived from
`tenantName`):

1. **Header** - `mbx-<tenantName>-codename` (e.g. `mbx-workspace-codename: acme`),
   or the header the project names in `tenantNameHeaderName`.
2. **Request body** - the `_<tenantName>` field (e.g. `{ "_workspace": "acme" }`).
3. **Query parameter** - `?_<tenantName>=acme`.
4. **Fallback: `root`** - when none of the above is present.

The backend does not read a tenant from the URL path. A frontend that shows
the tenant in its own URLs turns it into the header (see
[Selecting the tenant from the URL](#selecting-the-tenant-from-the-url)).

The resolved codename becomes `session.tenantCodename` -- that generic
spelling is the real one, and it is the only generic tenant name a session
carries. The runtime resolves it to the tenant id and stamps it under the
PROJECT's own name, `session.<tenantName>Id` (e.g. `session.workspaceId`);
there is no `session.tenantId`.

### The `root` tenant

`root` is the **SaaS-level** tenant - the platform owner's context. It is
the fallback when no tenant is supplied and is where SaaS-wide operations
live: managing other tenants, billing and subscriptions, viewing global
data (where permitted), and creating administrators. A request without a
tenant codename is treated as a `root` request.

## Tenant-scoped authentication

### Login and sessions are tenant-specific

A login happens **inside a tenant context**. Logging into tenant *A* does
not grant access to tenant *B* - each login issues an access token scoped
to its tenant, and the runtime keeps the tenants apart. The same
human can simultaneously hold:

- a SaaS role at `root` (e.g. `superAdmin`),
- an admin role in one tenant,
- a plain user role in another.

### Token and cookie naming

The session cookie has one name per project, whatever the tenant:

```
<projectCodename>-access-token
```

The tenant is not part of the name (the `SESSION_TOKEN_NAME` environment
variable overrides it). A client that works in several tenants at once keeps
each tenant's token and sends it as a bearer token. See
[Access tokens](../system-services/authentication/access-tokens.md) for where
a service looks for the token.

> User session JWTs are signed **EdDSA** by the auth service, whatever the
> tenancy: the tenant changes the token's *scope*, not its name or its
> algorithm. The separate Ed25519 project key (see
> [Application signing & keys](application-signing.md)) is an unrelated
> surface.

### Registration is tenant-specific

Registering through a tenant context creates the user **inside that
tenant**, not at `root`:

```
POST /register?_workspace=acme
```

creates the user in `acme`. The same applies via the header or body form.

## Tenant-level vs SaaS-level objects (the override)

This is the per-object override of the global default.

### Tenant-level objects

```json
{
  "objectSettings": {
    "authorization": { "objectDataIsInTenantLevel": true }
  }
}
```

For a tenant-level object the generated service:

- injects an implicit `<tenantName>Id` field (e.g. `workspaceId`),
- fills it from the request's tenant context on create,
- prevents the tenant pointer from being changed afterward,
- filters every query by the current tenant.

A created row therefore carries the tenant pointer automatically:

```json
{ "title": "Q3 roadmap", "workspaceId": "uuid-of-current-tenant" }
```

This is the default for domain data once tenancy is on
(`objectDataIsInTenantLevel` defaults to `true`), so most objects need no
extra config.

### Generated surfaces carry the same term

Routes the generated service mounts beside your Business APIs obey the same rule,
each from the verified session and never from request input:

- **`/geo` spatial reads** on a tenant-level object require a session and
  pin the tenant column to the caller's session tenant; the anonymous
  publication backstop is not emitted for such an object at all.
- **DbBucket file routes** (`/bucket/<name>/...`): the injected
  `<bucketName>File` object is tenant-level, so the upload stamps the tenant
  pointer from the session (or from the upload token's server-minted tenant
  claim), and download / metadata / delete / share-url answer a cross-tenant
  session the same `404` as a missing row. The signed `/shared/:key` link
  stays token-scoped - it can only be minted through the tenant-checked
  share-url gate.
- **RemoteBucket / NativeBucket file routes** (`/bucket/<name>/...`,
  `/nativebucket/<name>/...`): the injected `<bucketName>RemoteFile`
  metadata twin is tenant-level too, so its list/stats and design-time
  surfaces scope like any tenant-level object, the through-server upload
  stamps the tenant pointer from the session, and download / object-delete
  answer a cross-tenant session the same `404`. A presign-uploaded object
  has no metadata row and a row created before the column existed carries
  `NULL`: both read as an *unnamed* tenant pointer - never hidden from
  their own tenant, never attributed to another.
- **Graph queries**: generated Cypher filters on the node's projected
  `<tenantName>Id` property with a row-side predicate, so a caller that
  binds no `tenantId` parameter sees only untenanted nodes - never every
  tenant's.

### SaaS-level objects

```json
{
  "objectSettings": {
    "authorization": { "objectDataIsInTenantLevel": false }
  }
}
```

SaaS-level objects are **not** auto-filtered by tenant and are governed by
SaaS-level permissions. Use them for shared catalogs, subscription tiers,
global configuration, and anything that should be the same for every tenant.

See [Data modeling - Multi-tenancy](../data-modeling/multi-tenancy.md) for
the modeling details and the dual-engine note below.

> **Both engines.** The tenant pointer and filtering apply on **PostgreSQL**
> and **MongoDB** alike. On PostgreSQL the injected
> `<tenantName>Id` is a column; on MongoDB it is a field on the document.
> Tenant filtering is added to the generated query layer in both cases -
> there is no engine that opts out of tenancy.

## Multi-tenant access control

Enabling tenancy provisions two tiers of built-in roles:

- **SaaS-level** (operate at `root`): `superAdmin`, `saasAdmin`, `saasUser`.
- **Tenant-level** (operate inside a tenant): `tenantOwner`, `tenantAdmin`,
  `tenantUser`.

**`admin` is not available in multi-tenant projects; use `superAdmin` /
`saasAdmin`.** The multi-tenant platform operator - the role the
platform-scoped surfaces admit (the cart campaign store, the injected refund
route, the payment / invoice / fiscal admin consoles) - is `superAdmin` +
`saasAdmin` only. A role item named `admin` is refused
(`RBAC_ROLE_NAME_RESERVED`), and so is `admin` in any `checkRoles` /
`absoluteRoles` or other session-role list (`MULTI_TENANT_ADMIN_ROLE_REFERENCE`).

**`user` is not available in multi-tenant projects either**: the end
users are `tenantUser` (a tenant member, the default role of a new user) and
`saasUser` (a platform-level user). Every role-write door refuses `user`
(`400 ROLE_NOT_DEFINED`), a role item named or valued `user` is refused
(`RBAC_ROLE_NAME_RESERVED`), and so is `user` in a session-role list
(`MULTI_TENANT_USER_ROLE_REFERENCE`).
Name a tenant-level administrator differently (for example `storeAdmin`), or use
the built-in `tenantAdmin`. See [RBAC](../system-services/authentication/rbac.md).

**Only `superAdmin` / `saasAdmin` can grant a SaaS-level role.** `saasAdmin`
and `saasUser` are granted (by `PATCH /userrole/:userId`, the admin
`createUser`, or `create<Tenant>UserOnSaas`) only by a `superAdmin` or
`saasAdmin` caller; a `tenantOwner` / `tenantAdmin` naming one is refused with
`400 SAAS_ROLE_GRANT_FORBIDDEN`, even though `saasUser` ranks below them.
A SaaS-level role reads across tenants - `saasUser` passes the gate of the
SaaS-level `get<Tenant>Account` / `list<Tenant>sAccounts` pair - so a
tenant-level principal must never be able to mint one. See
[Users](../system-services/authentication/users.md).

Key rules:

1. A user can hold **different roles in different tenants**.
2. Authorization checks always run against the **current tenant context**.
3. SaaS-level users cannot reach tenant-private data unless explicitly
   granted.
4. Business APIs inherit the tenant context from the session token - no
   per-call wiring needed.

Tenant-specific permission profiles (feature flags, premium tiers, beta
rollouts) layer on through `tenantBasedPermissionsIsActive` in
[`PermissionTypes`](../../spec/PermissionTypes.md) plus custom tenant
fields - see [PBAC](../system-services/authentication/pbac.md).

### Moderated objects in a multi-tenant project

An object with [`objectModeration`](object-moderation.md) keeps its
moderation inside the tenant structure:

- its `sys_<X>ModerationReview` table is tenant-level exactly when the object
  is, so a staged submission is confined to the tenant its content belongs to;
- `reviewerRoles` left empty means the multi-tenant platform operator,
  `superAdmin` + `saasAdmin` (`admin` in a reviewer list is respelled to
  `saasAdmin`); name a tenant-level role there (for example `tenantAdmin`) for
  a per-tenant review queue;
- the `onPlace` read gate's privilege follows the TARGET object's tenancy:
  `tenantOwner` reads unapproved rows only on a read that pins a tenant-level
  object's tenant column (its own apis, a fetch / stats / parent action's own
  tenant pin), never because the READING api is tenant-scoped. Through a
  select join, a joint or membership filter, a static join or embedded
  DataView rows it sees accepted rows plus its own, like any other role.

See
[Object content moderation - the onPlace read gate](object-moderation.md#the-onplace-read-gate).

## Business APIs in multi-tenant mode

Every API is **explicitly declared** in `businessLogic[]` - there is no
auto-CRUD, in single- or multi-tenant projects alike. Tenancy does not add
hidden endpoints; it scopes the ones you declare. When an API operates on a
tenant-level object:

- `whereClause` filters automatically include `<tenantName>Id = currentTenantId`.
- Create/update actions automatically attach the current tenant id.
- `ValidationAction`, membership checks, and object authorization all run
  within the tenant boundary.

In [MScript](../mscript/overview.md) the context exposes:

```js
this.session.<tenantName>Id   // e.g. this.session.workspaceId
this.session.tenantCodename   // GENERIC -- there is no session.<tenantName>Codename

this.<tenantName>Id           // manager slots: e.g. this.workspaceId
this._<tenantName>Id
this._tenantId                // the generic manager alias for the same id
this.<tenantName>Codename     // derived from session.tenantCodename
```

**The pair is asymmetric, and on purpose.** The tenant ID rides the session
under the name YOU gave the tenant, because that is the column the auth user
carries; the tenant CODENAME rides it under the generic `tenantCodename`,
because the session builder stamps that one itself. So:

- there is no generic `this.session.tenantId` -- it is never stamped, it reads
  `undefined` on every request, and the validator reports it as
  `SESSION_FIELD_UNKNOWN` naming the field you meant;
- there is no project-named `this.session.<tenantName>Codename` either, for
  the mirror-image reason, and the validator reports that one too.

On the MANAGER (`this.`, not `this.session.`) both spellings exist: a
multi-tenant service manager declares `this.<tenantName>Id`,
`this._<tenantName>Id`, `this.root<TenantName>Id` and
`this.<tenantName>Codename`, plus the generic aliases `this._tenantId` and
`this._tenantCodename`. The project-named codename is a read-only alias that
DERIVES from `session.tenantCodename`; it is never written twice. A plain
`this.tenantId` is declared on no manager at all - the api manager deliberately
leaves `userId` / `tenantId` / `userRole` free so a like-named data column can
own them - and reading it draws `MSCRIPT_UNDECLARED_REFERENCE`.

### Binding a column to the session tenant

A property populated from the session declares
`sessionSettings.sessionParam`, and the name it gives is the SESSION field,
so on a multi-tenant project it is `<tenantName>Id`:

```json
{ "basicSettings": { "name": "workspaceScopeKey", "isRequired": true },
  "sessionSettings": { "sessionParam": "workspaceId" } }
```

Writing `"tenantId"` there is reported at design time as
`SESSION_PARAM_UNKNOWN`, naming the field this project really carries: the
generated data clause reads the string verbatim, so the column would be
written `null` on every request. Note that tenant-level objects get their
`<tenantName>Id` column stamped automatically; `sessionParam` is for the EXTRA
session-bound columns you declare yourself.

Use these only for SaaS-level objects or cross-tenant logic; tenant-level
objects are already filtered for you.

## BFF and DataViews in multi-tenant mode

A DataView is NOT partitioned per tenant by itself. A stored view's
Elasticsearch index holds the documents of every tenant, each carrying the
tenant column (added to the view's projection automatically when the main
object is tenant-level). Isolation is applied when the view is READ,
by whoever reads it:

- **A consuming BusinessApi** (`apiOptions.dataViewName`) - the api's compiled
  where clause carries the tenant term, on the stored read (as the
  Elasticsearch filter) and on a dynamic view's read-time read (on the
  database), exactly as for an unbound api. The tenant is selected per request
  the usual way (header, `?_workspace=`, body), and the api's `apiInSaasLevel`
  decides whether the term applies.
- **Custom code** (`LIB.dataViews.<view>(filter?, opts?)`) - code serving a
  caller uses the SCOPED form: `LIB.dataViews.productsView(filter, { session:
  this.session })`, or `{ scoped: true }` for the tenant of the api request the
  code runs in. It pins the read to the caller's tenant on the view's tenant
  column and reads active rows only, the terms the consuming api applies; a
  caller with no tenant reads nothing, and `{ scoped: true }` outside an api
  request is refused. Without either option the call is a SYSTEM read with
  the trust level of the db-layer functions: every tenant's rows.

Aggregates and stats join by key inside one main record, so they carry what
their keys reach; they do not add a tenant term of their own. There is no
per-view read route: the BFF builds views, the
services' apis read them.

## Frontend responsibilities

The backend does the isolation, but the **frontend must select the tenant**
on every tenant-level call. Supply the codename via any of the resolution
mechanisms:

```js
// 1. Header (recommended for programmatic clients)
headers["mbx-workspace-codename"] = currentTenantCodename;

// 2. Query parameter
//    ?_workspace=acme

// 3. Body parameter
//    { "_workspace": "acme" }
```

If nothing is supplied, the call is treated as `root`.

### Selecting the tenant from the URL

A typical SaaS frontend derives the codename from the host or path:

```
https://acme.myproduct.com   → tenant codename = acme
https://www.myproduct.com    → tenant codename = root
```

When subdomains aren't available, a path indicator works too:

```
https://app.myproduct.com/t/acme/dashboard → tenant codename = acme
```

The frontend extracts the codename and attaches it to every API call.

### Realtime connections

Socket connections also need the tenant. Pass `tenantCodename` in the
Socket.IO `auth` payload (not `extraHeaders`, which browsers can't send over
the WebSocket transport):

```js
const socket = io(`${base}/chat-api/hub/room`, {
  auth: { token: `Bearer ${jwt}`, tenantCodename: "acme" }
});
```

See [Realtime hub - Multi-tenant connection](realtime.md#multi-tenant-connection).

## Tokens and cookies

Frontends should prefer **bearer tokens** for clarity and portability:

```
Authorization: Bearer <tenantSpecificToken>
```

The generated service also sets a session cookie (`<projectCodename>-access-token`)
for browser flows; bearer tokens are recommended for cross-environment work.

## SaaS-level operations

The `root` tenant is where the platform owner operates:

- managing other tenants (create / suspend / configure),
- global analytics across tenants (where the role permits),
- creating administrators,
- configuring subscription / payment models,
- license renewal and quotas.

SaaS business APIs use RBAC/PBAC rules tied to the SaaS roles; SaaS BFF
DataViews pull SaaS-level data only.

## See also

- [Authentication - Multi-tenancy](../system-services/authentication/multi-tenancy.md)
- [Data modeling - Multi-tenancy](../data-modeling/multi-tenancy.md)
- [Access tokens](../system-services/authentication/access-tokens.md) - token naming.
- [Membership](../composition/membership.md) - the per-record sharing dimension.
- [Realtime hub](realtime.md) - multi-tenant socket connections.
- Specification: [`LoginDefTenantSettings`](../../spec/LoginDefTenantSettings.md),
  [`LoginDefTenantSettingsConfig`](../../spec/LoginDefTenantSettingsConfig.md),
  [`ObjectSettings`](../../spec/ObjectSettings.md),
  [`ObjectAuthorization`](../../spec/ObjectAuthorization.md).
