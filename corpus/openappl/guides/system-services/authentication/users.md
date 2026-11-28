---
title: Users
---

# Users

When the `auth` service is created, a default `user` data object is included in its
definition. Once the auth service is active you can reference `user` from anywhere in other
services (they point at it via `userId`).

The `user` object carries **system-defined properties**, some mandatory, some conditional,
and you can add **custom properties** the same way you design any other data object.

## System-owned `user` properties

The compiler generates these on every `user` (some are described in the schema, others are
part of the auth service's internal design). The defaults listed under `userProperties` in
[`ProjectAuthentication`](../../../spec/ProjectAuthentication.md) are `email`, `password`,
`fullname`, `name`, `surname`, `mobile`, `emailVerified`, `mobileVerified`, `roleId`, plus
the standards `id`, `isActive`, `createdAt`, `updatedAt`.

### `id`

A `UUID` for each user. Other objects reference the user as `userId` (e.g. the session
exposes `userId`).

### `email`

The user's email address.

- When `primaryLoginIdentifier` is `'email'` (the default), email is the primary login
  username and is always required.
- When `primaryLoginIdentifier` is `'mobile'`, email presence depends on
  `secondaryIdentifierPresence` (`'none'`, `'optional'`, `'required'`).
- When `primaryLoginIdentifier` is `'emailOrMobile'`, email is always present and usable for
  login.

Also used for communication, notifications, and verification flows.

### `password`

Hashed and salted with a one-way algorithm; never stored in plain text.

### `emailVerified`

Whether the email has been verified. The field always exists. To require email verification
before login:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": { "emailVerificationRequiredForLogin": true }
    }
  }
}
```

With this set, login with an unverified email fails with a 403 problem+json body carrying the
key `errMsg_EmailNotVerified`: in `errorCode` on targets that resolve the key to a human
sentence (`detail` then holds the sentence), in `detail` with a generic
`errorCode: "FORBIDDEN"` on the others (see [Login](./login.md) for both shapes); the
frontend then runs the email verification flow (see [Verification
services](./verification-services.md)).

A social login raises the flag only from the provider's own verification signal, never
because the provider returned an address (the per-provider rule is in [Social
logins](./social-logins.md#when-a-social-login-marks-the-email-verified)). The session
carries the value the user row had at login: a verification completed later updates the row
at once and the session at the next login.

### Naming properties

User names are stored either as a single full name or as a name/surname pair, configured via
`userNameType` (enum `UserNameType`: `"asFullname"` or `"asNamePair"`).

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": { "userNameType": "asFullname" }
    }
  }
}
```

- **`name`**: first (and middle) name in a name pair.
- **`surname`**: family name in a name pair.
- **`fullname`**: full name in the full-name model.

With the name/surname model, the session also auto-generates a `fullname` field by combining
the two.

### `avatar`

A URL to the user's avatar image. The column holds only the URL; the image itself goes to the
auth service's `userAvatars` database bucket (5 MB, public read, any logged-in user may
upload), and the client stores the upload's `downloadUrl` as `avatar`. Auto-generation uses
the `userAutoAvatarScript` field of
[`LoginDefUserSettings`](../../../spec/LoginDefUserSettings.md), an
[MScript](../../mscript/overview.md) expression returning a URL. The schema default:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "userAutoAvatarScript": { "js": "`https://gravatar.com/avatar/${LIB.common.md5(this.email ?? 'nullValue')}?s=200&d=identicon`" }
      }
    }
  }
}
```

### `roleId`

Stores the user's assigned role(s) when RBAC is enabled (toggle via
`AccessControl.roleSettings.rbacIsActive`; see [RBAC](./rbac.md)).

- Role values are stored as type **`Any`** (`RoleItem.value` is `Any`), so you may use
  strings (`"admin"`) or numbers (`1`).
- When `usersHaveMultipleRoles` is enabled, `roleId` is an array: the user column is a String
  array (at most 255 characters per element), the login session carries the same array in
  `session.roleId`, `PATCH /userrole/:userId` accepts a string or a list, and
  `listUsersByRole` matches by membership. See [RBAC](./rbac.md#multiple-roles-per-user) for
  the gate semantics and the migration note.

`roleId` is **always** attached to every user, even when RBAC is not explicitly activated, so
the system-level role model stays consistent.

A role must be declared; role names are case-insensitive and stored canonically. Every door
that writes a caller-supplied `roleId` (`PATCH /userrole/:userId`, the admin `createUser`, and
on a multi-tenant project `create<Tenant>UserOnSaas`) accepts only a system role of the
project's tenancy (`superAdmin`, `admin`, `user` on a single-tenant project; `superAdmin`,
`saasAdmin`, `tenantOwner`, `tenantAdmin`, `tenantUser`, `saasUser` on a multi-tenant one,
which has no role named `admin` and none named `user`) or, with RBAC active, a `roleItems`
value. Anything else (an unknown string, a `customRoleLookups` name: a lookup role is derived
at login, never assigned) is refused with `400` and the message `ROLE_NOT_DEFINED`. The match
ignores case, the way every role gate compares roles, and the row stores the declared
spelling: `SAASADMIN` is stored as `saasAdmin`, and it is ranked as `saasAdmin` too, so it can
only be granted by a caller that outranks it. A grant (or an admin create) must name a role
strictly below the caller's own.

When users have multiple roles (`usersHaveMultipleRoles`), `roleId` on these doors is a role
list, and an **empty list is refused** with `400 ROLE_LIST_EMPTY` whoever the caller is:
`PATCH /userrole/:userId { "roleId": [] }` would strip every role the user holds, which is
not a role change. To change a user's roles, send the new non-empty list. The status is
`400`, so no `absoluteRoles` holder skips the check. An admin create that sends no `roleId`
at all still gets the column default. The machine-to-machine role-write door (below) refuses
the empty list with the same code.

On a multi-tenant project the SaaS-level roles `saasAdmin` and `saasUser` can be granted
**only by a `superAdmin` or `saasAdmin` caller**, on every one of those doors, whatever the
rank order says. The rank order alone would let a `tenantOwner` or `tenantAdmin` grant
`saasUser` (it ranks below them), and `saasUser` passes the gate of the SaaS-level
`get<Tenant>Account` / `list<Tenant>sAccounts` pair, which reads across every tenant. A
tenant-level caller naming a SaaS-level role (in any case, or anywhere in a role list) is
refused with `400` and the message `SAAS_ROLE_GRANT_FORBIDDEN`; the status is `400` so that no
`absoluteRoles` holder (tenantAdmin, tenantOwner) can skip the check. A `saasAdmin` may grant
`saasUser`; a `superAdmin` may grant either. Single-tenant projects have no SaaS-level role
and are unaffected.

**A multi-tenant project has no role named `user`.** Its end users are `tenantUser` (a member
of a tenant, the default role of a new user) or `saasUser` (a platform-level user); the
single-tenant `user` does not exist there, exactly as `admin` does not. Every door above
refuses `user` with `400 ROLE_NOT_DEFINED` on a multi-tenant project, a role item named or
valued `user` is refused at design time (`RBAC_ROLE_NAME_RESERVED`), and so is a `user` entry
in a `checkRoles` / `absoluteRoles` or other session-role list
(`MULTI_TENANT_USER_ROLE_REFERENCE`): no one can hold that role there, so such a gate would
admit nobody. Use `tenantUser` for an ordinary tenant member.

**Roles are not badges.** A role is an authorization boundary; a label a user earns (premium,
gold, verified seller) is a *badge*. Model a badge as an ordinary data object with its own
apis and gate features on it, instead of changing the user's role: a "premium user" is a
`user` (or `tenantUser`) holding a premium badge. Turning every entitlement into a role change
turns every purchase into a privilege change.

The doors above are the only writers of `roleId` a caller can reach. A custom auth api
(`authentication.businessLogic`) that creates or updates the `user` object with a `roleId`
entry in its `dataClauseItems`, a create / update crud action onto `user` that sets `roleId`,
or a bulk create of `user` rows is refused at design time with the error
`AUTH_USER_ROLE_WRITE_UNGUARDED`, and a forced build cannot skip it: such a write would bypass
every check above. Call `updateUserRole` or `createUser` instead.

The one exception is a **machine-to-machine role change**: the rare case where an operation
really must change a role (a purchase, an approval), run by a service rather than by a person.
A custom auth api is that door when it is a create / update on `user`, declares
`authOptions.requiredCallerKind: "machineWithoutUserIdentity"` (with `M2MAllowed: true`, and
`loginRequired` left on), and writes `roleId` through its own `dataClauseItems`:

```json
{
  "basics": {
    "apiOptions": { "name": "applyPurchasedRole", "crudType": "update", "dataObjectName": "user" },
    "authOptions": { "loginRequired": true, "M2MAllowed": true, "requiredCallerKind": "machineWithoutUserIdentity" }
  },
  "parameters": { "requestParameters": [
    { "name": "userId", "type": "ID", "required": true, "httpLocation": "urlpath" },
    { "name": "grantedRole", "type": "String", "required": true, "httpLocation": "body" }
  ] },
  "controllers": { "restSettings": { "routePath": "/purchasedrole/:userId", "hasRestController": true } },
  "query": {
    "dataClauseItems": [{ "name": "roleId", "value": { "js": "this.grantedRole" } }],
    "whereClause": { "fullWhereClause": { "js": "{ id: this.userId }" } }
  }
}
```

No user session reaches it: an interactive user is refused `403 M2M_CALLER_REQUIRED`, and an
end-user identity forwarded on a service hop is refused
`403 M2M_CALLER_WITHOUT_USER_IDENTITY_REQUIRED` (which is why the weaker `machine` kind, which
admits that hop, does not open the door). Call it from a service with a machine token and no
forwarded user: an `InterserviceCallAction` without `forwardCallerToken`, a webhook or payment
lifecycle hook, a cron job. The generated service guards the door at runtime as well: a caller
whose session carries a user identity is refused `400 M2M_CALLER_WITHOUT_USER_IDENTITY_REQUIRED`
(the same rule, spelled so it holds on every target language and no `absoluteRoles` holder
skips it), the role must be a declared role (`400 ROLE_NOT_DEFINED`), it must not be an
administrator role (`superAdmin`, `saasAdmin`, `admin`, `tenantOwner`, `tenantAdmin`:
`400 ADMINISTRATOR_ROLE_NOT_ASSIGNABLE`) nor a SaaS-level role (`saasAdmin`, `saasUser`:
`400 SAAS_ROLE_GRANT_FORBIDDEN`) and, when users have multiple roles, the written list must not
be empty (`400 ROLE_LIST_EMPTY`: an empty list would strip every role the user holds). The row
stores the declared spelling. Both role refusals ignore case and separators, so a declared role
item valued `SAAS_USER` or `Tenant-Admin` is refused as well, in both tenancies.

Why `saasUser` is refused: a `saasUser` passes the gate of the SaaS-level `get<Tenant>Account`
/ `list<Tenant>sAccounts` pair, a cross-tenant read, so the built-in doors let only a SaaS
operator (`superAdmin`, `saasAdmin`) grant a SaaS-level role. A machine caller holds no role,
so there is no granter to check: the machine-to-machine door refuses the class outright. Grant
`saasUser` through `updateUserRole` / `createUser` as a SaaS operator.

The checks read the value the write will persist (the built data clause), so they hold
whatever MScript the `roleId` item evaluates. A crud action onto `user` and a bulk create are
never this door, whatever caller kind their api declares.

The admin password reset (`changePasswordByAdmin` / `updateUserPasswordByAdmin`) of a
multi-tenant project also keeps a lower-privileged caller away from a `superAdmin`,
`saasAdmin`, `tenantOwner` or `tenantAdmin` account; it reads the target's role
case-insensitively, like every other role check.

The admin password reset never targets the caller's own account: it skips the old-password
check, so it answers `400 UseChangePasswordForYourOwnPassword` (before the role-rank check,
which would otherwise refuse it as `AHigherUserRoleCantBeChanged`). Rotate your own password,
the bootstrap super admin's included, through `changePassword` with the old password.

A password change ends the sessions the old password minted: `changePassword` retires every
other session of the caller (the session that made the change keeps working),
`changePasswordByAdmin` retires every session of the target, and a completed password reset
retires every session of the account. A token minted before the rotation answers `401`
everywhere, a refresh token issued before it no longer redeems, the `userSession` rows of the
retired sessions read `loggedOut: true`, and a login with the new password mints a fresh
session. The change doors retire before they write, so a retire that fails answers an error
with nothing written. A tenant-level admin may omit the tenant codename header: the retire then
runs in the admin's own session tenant, like the rest of the call; naming another tenant is
refused `404`.

A role change (`updateUserRole`) and an operator reset of a user's login second factor
(`updateUser2FAEnrolment`) retire every session of the target the same way: the new role
applies at once, and the sessions on a lost handset end with its enrolment.

### `mobile` (conditional)

The user's mobile number, stored in **E.164 format** (e.g. `+905551234567`). The service
normalizes numbers to E.164 (`+`, country code, subscriber number; no spaces or dashes) before
storing. The field is present when:

- `primaryLoginIdentifier` is `'mobile'`, or
- `primaryLoginIdentifier` is `'emailOrMobile'`, or
- `primaryLoginIdentifier` is `'email'` and `secondaryIdentifierPresence` is `'optional'` or
  `'required'`.

When `primaryLoginIdentifier` is `'email'` and `secondaryIdentifierPresence` is `'none'` (the
default), `mobile` is not in the model.

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "primaryLoginIdentifier": "mobile",
        "secondaryIdentifierPresence": "optional"
      }
    }
  }
}
```

### `mobileVerified` (conditional)

Whether the mobile number has been verified. Present only when `mobile` exists. To require
mobile verification for login:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": { "mobileVerificationRequiredForLogin": true }
    }
  }
}
```

The corresponding flow is configured under `verificationServices.mobileVerification`.

## The tenant-ID property (multi-tenant apps)

In multi-tenant projects, users belong to a tenant and **login-identifier uniqueness is
tenant-scoped** (email when email is primary, mobile when mobile is primary, or both for dual
identifiers).

The tenant-ID field name follows your tenant naming setting: `clientId` when the tenant is
named `"client"`, `storeId` when named `"store"`.

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

When active, the compiler makes the `user` object tenant-scoped and adds the tenant-ID field to
other tenant-aware objects. See [Multi-tenancy](./multi-tenancy.md).

## Custom `user` properties

Add custom properties via `ProjectAuthentication.userProperties` (an array of
[`DataProperty`](../../../spec/DataProperty.md)), as long as names do not collide with system
fields:

```json
{
  "authentication": {
    "userProperties": [
      {
        "basicSettings": {
          "name": "sex",
          "type": "Enum",
          "isArray": false,
          "description": "The sex value of the user.",
          "isRequired": true,
          "allowUpdate": true,
          "autoIncrement": false,
          "hashed": false,
          "enumOptions": ["male", "female"],
          "defaultValue": "male"
        },
        "indexSettings": {
          "indexedInElastic": true,
          "indexedInDb": false,
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

These columns are created on the `user` table in every database engine the compiler supports
for the auth service.

### Keeping a property off the built-in user APIs

Every custom property is otherwise a body parameter AND a write target of
the built-in user APIs, so a column the system maintains (a moderation
flag, a lifecycle flag such as `staffProvisioningPending`, a balance) could
be set by whoever calls them. Two lists under
`loginDefinition.userSettings` narrow that surface; both name custom
properties only (a name not declared in `userProperties`, or a built-in
column, is a design-time error):

| List | Create doors | Update doors |
|---|---|---|
| `registrationExcludedUserProperties` | dropped from the public register family (`register`, `registerUser`, `register<Tenant>Owner`, `register<Tenant>User`); the admin creates keep it | unchanged |
| `systemManagedUserProperties` | dropped from EVERY create door: the register family and `createUser`, `create<Tenant>OwnerOnSaas`, `create<Tenant>UserOnSaas` | `updateUser` and `updateProfile` refuse a body that carries it with 400 |

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "systemManagedUserProperties": ["staffProvisioningPending"]
      }
    }
  }
}
```

A system-managed property takes its `defaultValue` on every built-in
create and is written only by the project's own APIs
(`authentication.businessLogic`), CRUD actions and that default. The
update refusal is `400` with the message
`SystemManagedUserPropertiesCantBeUpdated: <names>` for every caller,
absolute roles included (an update is never silently narrowed); a body
that leaves the property out, or sends it as `null`, is accepted.

- A system-managed property declared `isRequired` with no `defaultValue`
  or `defaultFn`, and no create API of the project's own writing it,
  could never be created: `SYSTEM_MANAGED_USER_PROPERTY_UNCREATABLE`.
  Give it a default, declare `isRequired: false`, or declare the create
  API that writes it.
- The login gate (`loginBlockedProperty`) cannot be system-managed
  (`SYSTEM_MANAGED_USER_PROPERTY_IS_LOGIN_GATE`): `updateUser` is the door
  that invalidates a blocked user's cached sessions, so it must keep
  writing that column. Remove it from the list.
- Listing a property in BOTH lists is reported as INFO
  (`SYSTEM_MANAGED_USER_PROPERTY_ALSO_REGISTRATION_EXCLUDED`): the
  system-managed list already closes the register doors, so remove the
  registration entry.

## Public profiles: showing a user to other users

`GET /users/:userId` (`getUser`) is **owner/admin only by design**: it returns the full user
row, so it answers "show me my own record", never "show me who wrote this post". The
sanctioned way to show one user's identity to another is the profile surface, declared in
`ProjectAuthentication.profileSettings`:

```json
{
  "authentication": {
    "profileSettings": {
      "hasPublicProfile": true,
      "loginRequired": true,
      "publicFields": ["title", "bio"]
    }
  }
}
```

The compiler then generates **`GET /userprofiles/:userId`** in the auth service. It serves the
user object's display identity (`fullname`, or the `name` + `surname` pair when the project
splits the name, plus `avatar`) and the properties named in `publicFields`. The columns are
projected **at the query**, so no other column of the user row is read. The response carries
`_type: "user"`: `_type` is ALWAYS the API's `dataObjectName` and there is no per-API override,
so a projection of the user record still names `user`; the discriminator says which resource
this is, not which subset of it you received.

Independent decisions, all defaulted so that a project which declares nothing still works:

| Field | Default | Meaning |
|-------|---------|---------|
| `hasPublicProfile` | `true` | Whether the route exists at all. `false` emits no route: users cannot see each other. |
| `loginRequired` | `true` | The audience. `true` = any logged-in user of the project. `false` = anonymous callers, the deliberate widening for public-facing pages. |
| `publicFields` | `[]` | Extra properties to serve. |

Anonymous is not the default on purpose: an anonymous profile route makes the whole user base
enumerable by walking userIds, and names and avatars are personal data. Widening is an
explicit act.

`publicFields` may only name the project's own **custom** user properties (the section above).
Two design-time errors keep the surface honest:

- naming a property that does not exist, or a built-in column rather than a custom one, fails
  validation;
- naming a confidential column (email, mobile, password-derived columns, verification/2FA
  flags, role or tenant columns, session and login bookkeeping, or any property declared
  `hashed`/`isSecret`) is refused outright, whatever the blueprint says.

There is deliberately **no list of profiles**: a public list would make the user set
enumerable, so profiles are readable one id at a time.

This is the **only** identity surface: no other auth API answers another user's name and
avatar, and there is no `getBriefUser` / `GET /briefuser/:userId`. A custom auth API declared
under `authentication.businessLogic` may not use the name `getBriefUser`: it is refused at
design time (`AUTH_API_NAME_RETIRED`) with a pointer to this section.

**Richer profiles** (cover images, social links, follower counts, per-profile privacy rules)
are not modelled here. Create a separate profile data object in a business service, linked by
`userId`, and give it its own APIs; the auth profile stays the identity surface.

## Super admin account

At first deploy, the compiler seeds a **Super Admin** row in the `user` table. The role is
`superAdmin`; it is never tenant-scoped, and it has absolute authority over the framework's
own **system** APIs: this auth service, and the system admin endpoints the framework injects
into the project's other services. It is absolute over the Business APIs **you** design too:
every login-required api is GENERATED with `superAdmin` as an absolute role (automatic on every
api regardless of plane), emitted into the generated service rather than written into your
blueprint, so it cannot be forgotten. It is joined there by `tenantOwner`, but only where the
tenant filter is in force (a tenant-scoped api, never a SaaS-level one). What either bypasses
is authorization only, never tenant isolation. See [`superAdmin` is
automatic](./business-api-auth.md#superadmin-and-tenantowner-are-automatic-hierarchy-still-is-not).
Credentials live in `LoginDefUserSettings`:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "superAdminIdentifier": "owner@their-company.com",
        "superAdminPassword": "<random-per-project-value>"
      }
    }
  }
}
```

- **Both values are stamped for you at project creation by the hosting platform**
  (`superAdminIdentifier` is set to the **project owner's own identifier**: the email, or on a
  mobile-primary project the mobile, of the user who created the project;
  `superAdminPassword` is a **random per-project value**). Neither is a cosmetic invention like
  `admin@<project>.com` / `superadmin`, and neither should be replaced by one: an address
  nobody can receive mail at cannot complete a password reset, and it can collide with a real
  user the project later registers. A blueprint authored outside a hosting platform carries
  values chosen by its author.
- When `primaryLoginIdentifier` is `"mobile"`, the identifier must be an E.164 number (e.g.
  `"+905551234567"`). If the creating credential carried no identifier of the right shape, the
  schema default is kept (`"admin@admin.com"` / `"+10000000001"`).
- When the secondary identifier is required (`secondaryIdentifierPresence` is `"required"`, or
  `dualIdentifierRegistration` is `"both"`), the seed row is filled with placeholders to
  satisfy the NOT NULL constraint: `"noreply@system.local"` for email, `"+10000000000"` for
  mobile. Replace these after first login.

### Automatic correction for mobile-primary projects

When `primaryLoginIdentifier` is `"mobile"` and `superAdminIdentifier` is still the default
`"admin@admin.com"`, the compiler **automatically replaces** it with `"+10000000001"` during
configuration validation. This prevents a broken first login: the login lookup only queries the
`mobile` column when mobile is primary, so an email stored there would never match.

If a custom email (anything other than `"admin@admin.com"`) is given as
`superAdminIdentifier` while `primaryLoginIdentifier` is `"mobile"`, validation raises an
**error** and requires a proper E.164 number.

### First login after deployment

`POST /login` accepts a `username` field. **The lookup always runs against the
primary-identifier column only**: `email` when email is primary, `mobile` when mobile is
primary, or auto-detected from input format when `emailOrMobile`. Passing an email as
`username` while mobile is primary matches no user, even if that user has an email stored.

The `superAdminIdentifier` is normally the project owner's own address, so that is the
`username` to log in with. The column it is matched against, and the fallback used when the
creating credential carried no usable identifier, depend on the primary identifier:

| `primaryLoginIdentifier` | Fallback `superAdminIdentifier` | Matched against |
|---|---|---|
| `"email"` (default) | `"admin@admin.com"` | `email` |
| `"mobile"` | Auto-corrected to `"+10000000001"` | `mobile` |
| `"emailOrMobile"` | `"admin@admin.com"` | `email` (preferred in dual mode) |

The password is whatever the blueprint's `superAdminPassword` holds. It must hold a real
value: an absent, blank or redacted-placeholder (`****`, `sk-p****`) password is the validation
**error** `SUPERADMIN_PASSWORD_MISSING`. Without it every build would seed the well-known
schema default `superadmin`, in every environment. A whole-blueprint import that drops the
field (an export whose secrets were redacted) is refused for the same reason; put a strong
destination value into the imported blueprint, then rebuild the auth service and recreate the
seed row.

### The seed is a bootstrap credential, in every environment

The blueprint pair is seeded into the project database in **every** deployment mode
(development, test, staging and production alike), so a freshly deployed project always comes
up with a working administrator, with no manual credential injection step.

What differs per deployment mode is not whether the pair is seeded but what a login **with it**
can do:

| Deployment mode | Login with the unrotated seed password |
|---|---|
| development / test | Full access. The seed is the working test credential by design. |
| staging / production | **Rotation only.** Every other authenticated route answers `403` with `errorCode: PASSWORD_CHANGE_REQUIRED`; only the self-service password APIs (`changePassword` / `updateUserPassword`), `logout`, `currentUser` and `relogin` are reachable. |

So the seed can be used to **take ownership of the account** and nothing else. That is also why
the value stays readable in the blueprint rather than being redacted: it is the only credential
that exists before anyone has logged in, so the owner has to be able to read it back.

The limit is **derived at login**, by comparing the submitted password against the seed, not
stored as a flag set at deploy time. That matters because the super-admin credentials can also
be changed from **outside** the application: a database admin tool writes the project database
directly. Rotate the password anywhere (the app's own flow or such a tool) and the next login
is unrestricted; put the seed value back and the limit re-arms.

### Seeded once, then the database owns it

The super-admin row is written on the **first** start that finds it missing, and **never
refreshed** afterwards. Every value on it, identifier included, is seed-once.

That is what makes runtime database edits authoritative: an identifier changed in a database
admin tool, and a password rotated through the application, both survive every restart. The
corollary is that editing `superAdminIdentifier` or `superAdminPassword` in the blueprint has
**no effect on a project whose database already holds the row**. Change those at runtime
instead; the blueprint values only matter to a deployment whose database is still empty.

### Prefilling custom data for super admin

`superAdminData` (an array of `DataMapItem`) prefills custom user properties for the seed row.
Each `value` is an [MScript](../../mscript/overview.md) expression:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "superAdminData": [
          { "name": "age", "value": { "js": "25" } },
          { "name": "instagramName", "value": { "js": "`myProjectOfficial`" } }
        ]
      }
    }
  }
}
```

If a required custom property has no value, the compiler uses the field's default value when
defined, otherwise leaves it null (only if nulls are allowed).

## User registration

Registration can be public or restricted:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": { "userRegisterIsPublic": true }
    }
  }
}
```

- `userRegisterIsPublic: true` (the default): the auth service emits the public
  self-registration API `register` (`POST /register`, alias `registerUser` at
  `POST /registeruser`), reachable without an access token.
- `userRegisterIsPublic: false`: no self-registration route is emitted; users are created by an
  admin through `createUser` (`POST /users`), which always requires an admin-level session.

## Rules on the built-in user APIs (`builtInApiChecks`)

The auth service generates the user APIs itself (`createUser`, `updateUser`, `updateUserRole`, `register`,
`updateProfile`, `deleteUser` and the others). Their action set is fixed, and a custom API of the same name is
refused (`AUTH_API_NAME_SHADOWED`). To add a business rule to one of them, attach a `ValidationAction` to it
through `authentication.builtInApiChecks`. Each entry names the built-in API, one step of its workflow and the
validation. The validation runs after the built-in actions of that step:

```json
{
  "authentication": {
    "userProperties": [
      { "basicSettings": { "name": "staffProvisioningPending", "type": "Boolean", "isRequired": true,
                           "defaultValue": false } }
    ],
    "builtInApiChecks": [
      {
        "apiName": "createUser",
        "workflowStep": "afterCheckParameters",
        "validation": {
          "name": "refuseProvisioningMarkOnCreate",
          "description": "Only the provisioning flow sets the mark; an admin create never does.",
          "validationScript": { "js": "this.staffProvisioningPending !== true" },
          "shouldBeTrue": true,
          "errorMessage": "staffProvisioningPendingNotWritable",
          "errorStatus": "400"
        }
      }
    ]
  }
}
```

With this entry an admin who sends `{ "staffProvisioningPending": true }` to `POST /users` gets
`400 staffProvisioningPendingNotWritable`.

- **Status.** A check whose `errorStatus` is `401` or `403` is skipped for the `absoluteRoles` of the API (the admin
  roles on `createUser`), like any 401/403 validation. Any other status (`400`, `409`, `422`) refuses those callers
  too, including a `superAdmin`. Validation warns on a 401/403 check
  (`BUILTIN_API_CHECK_SKIPPED_FOR_ABSOLUTE_ROLES`).
- **What the script reads.** The script runs inside the built-in API, so `this.<name>` reads what that API binds:
  its request parameters (on `createUser` the user fields, the custom `userProperties` included), the context its
  actions publish, `this.session`, and on an update API the stored row once it is fetched (`this.user` from
  `afterFetchInstance` on). A name the API does not bind is refused (`BUILTIN_API_CHECK_UNKNOWN_REFERENCE`); on
  `updateUser` `roleId` is not a parameter (`updateUserRole` writes it), so read `this.user.roleId` there.
- **Validation.** An `apiName` the auth service does not build under the current settings is
  `BUILTIN_API_UNKNOWN` (for example `register` while `userRegisterIsPublic` is false); a `workflowStep` that is not
  a step of the API's crud type is `BUILTIN_API_CHECK_STEP_INVALID`; a `validation.name` that is already an action
  of the API, or of an earlier check on it, is `BUILTIN_API_CHECK_NAME_COLLISION`.
- **Alias twins.** A check on `register` also lands on its legacy alias `registerUser` (and the same for the other
  alias pairs): the two are one API under two names.
- **One API per check.** A check attaches to the API it names. A rule that must hold on EVERY path that writes the
  user (`createUser`, `updateUser`, `updateUserRole`, the tenant user creation of a multi-tenant project, custom auth
  APIs) is a property rule instead: a "required for these roles" rule is a
  [`requirementCheck`](../../data-modeling/property-types.md#conditional-requiredness-requirementcheck) on the
  property, which holds on every create and update.

Only the built-in auth APIs take a check: a custom auth API declares its validations in its own
`actions.validationActions`.

## Self-archive (`archiveProfile`)

The auth service ships a self-delete door, `archiveProfile` (`DELETE /archiveprofile/:userId`):
a signed-in user archives their OWN account (ownership-checked; the superAdmin account is
refused). A project that runs its own account-deletion flow (for example a `deleteMyAccount`
api that first checks unpaid earnings or pending refunds in other services) can turn the
built-in door off or restrict it, so a direct caller cannot skip those checks:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": { "selfArchive": "disabled" }
    }
  }
}
```

- `selfArchive: enabled` (the default): unchanged; every signed-in user may archive their own
  account.
- `selfArchive: adminOnly`: the route stays, but only the admin roles of the user-management
  gate (`deleteUser`'s: `superAdmin` / `admin`, or `superAdmin` / `tenantAdmin` on a
  multi-tenant project) may call it, still on their own account; any other caller gets
  **403**.
- `selfArchive: disabled`: `archiveProfile` is not generated at all: the route answers **404**,
  it is no MCP tool, and the generated API documentation does not mention it. The name
  `archiveProfile` is then free for a custom auth api.

In every mode an admin archives any account through `deleteUser` (`DELETE /users/:userId`).

## Archived identifiers

Archiving a user (`archiveProfile` where emitted, `deleteUser`) keeps the row, inactive. Two
user settings decide how long its login identifier (email or mobile) stays reserved:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "archivedIdentifierReuse": "afterDays",
        "archivedIdentifierHoldDays": 30
      }
    }
  }
}
```

- `archivedIdentifierReuse: afterDays` (the default): the identifier is reserved for
  `archivedIdentifierHoldDays` days after the archive (a positive integer, default 30). Inside
  the window `register`, `registerUser`, `createUser`, the tenant user doors and the social
  registration answer 400 `YourProfileIsArchivedAskAnAdminToRestore`
  (`ThisProfileIsArchivedAskAnAdminToRestore` on the admin create). After it, the registration
  creates a new account with a new id; the archived account stays archived.
- `archivedIdentifierReuse: never`: the identifier stays reserved for as long as the archived
  account exists. Only an admin's `restoreUser` (`PATCH /users/:userId/restore`) brings it
  back. A hold-days value other than the default beside `never` is ignored, and validation
  warns (`ARCHIVED_IDENTIFIER_HOLD_DAYS_IGNORED`).

## See also

- [Login](./login.md): identifier model, password login, verification and 2FA.
- [User groups](./user-groups.md): grouping users for permissions.
- [Multi-tenancy](./multi-tenancy.md): the tenant-ID property and tenant scoping.
- Spec: [`LoginDefUserSettings`](../../../spec/LoginDefUserSettings.md),
  [`ProfileSettings`](../../../spec/ProfileSettings.md),
  [`DataProperty`](../../../spec/DataProperty.md).
