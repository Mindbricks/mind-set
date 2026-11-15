# Auth module authoring — core procedure

Harness-agnostic. Every step names the blueprint path it reads or edits. Extracted
from the Ada corpus (#4400); provenance and translation notes in
`../README.md`. This guide is the authentication-module counterpart of
`blueprint-authoring.md` — read that first; everything it says about tool
semantics (section 3), the authoring loop (section 9), MScript descriptors,
and result discipline applies here unchanged. This guide covers only what is
DIFFERENT about the auth module.

**Task shape.** You are given the project's `auth-spec` (the design document
`design/auth-spec.md`, written in the design phase) and the current blueprint state. You
configure the `authentication` module in the blueprint, validate it clean, and
prove completeness against the spec.

**Lifecycle position: Phase 2** (`project-lifecycle.md`). Auth is authored
AND BUILT before any domain service is started — domain authoring reads the
live user/tenant/role shapes, and those exist only after auth is written.
Skip the phase entirely when `project-basic-setup` sets
`hasAuthentication: false`.

## 1. What the module is — do NOT design a custom auth service

The compiler generates a complete `auth` microservice from the
`authentication` module: user management, login/logout, verification flows,
RBAC/PBAC access control, and optionally multi-tenancy. **Configure the
module — never reinvent it as a domain service.** No `userAccount` data
object, no `login` BusinessApi in a domain service, ever.

### Structural map — how it differs from the generic service shape

The module lives at the project-root path `authentication` (NOT under
`services/`), and its chapters are auth-specific — there is no
`serviceSettings`/`dataObjects`-first shape here. Top-level pattern
`ProjectAuthentication`:

| Blueprint path | Pattern | What it holds |
|---|---|---|
| `authentication/authenticationEssentials` | `AuthBasics` | JWT / SSO / API-key / cookie settings, refresh tokens, `documentation` |
| `authentication/loginDefinition/userSettings` | `LoginDefUserSettings` | login identifier, name type, verification-required flags, public-register flag, super-admin fields (framework-stamped — see below) |
| `authentication/loginDefinition/tenantSettings` | `LoginDefTenantSettings` | `useMultiTenantFeature` + `configuration` (`tenantName`, `tenantRegisterIsPublic`, ...) |
| `authentication/verificationServices/<block>` | `EmailVerification` etc. | `emailVerification`, `mobileVerification`, `passwordResetByEmail`, `passwordResetByMobile`, `email2Factor`, `mobile2Factor` — each an activation block (`<x>IsActive` + `configuration`) |
| `authentication/accessControl/roleSettings` | `RBACSettings` | `rbacIsActive` + `configuration.roleItems[]` — the CUSTOM role list |
| `authentication/socialLogins/<provider>` | per-provider setting (LEGACY location) | still read, but do not author new social logins here: they go to `projectSettings/socialLoginProvidersSettings` (step 4) |
| `authentication/userProperties` | `DataProperty[]` | custom user fields beyond the defaults — an ARRAY chapter |
| `authentication/tenantProperties` | `DataProperty[]` | custom tenant fields — multi-tenant only |
| `authentication/businessLogic/<ApiName>` | `BusinessApi` | custom APIs added to the auth service (rare) — the generic procedure applies |

The generated service builds under the system service name **`auth`**.

## 2. Resolve design decisions (checklist, from `auth-spec`)

Answer ALL of these before writing anything. The spec is a SOURCE, not law
(`blueprint-authoring.md` section 2): resolve spec errors by designing what
is right and recording the deviation in your report and the handoff.

- **A. Multi-tenancy** — strict rule: multi-tenant means each
  organization's data is isolated from all others (SaaS platforms,
  white-label tools). Marketplaces ("sellers and buyers", shared catalog),
  consumer apps, and personal apps are NOT multi-tenant — users from
  different groups interacting with shared data is single-tenant.
  - **A user belongs to exactly ONE tenant. This is not a limitation to
    design around — it is what isolation MEANS.** A person who works in two
    tenants registers twice, with the same email if they like; those are two
    accounts that happen to share an address, and nothing links them.
    "Switching" is signing in to the other one. A shared user row spanning
    tenants would be a join between two tenants that are supposed to be
    unable to see each other.
  - So NEVER design around it: no per-tenant membership table as the
    authorization source of truth, no "the session's roleId is the role in
    the ACTIVE tenant", no tenant-switch endpoint, no cross-tenant identity
    link. A design that needs those has either mis-chosen the tenant or is
    not multi-tenant at all.
  - **Choosing the tenant: it is the outermost thing, and isolation lives
    there.** If the unit you called the tenant has something ABOVE it that
    owns several of them, that unit is a division inside a tenant, not a
    tenant — and the project is probably single-tenant with an ordinary
    owning entity. Name the tenant so that nothing above it needs to see
    across.
- **B. Login identifier** — `email` (default) | `mobile` | `emailOrMobile`.
- **C. User name type** — `asFullname` (default) | `asNamePair`.
  `asNamePair` AUTO-CREATES `name` + `surname` as standard user fields.
  When the spec asks for any variant of a two-part personal name
  (first/last, given/family, forename/surname, firstName/lastName), the
  correct action is `userNameType: asNamePair` and NOTHING in
  `userProperties` — adding `firstName`/`lastName`/`givenName`/... as
  custom properties gives the user record four fields for two concepts.
  The OpenAPPL naming for first/last name is `name` + `surname`, period;
  the spec's prose wording does not change the column names.
- **D. Custom roles** — only roles BEYOND the built-in system set.
  Single-tenant built-ins: `superAdmin`, `admin`, `user`. Multi-tenant:
  SaaS-level `superAdmin` / `saasAdmin` / `saasUser`, tenant-level
  `tenantOwner` / `tenantAdmin` / `tenantUser`. Never redefine built-ins.
  - **`admin` is not available in multi-tenant projects; use `superAdmin` /
    `saasAdmin`** (#5701). The multi-tenant platform operator is those two
    only. A role item named (or valued) `admin` is RBAC_ROLE_NAME_RESERVED, and
    `admin` in any `checkRoles` / `absoluteRoles` / other session-role list is
    MULTI_TENANT_ADMIN_ROLE_REFERENCE (ERROR). A tenant-level administrator is
    the built-in `tenantAdmin` or a differently named role (`storeAdmin`).
  - **`user` is not available in multi-tenant projects either; use
    `tenantUser` / `saasUser`** (#5886). Every role-write door refuses it
    (400 ROLE_NOT_DEFINED), a role item named or valued `user` is
    RBAC_ROLE_NAME_RESERVED, and `user` in a session-role list is
    MULTI_TENANT_USER_ROLE_REFERENCE (ERROR).
  - **The ORDINARY member role is ALWAYS the built-in one** — `user`
    single-tenant, `tenantUser` multi-tenant — however that member arrives.
    Public signup, an emailed invitation, an admin creating the account by
    hand: the route in does not change the tier. The built-in ladder already
    spells the tiers out (`tenantOwner` owns the tenant, `tenantAdmin`
    administers it, `tenantUser` works in it), so a project that needs a
    tier BELOW admin needs `tenantUser`, not a new role. Registration can
    only auto-assign a built-in; everything else requires a grant.
  - A domain word for that member (`customer`, `founder`, `patient`,
    `member`, `student`, `recruiter`, `agent`, ...) is descriptive, NOT a
    custom role — map it to the built-in.
  - A domain word becomes a real custom role ONLY when an explicit
    admin-approval gate stands between the person and a CAPABILITY: KYC,
    document verification, application acceptance. "Sellers register but
    activate after admin review" → `seller` IS a role; "founders register
    and immediately compete" → `founder` is just `user`.
    **An invitation is not that gate.** Being invited is how membership is
    created, not an approval of a capability after review — every
    multi-tenant product invites its members, so "only an admin can invite
    them" justifies no role at all.
  - **Two tests before you accept a custom role.** (1) Remove it, put the
    person on the built-in tier, and re-read every API's `checkRoles`: if no
    permission changes, it is not a role. (2) Look at what it costs: a
    custom role that forces a NEW role-assignment API onto auth — above all
    an `M2MAllowed` or `apiInSaasLevel` write on `user` — is the signal
    that the role is wrong. Re-run test (1) before accepting that API,
    because punching a role-write hole in identity is a permanent cost paid
    for a naming preference.
  - **Roles are not badges** (#5883). A label a user earns (premium, gold,
    verified seller) is a BADGE: an ordinary data object with its own apis
    (a userBadge pattern is planned), never a role change. An authored auth
    api or crud action that writes the user's roleId is
    AUTH_USER_ROLE_WRITE_UNGUARDED (non-bypassable). The one exception is a
    real role change after an operation, run by a service: a create / update
    api on `user` declaring requiredCallerKind "machineWithoutUserIdentity"
    (plus M2MAllowed true, loginRequired left on) that writes roleId in its
    own dataClauseItems. The framework then refuses a caller carrying a user
    identity and stores only a declared role, never an administrator role
    (400 ADMINISTRATOR_ROLE_NOT_ASSIGNABLE), never a SaaS-level role
    saasAdmin / saasUser (400 SAAS_ROLE_GRANT_FORBIDDEN: a machine caller is
    no SaaS operator) and never an empty role list under multiple roles
    (400 ROLE_LIST_EMPTY). Prefer the badge.
- **E. Social logins** — only providers explicitly required.
- **F/G. Email / mobile verification** — enable only when the product
  needs it; decide whether it is required for login
  (`emailVerificationRequiredForLogin` / `mobileVerificationRequiredForLogin`
  on `userSettings`).
- **H. Super-admin bootstrap ownership** — preserve the destination's
  creation-stamped configuration; import and authorized new-destination
  setup require the section-4 procedure.
- **I/J. Custom user / tenant properties** — ONLY fields beyond the
  defaults below.
- **K. Custom BusinessApis** on the auth service — only when the spec
  describes auth-layer operations no existing pattern covers (rare). The
  FRAMEWORK auth APIs (login, logout, register, currentuser, the
  `/api/auth/verify/*` flows) ship with their own pre-baked access pattern
  — never author `authOptions` gates for them, and never re-describe them
  as custom APIs; section K is strictly for genuinely new auth-layer
  operations.

### Defaults — never redeclare these

User object (always present): `id`, `isActive`, `createdAt`, `updatedAt`,
`roleId`, `avatar`, `email`, `emailVerified`, `password`, `fullname` OR
`name`+`surname`, `mobile`, `mobileVerified`, the tenant-id field.
Tenant object (when multi-tenancy is on): `id`, `name`, `codename`,
`fullname`, `avatar`, `ownerId`, `isActive`, `createdAt`, `updatedAt`.

The validator rejects verbatim collisions with reserved names
(`AUTH_USER_PROPERTY_NAME_RESERVED`); semantic duplicates (`firstName`,
`tenantName`, `displayName`, `organizationName` for the tenant's primary
label) slip past it but are still wrong by design — the validator not
catching them is not permission. Custom properties are for fields beyond
the standard shape: `department`, `bio`, `country`, `ccEmail`, ...

## 3. Write order (sharded — one section per write)

Scaffold-then-fill: derive the write list from your decisions first, then
execute it. After every write run `mind-set validate blueprint.json` and
resolve every error (`blueprint-authoring.md` section 3). Sections whose
current value already matches the spec need no write: plan against the
actual state (read `authentication` in `blueprint.json` once; the module
subtree is small enough to read whole).

Most auth writes touch EXISTING populated sections, so the workhorse here
is a **partial merge** (omitted keys survive; an explicit `null` clears
the key it names), unlike domain services, where whole new named items
dominate. Write a complete value for chapters you replace wholesale
(`userProperties`) and for new named items (`businessLogic/<ApiName>`).

1. **`authentication/loginDefinition/userSettings`**: merge in only the
   fields you change: `primaryLoginIdentifier`,
   `userNameType`, verification-required flags, `userRegisterIsPublic`.
2. **`authentication/loginDefinition/tenantSettings`** — multi-tenant:
   `{ useMultiTenantFeature: true, configuration: { tenantName,
   tenantRegisterIsPublic, ... } }`. To disable:
   `{ useMultiTenantFeature: false, configuration: null }`.
3. **`authentication/accessControl/roleSettings`** — custom roles only:
   `{ rbacIsActive: true, configuration: { roleItems: [{ name, value },
   ...] } }`. Built-ins are managed by the framework — never list them.
   `configuration.usersHaveMultipleRoles: true` makes `user.roleId` (and
   `session.roleId`) a String ARRAY: grants take `roleId: [...]`, role gates
   pass on ANY held role, and membership filters use the array operator
   (`{ roleId: { $overlap: ['staff'] } }`); off, `roleId` is a single string.
   Decide it BEFORE the first auth build — flipping it on a project that
   already has user rows is a manual column retype (the boot reconcile
   refuses scalar<->array), documented in the framework's rbac page. The
   `[].concat(this.session?.roleId ?? []).includes(role)` idiom reads both.
4. **`projectSettings/socialLoginProvidersSettings`** — social login is a
   provider family, written OUTSIDE this module: ONE entry per required
   brand in `socialLoginProviders`, e.g.
   `{ name: "google", provider: "google", configuration: { clientId,
   clientSecret }, emailVerification: "providerSignal" }` (apple:
   `clientId` = the Services ID, `teamId`, `keyId`, `privateKey`;
   microsoft: optional `tenant`). `openappl/spec/SocialLoginProviderConfig.md`
   describes the configuration; the compiler checks the exact key set of each
   brand. There is no enable flag:
   an entry in the list is active. A second entry of the same brand is a
   validation ERROR; a different client per environment is an environment
   value of the one entry, not a second entry. Placeholder credential VALUES
   are acceptable only as named env-style placeholders (`"GOOGLE_CLIENT_ID"`);
   real secrets are entered by the user on the hosting platform, never
   authored into the blueprint; missing credentials do not fail validation
   (the login route answers a typed 503 until they are set).
   The older `authentication/socialLogins` block (`use<X>Login` +
   `configuration`) still works and validation marks each enabled brand
   there with the INFO `SOCIAL_LOGIN_LEGACY_LOCATION`. Do not add a brand
   to both places (the provider entry wins, WARNING
   `SOCIAL_LOGIN_PROVIDER_SHADOWS_LEGACY`); moving an existing project's
   legacy entries is the user's call; when the user asks for it, move each
   brand in one edit (add the provider entry, drop the legacy brand) so no
   brand ever sits in both sections.
5. **`authentication/verificationServices/<block>`** — the activation
   block plus a `VerificationConfig`. **`verificationTemplate` is the ONE
   REQUIRED key of that config** (`resendTimeWindow`, `expireTimeWindow`
   and `verificationType` are all optional with defaults 60 / 86400 /
   `byCode`), so a `configuration` written without it fails validation:

   ```json
   "emailVerification": {
     "emailVerificationIsActive": true,
     "configuration": {
       "verificationType": "byCode",
       "resendTimeWindow": 60,
       "expireTimeWindow": 86400,
       "verificationTemplate": "<ejs source — see below>"
     }
   }
   ```

   The template is EJS source rendered with the verification data (the user
   object included); the variables the framework binds are `secretCode`,
   `codeIndex`, `userId`, `expireTime` and `verificationType`. Do not invent
   one from scratch: read the pattern's own default in
   `openappl/spec/VerificationConfig.md` / `openappl/spec/EmailVerification.md`
   (and their `openappl.json` entries) and adapt it; it
   already branches on `verificationType` and renders the expiry in human
   units. Same shape family for `mobileVerification` (a plain-text template,
   not HTML) and the password-reset / 2FA blocks.

   **Activating email verification without an email send channel is a
   silent failure.** Verification mail
   goes out through a `kind: "email"` entry of
   `projectSettings/notificationProvidersSettings`; with no such entry (or
   with one whose credentials are still blank) the framework routes every
   verification mail at its built-in mock SMTP endpoint — **reporting SUCCESS
   where that sink host is provisioned (no error anywhere, and no code ever
   reaches a user) and failing the send LOUDLY where it is not** (SMTP
   connect timeouts, retries, `failed` delivery rows that read like an
   outage). Neither is delivery. Before turning `emailVerificationIsActive`
   on, confirm that entry exists; if Phase 1 did not create one, say so in
   the report rather than shipping a login flow nobody can complete.
6. **`authentication/userProperties`**: write the
   COMPLETE array (an array chapter is the complete set — a partial array
   drops the missing members). Each item is a `DataProperty` in the same
   shape as domain-service properties (`basicSettings`, optional
   activation blocks); Enum properties set `basicSettings.enumOptions`
   directly.
7. **`authentication/tenantProperties`** — same, multi-tenant only.
8. **`authentication/businessLogic/<ApiName>`** — one bundled write per
   API at its named-item path, exactly per `blueprint-authoring.md`
   sections 4-7 (explicit-mode arrays, milestones, validation gotchas all
   apply).

## 4. Destination bootstrap ownership, imports and recovery

The blueprint carries the destination project's bootstrap pair at
`authentication/loginDefinition/userSettings.superAdminIdentifier` and
`.superAdminPassword`. Set both once, when the blueprint is created (keep an
explicit identifier the owner chose; generate a password when none is given);
later edits must leave them in place.

**Ordinary authoring uses narrow merges** that omit bootstrap fields.
Omission preserves them only if they already exist and are not explicitly
nulled. A full `authentication`, `loginDefinition`, userSettings section or
root replacement can remove the destination pair. The server does not
automatically preserve it during an import. A missing, blank or
redacted-placeholder password is the validation ERROR
`SUPERADMIN_PASSWORD_MISSING` (#6759): root, `loginDefinition` and
`userSettings` replacements that drop it are refused. An `authentication`
replacement may persist with that validation error; strict auth build
refuses the invalid blueprint, including an already-stored gap. Without it the
build would seed the public schema default `superadmin`; only a password
present in the blueprint is a credential the owner holds.

For a sanctioned import:

1. Take the normal restore point and current version. Sanitize the source
   design so it contains no source bootstrap pair or provider secrets.
2. Prefer narrow destination merges that leave bootstrap fields untouched.
   If replacement is required, an authorized private destination-only
   process must read the destination pair narrowly, retain it in the final
   replacement payload and write it in one edit. Keep those values
   out of transcripts, briefs, generic args files and tracked artifacts.
3. Re-read privately and report only field-presence and unchanged/agreement
   booleans. On version conflict, re-read and reconcile; do not reuse stale
   credential-bearing payloads. Never copy the source project's pair.

A missing **raw** identifier means bootstrap ownership is **unverified**
(warning `SUPERADMIN_BOOTSTRAP_UNVERIFIED`), not necessarily unusable: the
typed default or an effective `SUPER_ADMIN_IDENTIFIER` can legitimately
supply it. Design validation cannot establish injected env or existing
account state. A missing raw **password** is different: it is the
`SUPERADMIN_PASSWORD_MISSING` error above, and the remedy needs the owner's
value (or the owner's authorization for a new private one, below).

For a **never-seeded new destination**, creating an explicit private pair
requires specific owner authorization and an approved private setup process
as a prerequisite. Project creation/import authorization does not grant a
silent administrator reset. If that prerequisite is missing, report the
unverified slice and continue independent work. Once authorized, the process
can merge destination-only fields using the ordinary versioned write tools
and verify presence/agreement without exposing values. This guide grants
no such authorization and ships no automatic secret-delivery helper.

Distinguish raw blueprint, hydrated defaults, generated seed/env files and
the **effective** preview/container or stage/production injected env. .NET
preserves nonempty process env while applying its file layers; do not assume
one empty-env precedence rule for all targets. Inspect only authorized
secret-free presence/source facts when resolving disagreement.

The auth bootstrap seed is **insert-only**: changing blueprint/env values
does not rotate the password or identifier of an existing seeded account.
For an existing account, use the application's supported password/identity
administration flow under its authorization. Never delete/reseed the account
or mutate its database to make a test login work.

## 5. Validate, build, gate

1. Validate the module (`mind-set validate blueprint.json`, then an OpenAPPL
   validation tool or compiler when one is available) and drive
   `authentication` to zero errors; judge warnings deliberately.
2. Phase 3 must not start before the `authentication` module validates
   clean; building the system service **`auth`** and checking its health
   happen on the hosting platform, outside this procedure.
3. **Machine completeness gate:** list the spec's inventory (tenancy
   decision, login identifier, name type, every custom role, every social
   login provider entry, every verification flag, every custom user/tenant property,
   every custom API) and diff it against the live state
   (`authentication` in `blueprint.json`, plus
   `projectSettings/socialLoginProvidersSettings` for the
   social login entries). Every spec item must exist; every
   extra must be intentional. Report the diff explicitly — completeness is
   proven, not claimed.
4. Report: sections written, validation status, role-mapping decisions
   (which spec personas mapped to built-ins and why), reserved-name items
   dropped from the spec, and deviations recorded.
