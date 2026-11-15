---
title: Multi-tenancy (auth slice)
---

# Multi-tenancy (auth slice)

OpenAPPL supports both **single-tenant** and **multi-tenant** architectures. Multi-tenancy
lets multiple organizations, clients, or workspaces share one system while keeping data and
permissions isolated.

This page covers the **authentication / data slice**: how tenants are defined, registered,
and scoped on the auth side. For the cross-cutting guide (how the tenant ID rides every
request, what to make tenant-scoped, and end-to-end patterns) see
[Multi-tenancy](../../capabilities/multi-tenancy.md) in the capabilities guides. The
data-modeling view lives at [Data modeling: Multi-tenancy](../../data-modeling/multi-tenancy.md).

Tenant settings are configured via
[`LoginDefTenantSettings`](../../../spec/LoginDefTenantSettings.md) under
`loginDefinition.tenantSettings`.

## Enabling multi-tenant mode

```json
{
  "authentication": {
    "loginDefinition": {
      "tenantSettings": {
        "useMultiTenantFeature": true,
        "configuration": { "tenantName": "client" }
      }
    }
  }
}
```

- Projects are single-tenant by default; `tenantSettings` can be omitted.
- When `useMultiTenantFeature` is `true`, the compiler treats users, data, and permissions as
  **tenant-scoped by default**.

## Defining the tenant concept

[`LoginDefTenantSettingsConfig`](../../../spec/LoginDefTenantSettingsConfig.md)`.tenantName`
labels the tenant concept:

```json
{
  "authentication": {
    "loginDefinition": {
      "tenantSettings": {
        "useMultiTenantFeature": true,
        "configuration": { "tenantName": "client" }
      }
    }
  }
}
```

`tenantName` is used to:

- Name the tenant data object (e.g. `client` or `store`).
- Generate related property names (e.g. `clientId`, `storeId`) across user and domain
  objects.
- Influence naming in the generated code.

It is **required whenever `useMultiTenantFeature` is on**. A value that is absent, blank,
whitespace-only or not a string is refused at design time with `AUTH_TENANT_NAME_REQUIRED`,
because there is nothing left to name the tenant model, its table or the `<tenantName>Id`
column every tenant-scoped object carries: the project would emit a tenant id column on the
auth user that nothing seeds or stamps, and no tenant column at all on your own objects. For
a single-tenant project turn `useMultiTenantFeature` off instead; `tenantName` is then
ignored and may stay `null`.

Surrounding whitespace is trimmed, so a padded `"  store  "` is `store` and emits `Store` /
`storeId` exactly as `"store"` does.

The generated tenant object carries `name`, `codename` (unique, server-minted from `name`),
`fullname`, `avatar` and `ownerId`. `ownerId` is session-bound: it is stamped by the
framework from the caller's own session on the doors that have one, and by the
owner-provisioning flow described below on the doors that create the owner in the same
request. It is never a request parameter, so no caller can set another user as the owner of
a tenant.

## Tenant registration rules

`LoginDefTenantSettingsConfig` also controls whether tenants can be created publicly or only
by SaaS-level admins:

```json
{
  "authentication": {
    "loginDefinition": {
      "tenantSettings": {
        "useMultiTenantFeature": true,
        "configuration": {
          "tenantName": "client",
          "tenantRegisterIsPublic": true
        }
      }
    }
  }
}
```

- `tenantRegisterIsPublic: true`: any authenticated user can create a tenant (they become the
  owner).
- `tenantRegisterIsPublic: false`: only SaaS-level admins can create tenants.

## Tenant name uniqueness and replayed registrations

By default two tenants may share a `name`, and one person may own several tenants. That is
deliberate: both are ordinary product shapes. The consequence is that
`register<Tenant>Owner` will happily provision a second tenant for a repeated call: the
tenant's `codename` is unique but it is server-minted with a counter suffix (`acme`, then
`acme1`), so it can never collide and therefore never refuses anything.

Set `uniqueTenantName: true` when the tenant name is a real identity in your product:

```json
{
  "authentication": {
    "loginDefinition": {
      "tenantSettings": {
        "useMultiTenantFeature": true,
        "configuration": {
          "tenantName": "client",
          "tenantRegisterIsPublic": true,
          "uniqueTenantName": true
        }
      }
    }
  }
}
```

With it on:

- the tenant object's `name` PROPERTY becomes unique, which emits one unique database index
  on that column (partial on `isActive`), so two concurrent registrations resolve to one
  winner and one `409`: a constraint, not a read-then-write probe both callers could pass;
- `register<Tenant>Owner` and `create<Tenant>OwnerOnSaas` check the name BEFORE they write
  anything, so an ordinary replay is refused with `<Tenant>NameAlreadyRegistered` and no user
  row is left behind;
- a soft-deleted tenant frees its name again.

The refusal names the tenant name and never an identity, so it cannot be used to probe
whether an email is registered.

The rule compares names EXACTLY. `Acme`, `acme` and `Acme ` are three different tenant names
to it, and so are two names differing only in interior whitespace. If your product needs
case-insensitive tenant names, normalise the name before it reaches the API; the index does
not do it for you.

Independently of the knob, both owner-provisioning APIs honour the `api-idempotency-key`
header: send one and a retry or a double submit answers the ORIGINAL response (the same user
id and the same tenant id) instead of provisioning a second tenant. Sending no key keeps the
previous behaviour.

## What the owner-registration APIs write, and in what order

`register<Tenant>Owner` and `create<Tenant>OwnerOnSaas` are the two doors that provision a
user and a tenant in one request. A workflow is [not a
transaction](../../workflow/overview.md): every write commits on its own and nothing is
rolled back for you, so the order of the writes IS the guarantee, and these two doors are
ordered for it:

| stage | write | if it fails |
|---|---|---|
| `afterCheckBasicAuth` | create the tenant | nothing has been written yet: the caller gets the refusal and no rows exist |
| main operation | create the user, already carrying `roleId: "tenantOwner"` and the tenant foreign key | see the note below |
| `afterMainCreateOperation` | stamp the tenant's `ownerId` | the user and the tenant are deleted in reverse order and the call answers `500 <Tenant>OwnerRegistrationRolledBack` |

Two consequences worth knowing when you design around these doors:

- **The user is born inside the new tenant.** It is not created at SaaS level and moved
  afterwards. So `uniqueEmailForTenant` is evaluated against a tenant that was created
  moments ago and holds no rows, which means the same email can own more than one tenant,
  and, deliberately, that a public registration never answers differently for an email that
  already exists somewhere else, so the public endpoint cannot be used to enumerate users.
- **One window is not covered, by design.** The main create is the framework's own operation,
  not an action, so a failure there aborts the request before any compensating action can run
  and the tenant created a moment earlier is left behind. By the point above that failure is
  an infrastructure failure rather than a validation one; closing it would need a database
  transaction spanning the whole workflow, which the framework does not have. If your product
  needs that guarantee, reconcile ownerless tenants out of band.

The compensating deletes are SOFT deletes, like every other delete in the framework: the rows
are marked inactive rather than removed, and, because the uniqueness index is scoped to
active rows, the tenant name is released for the next attempt.

You cannot express this uniqueness by redeclaring the tenant `name` under `tenantProperties`.
Every built-in tenant column (`name`, `codename`, `fullname`, `avatar`, `ownerId`) and every
framework column (`id`, `isActive`, `createdAt`, `updatedAt`) is reserved there, and a
colliding declaration is refused at design time with `AUTH_TENANT_PROPERTY_NAME_RESERVED`.

That comparison **ignores case**, and so does the duplicate check within the list: `Name` is
the built-in `name`, and `displayName` beside `displayname` is one property declared twice. A
differently-cased spelling is not a different column: the database index name is the column
name snake_cased and lower-cased, so the two would emit *one* index name, a name-keyed index
sync would create only the first, and a `unique` declared on the second would silently not
exist. Two names that merely project onto one index name without being case variants
(`ownerId` and `owner_id`) are refused for the same reason, with
`AUTH_TENANT_PROPERTY_INDEX_NAME_COLLISION`. The user list (`userProperties`) follows both
rules identically.

`uniqueTenantName` is the knob that stamps `indexSettings.unique` on the built-in `name` for
you; a tenant identity that is a pair of columns is expressed with `compositeIndexSettings`,
below.

## A tenant identity that is a PAIR of columns

A `compositeIndexSettings` list on `tenantSettings.configuration` is forwarded onto the
tenant object, for a tenant identity that is a pair of columns rather than a single name:

```json
{
  "authentication": {
    "loginDefinition": {
      "tenantSettings": {
        "useMultiTenantFeature": true,
        "configuration": {
          "tenantName": "client",
          "compositeIndexSettings": [
            {
              "indexName": "uniqueClientNamePerOwner",
              "indexFields": ["name", "ownerId"],
              "onDuplicate": "throwError"
            }
          ]
        }
      }
    }
  }
}
```

Each entry takes the same `{ indexName, indexFields, onDuplicate }` shape a DataObject's
`compositeIndexSettings` takes, and `indexFields` may name a built-in tenant column (`name`,
`codename`, `fullname`, `avatar`, `ownerId`), one of your own `tenantProperties`, or a
framework column every object carries (`id`, `isActive`, `createdAt`, `updatedAt`,
`_archivedAt`).

A name that is none of those is **refused at design time** with `PROPERTY_NOT_FOUND`, naming
the column and listing the ones you could have used: the same refusal, with the same code and
message, that a DataObject's `compositeIndexSettings` gives for a column its object does not
declare. Without it the index would reach the database sync at bootstrap over a column that
does not exist, on a blueprint that reported nothing at design time.

This list is the TENANT OBJECT's own, and it is closed because the tenant object carries no
injected tenant column: its own `id` IS the tenant id. On an ordinary tenant-level
**DataObject** the list is open by one more name: the injected `<tenantName>Id` column, which
`indexFields` may name like any other. See "Where you may NAME the injected tenant column"
below; there is no need to declare a second column to index a tenant-scoped uniqueness rule
on.

Two more rules, which the project validator warns about rather than refusing:

- **MULTI-COLUMN ONLY.** A composite index is named after its FIELDS, so a single-field entry
  collides with the plain index that column already has, and the unique constraint is then
  never created in the database. Express single-column uniqueness through that property's
  `indexSettings.unique` (or `uniqueTenantName` for the tenant name).
- **A composite covering `name` SUPERSEDES `uniqueTenantName`.** A property already covered by
  a composite index does not also get its own unique index, so the shipped rule is the pair,
  not the single-name rule. Keep one of the two.

## Tenant auto-avatar script

`tenantAutoAvatarScript` is an [MScript](../../mscript/overview.md) expression that generates
tenant avatar URLs:

```json
{
  "authentication": {
    "loginDefinition": {
      "tenantSettings": {
        "useMultiTenantFeature": true,
        "configuration": {
          "tenantName": "client",
          "tenantAutoAvatarScript": { "js": "`https://gravatar.com/avatar/${LIB.common.md5(this.fullname)}?s=200&d=identicon`" }
        }
      }
    }
  }
}
```

## Custom tenant properties

Add tenant properties via `ProjectAuthentication.tenantProperties` (an array of
[`DataProperty`](../../../spec/DataProperty.md)):

```json
{
  "authentication": {
    "tenantProperties": [
      {
        "basicSettings": {
          "name": "subscriptionLevel",
          "type": "Enum",
          "isArray": false,
          "description": "The subscription level of the tenant (e.g., Free, Pro, Enterprise).",
          "isRequired": true,
          "allowUpdate": true,
          "autoIncrement": false,
          "hashed": false,
          "isFilterParameter": true,
          "enumOptions": ["Free", "Pro", "Enterprise"],
          "defaultValue": "Free"
        },
        "indexSettings": {
          "indexedInElastic": true,
          "indexedInDb": true,
          "unique": false,
          "clusterInRedis": false,
          "cacheSelect": false,
          "isSecondaryKey": false,
          "fulltextSearch": false
        }
      }
    ]
  }
}
```

Tenant custom fields follow the standard DataProperty pattern and can be filtered, indexed,
or related like any other domain field. The name must be your own: the built-in columns
(`name`, `codename`, `fullname`, `avatar`, `ownerId`) and the framework columns (`id`,
`isActive`, `createdAt`, `updatedAt`) are reserved, and a colliding declaration is refused at
design time with `AUTH_TENANT_PROPERTY_NAME_RESERVED` naming the standard field it collides
with. Uniqueness on the tenant name is `uniqueTenantName`; uniqueness on a pair of columns is
`compositeIndexSettings`.

## Reading and updating another tenant (SaaS operators)

The tenant-level `get<Tenant>`, `update<Tenant>` and `get<Tenant>Profile` reach only the
caller's OWN tenant row, for every role including `superAdmin`. Platform-wide access to the
tenant rows goes through the declared SaaS-level APIs (`apiInSaasLevel: true`), never through
a role skipping that pin:

| API | Route | Who |
|---|---|---|
| `list<Tenant>s` | `GET /<tenant>s` | `superAdmin`, `saasAdmin` |
| `list<Tenant>sAccounts` | `GET /<tenant>saccounts` | `superAdmin`, `saasAdmin`, `saasUser` |
| `get<Tenant>Account` | `GET /<tenant>account/:<tenant>Id` | `superAdmin`, `saasAdmin`, `saasUser` |
| `update<Tenant>Account` | `PATCH /<tenant>account/:<tenant>Id` | `superAdmin`, `saasAdmin` |
| `delete<Tenant>` | `DELETE /<plural tenant>/:<tenant>Id` | `superAdmin`, `saasAdmin` |

For a tenant named `company` the routes read `/companys`, `/companysaccounts`,
`/companyaccount/:companyId` and `/companies/:companyId`.

`update<Tenant>Account` writes a FIXED profile allowlist of the addressed tenant: `fullname`
and `avatar`. It never writes the id, the `codename` (the tenant's identity: the tenant
header, the home route and every session key are keyed by it), the `name` the codename is
minted from, the owner, `isActive` or a custom tenant property; such keys in the body are
ignored. Every call raises the `<service>-<tenant>-updated` api event with the operator as
the actor and the prior row, which is the audit trail. A tenant owner or admin is refused
(403) even for their own tenant: they use `update<Tenant>`. Not every target language
generates this api yet.

## Tenant-level authorization

Multi-tenancy scopes data by tenant ID automatically, but you can go further and define
**tenant-specific permission profiles** using `tenantBasedPermissionsIsActive` in
[`PermissionTypes`](../../../spec/PermissionTypes.md) (see [PBAC](./pbac.md)) and, if needed,
custom permission / object models.

Conceptually this allows:

- Certain tenants to have **premium features** enabled.
- Beta features rolled out to specific tenants.
- Tenant-specific access constraints for complex SaaS offerings.

Such feature-flag-like behavior can be modeled with:

- Custom tenant properties (like `subscriptionLevel`).
- PBAC / ABAC rules keyed by tenant ID or subscription fields.
- Tenant-based permission logic via `tenantBasedPermissionsIsActive`.

## Where you may NAME the injected tenant column

Every tenant-scoped object (`objectDataIsInTenantLevel: true`, in a project whose
`useMultiTenantFeature` is on) carries a real `<tenantName>Id` column: the framework writes it
on every insert from the caller's session and every read returns it. It is not in the
object's `properties[]`, so the design-time `Available (authored properties):` list does not
mention it; that list is the authored half, not the allowlist.

Every design-time check reads the tenancy the same way the build does: `useMultiTenantFeature`
may be `true` or the string `"true"`, and the tenant name is `configuration.tenantName`,
trimmed. So service validation, the build gate and project validation all agree on whether an
object carries the column, also for a project saved with the string spelling.

You MAY name it wherever the surface only **reads** the row or **narrows** a query:
`compositeIndexSettings.indexFields`, `viewBasics.properties`,
`selectClause.selectProperties`, `searchObjectAction.searchProperties`,
`listSearchFilter.searchProperties`, `listMembershipFilter.objectKeyIdField`,
`membershipSettings`' object / user / role / status bindings, the `fetchObjectAction` /
`fetchStatsAction` / `fetchParentAction` keys, properties and `bucketBy`,
`staticJoin.jointRead` and `staticJoin.jointForeignKey`, the fiscal party bindings, the
marketplace seller-onboarding bindings, and `enterpriseProjection.fieldMap[].property`.
Naming it there can never widen what a caller sees: the tenant filter is conjoined onto the
query (`$and` on the database, a `bool.filter` beside the authored `bool.must` on the search
index), so an authored term on the tenant column only narrows further.

A few surfaces refuse it, and they say why rather than reporting it as missing; the code is
`FRAMEWORK_COLUMN_NOT_ADDRESSABLE_HERE`:

| surface | why |
|---|---|
| `propertyRelation.relationTargetKey` | becomes the association key, which must identify ONE row of the target; the tenant column is indexed but not unique. |
| `staticJoin.jointSourceKey` | becomes a single-row `get<Source>By<Key>` lookup, so the join would match an arbitrary row of the tenant named by a caller-supplied foreign key. |
| `invoicing`'s own-object, line and `invoiceForeignKey` bindings | one of them is written back onto the row (`statusProperty`), and the key bindings select which line rows the invoice snapshots; every row of a tenant answers to the tenant column. |
| `ledgerSettings`' owner and balance bindings | the ledger WRITES its balance columns on every movement and ADDRESSES the owner row by `ownerKeyProperty`. |
| `geoSettings.visibilityFilter` | it maps a column to a STATIC literal, so this would pin every geo query to one hard-coded tenant id. Tenant scoping is never authored, and it is never needed here: the framework pins the /geo quartet of a tenant-level object to the caller's session tenant itself, merged AFTER this filter so an authored key on the tenant column cannot override it. A tenant-level object's geo routes therefore require a session whatever `dataObjectAccess` says. |

The tenant ROOT object (the tenant entity itself) carries no injected column at all (its own
`id` IS the tenant id), so a name that is not one of its columns really is
`PROPERTY_NOT_FOUND` there.

### Do not mirror the column

Because these surfaces behaved differently in earlier releases, a common workaround was to
declare a SECOND column, stamp it from the session tenant
(`sessionSettings.sessionParam: "<tenantName>Id"`), and index or project on that instead. That
workaround is now redundant, and the project validator says so with a `TENANT_MIRROR_COLUMN`
warning naming both columns.

It is a warning and not a refusal (the mirror is a legal column and a blueprint carrying one
still builds), but it is worth acting on: the row then carries the tenant discriminator twice,
often under two spellings and two types, and whichever of the two a composite index is built
on is the one every future uniqueness question gets answered against. Delete the mirror and
name `<tenantName>Id` directly at every site that read it: its composite indexes, its DataView
projections and joins, and any `removeFromResponseActions` that existed only to strip it from
a public response.

## See also

- [Multi-tenancy](../../capabilities/multi-tenancy.md): the cross-cutting guide.
- [Data modeling: Multi-tenancy](../../data-modeling/multi-tenancy.md): the data-modeling
  view.
- [Users](./users.md): the tenant-ID property on `user`.
- [User groups](./user-groups.md): tenant-level vs global groups.
- Spec: [`LoginDefTenantSettings`](../../../spec/LoginDefTenantSettings.md),
  [`LoginDefTenantSettingsConfig`](../../../spec/LoginDefTenantSettingsConfig.md).
