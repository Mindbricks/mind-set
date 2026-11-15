# Writer guide: auth-spec

The authentication spec: the complete decision document for the project's
identity and access layer. The compiler generates a complete `auth` service from
configuration - this document CONFIGURES that built-in module; it never
designs a custom auth service. The auth blueprint procedure
(`procedures/auth-blueprint.md`) transcribes it, so every decision not made here is
made badly or not at all downstream. Owed when `hasAuthentication` is on;
written before the domain service specs, which read its role and permission
canon.

Follow `procedures/design/writer-contract.md` (inputs, decisions, output, publish).

## Inputs

- Required: `project-basic-setup` (tenancy, roles, flags - respect them
  verbatim), `prd`, `use-cases`, `user-stories`, `microservice-definitions`
  (sagas that need a scoped M2M auth API).
- Supplementary: the auth route surface (`auth-route-surface`) - the
  ENUMERATION of the routes that already exist. No live surface is read here:
  take the built-in auth routes from the route families of the compiler
  contract (`openappl/compiler/09-01-authentication-and-sessions.md`) and the
  route-surface canon.
- Canon: `procedures/design/canon/roles.md`, `procedures/design/canon/route-surface.md`.
- Reference: the authentication module pages under `openappl/spec/` (the standard
  user and tenant shapes, verification flows, access-control settings) - the
  never-redeclare lists in sections I and J come from there.

## Required sections

These H2 headings are this document's machine contract. They equal
`requiredSections` for `auth-spec` in `procedures/design/pipeline.json`; write each
exactly as given, letters included. Every section carries a decision or an
explicit "(none)" / "disabled" statement.

- `## A. Multi-Tenancy`
- `## B. Login Identifier`
- `## C. User Name Type`
- `## D. Custom Roles`
- `## E. Social Logins`
- `## F. Email Verification`
- `## G. Mobile Verification`
- `## H. Super-Admin Credentials`
- `## I. Custom User Properties`
- `## J. Custom Tenant Properties`
- `## K. Custom Business APIs`
- `## Token & Session Policy`
- `## Verification Flows`
- `## Access Control`
- `## Auth Method Extensions`
- `## Notification Needs`
- `## BFF DataView Needs`
- `## Open Questions`

## Document skeleton

```markdown
# Authentication Spec
## A. Multi-Tenancy
## B. Login Identifier
## C. User Name Type
## D. Custom Roles
## E. Social Logins
## F. Email Verification
## G. Mobile Verification
## H. Super-Admin Credentials
## I. Custom User Properties
## J. Custom Tenant Properties
## K. Custom Business APIs
## Token & Session Policy
## Verification Flows
## Access Control
## Auth Method Extensions
## Notification Needs
## BFF DataView Needs
## Open Questions
```

`## Notification Needs` and `## BFF DataView Needs` are machine-read: one item
per bullet, `- (none)` when empty.

## Per-section rules

### A. Multi-Tenancy

Multi-tenant means each organization's data is fully isolated from all others
(SaaS, white-label). Marketplaces, consumer apps and personal apps are NOT
multi-tenant. If enabled, also decide the tenant's term (workspace,
organization, store, ...) and whether new tenants self-register or are created
by an admin.

**A user belongs to exactly ONE tenant.** That is what isolation MEANS, not a
limitation to design around. A person who works in two tenants registers
twice; "switching" is signing in to the other account. Never specify a way
around it: no per-tenant membership table as the authorization source of
truth, no "the session role is the role in the ACTIVE tenant", no
tenant-switch endpoint, no cross-tenant identity link. If the inputs seem to
ask for one, the answer is two registrations - say so in the spec.

**The tenant is the outermost unit.** If the unit you called the tenant has
something ABOVE it that owns several of them, it is a division inside a
tenant - and the project is probably single-tenant with an ordinary owning
entity.

### B. Login Identifier

- **primaryLoginIdentifier:** `email` (default) | `mobile` | `emailOrMobile`.
- **secondaryIdentifierPresence:** `none` | `optional` | `required`.
- **dualIdentifierRegistration:** `atLeastOne` | `both` (`emailOrMobile` only).
- **userRegisterIsPublic:** true | false - self-registration or admin-created
  accounts.

### C. User Name Type

`asFullname` (default, one `fullname` field) | `asNamePair` (`name` +
`surname`). Choose `asNamePair` whenever the project wants a two-part personal
name; that setting ALONE produces both fields.

### D. Custom Roles

ONLY roles beyond the built-in set (roles canon).

- Single-tenant built-ins: `superAdmin`, `admin`, `user`. Multi-tenant
  built-ins: `superAdmin` / `saasAdmin` / `saasUser` and `tenantOwner` /
  `tenantAdmin` / `tenantUser`. `saasUser` is the SaaS-level operator role -
  not a tenant-level role and not the public-signup target.
- The ORDINARY member role is always the built-in one - `user` or
  `tenantUser` - however the member arrives (signup, invitation, created by an
  admin). A tier below admin is `tenantUser`, not a new role.
- A domain word for that member (customer, patient, student, agent) is
  descriptive, NOT a custom role. It becomes one ONLY when an explicit
  admin-approval gate stands between the person and a CAPABILITY (KYC,
  document review, application acceptance). **An invitation is not that
  gate.**
- A role - or a promotion between roles - exists ONLY if it gates real
  differential access. Two tests before writing a custom role: (1) remove it,
  put the person on the built-in tier and re-read every API's `checkRoles` -
  if no permission changes, it is not a role; (2) look at the cost - a custom
  role that forces a new role-assignment API onto auth, above all an
  `M2MAllowed` or SaaS-level write on `user`, is the signal that the role is
  wrong.

### E. Social Logins

Only providers explicitly required (google, apple, facebook, microsoft,
linkedin, github, gitlab). Otherwise "(none)".

### F. Email Verification / G. Mobile Verification

Enable only when the project needs them (mobile when mobile is a login
identifier or OTP flows are required); note whether each is required for
login. Flow-level configuration lives in `## Verification Flows`.

### H. Super-Admin Credentials

Write **"stamped at project creation - do not author"**. Project creation set
the identifier to the project owner's own email or mobile and generated a
random password; the spec records neither a credential nor a variable
reference. Record an identifier ONLY when the requirements name a different
administrator identity - never a password.

### I. Custom User Properties

ONLY fields beyond the standard user shape. Never redeclare `id`, `isActive`,
`createdAt`, `updatedAt`, `roleId`, `avatar`, `email`, `emailVerified`,
`password`, `fullname` or `name` + `surname`, `mobile`, `mobileVerified`,
`{tenantName}Id`. `asNamePair` creates `name` + `surname` - never also list
`firstName` / `lastName` / `givenName` / `familyName`. State custom properties
as a property table in ontology vocabulary (the service-spec format):

| name | type(+isArray) | required | allowUpdate | default | index/unique | relation(target, onDelete) | session/staticJoin | filter/search | notes |
|---|---|---|---|---|---|---|---|---|---|
| bio | Text | no | yes | - | - | - | - | - | public profile blurb |

Cross-service relations use `service:objectName` (the object half is the data
object's lowerCamelCase name) with the `onDeleteAction` literal chosen from the
shape of the relation; `isRequired` defaults to true and `setNull` on a
required foreign key is rejected at build time. "(none)" when the standard
shape suffices.

**A value balance is never a user property.** Points, credits, wallet or
earnings balances live in a domain service on a `ledgerSettings`-decorated
owner object keyed by the user id; a balance column on the auth user
recreates the race-prone hand-rolled balance the ledger pattern replaces.

### J. Custom Tenant Properties

Multi-tenant only; fields beyond the standard tenant shape (`id`, `name`,
`codename`, `fullname`, `avatar`, `ownerId`, `isActive`, `createdAt`,
`updatedAt`). Never redeclare `name` / `ownerId` or equivalents. Same table
format as I; "(none)" for single-tenant projects.

### K. Custom Business APIs

Rare: only auth-layer operations the built-in flows do not cover - above all
the scoped M2M role-transition APIs sagas need (roles canon). The standard
`login`, `register`, `verify`, `resetPassword` are RESERVED; so are the
API-key management flows (`createSecretApiKey`, `listApiKeys`,
`deleteApiKey`, `validateApiKey`) whenever API keys are enabled. For each
custom API, the service-spec flow plan:

- **crudType** (`create` | `update` | `get` | `list` | `delete`), target
  object, purpose, `raiseApiEvent` decision;
- **trigger:** rest with an EXPLICIT route, or cron `<expression>`.
  Never invent the route of an EXISTING API: quote it from the route
  surface (route-surface canon - the built-in `updateUserRole` mounts
  `PATCH /userrole/:userId`). A second API of the same crudType on the same
  object declares a DISTINCT route, checked against that surface; a
  colliding default route ships the custom API unreachable with a green
  build;
- **auth:** loginRequired, `checkRoles` / `absoluteRoles`, permissions (each
  declared in `## Access Control`), ownershipCheck, M2M flag;
- **parameters:** `name | type | location | required | notes`;
- **query plan:** only the clause blocks valid for the crudType;
- **actions:** `hook milestone | action type | name | purpose`, names verbatim
  from the ontology;
- **ID-list lookups flatten:** an M2M lookup API whose purpose is an id array
  (`listAdminUserIds`) specifies a response-shaping action that maps the rows
  to `id` strings - a bare `select: [id]` returns row objects and every
  notification target reading the stamped key resolves nothing.

Write "(none)" when the built-in flows cover everything (the common case).

### Token & Session Policy

Concrete numbers in INTEGER DAYS: the schema's `tokenPeriodInDays` is an
integer, so minute-scale TTLs are not expressible. Default: `1 day access
token + refresh rotation`. A shorter posture is a prose deployment note, never
a config requirement.

### Verification Flows

For EACH enabled flow (`emailVerification`, `mobileVerification`,
`passwordResetByEmail`, `passwordResetByMobile`, `email2Factor`, `mobile2Factor`), one
H3 with **verificationType** (`byLink` | `byCode`), **windows** (resend window
and expiry, concrete values) and **required for login** (stated explicitly).
Flows the requirements exclude are stated DISABLED and must stay disabled in
the blueprint (silence = off, but say it).

Do not write a verification mode: `verificationSettings.verificationMode` is
retired and has no effect. How a code reaches the user is decided by the
deployment, never by this document, so state the mail or SMS provider each
enabled flow depends on. Name the real SMS provider the project will need
for production when a mobile flow is enabled, and the real email provider
too: a flow with no provider declared has nowhere real to deliver its code,
and validation warns about it (`SMS_FLOWS_GO_TO_SINK`,
`MAIL_FLOWS_GO_TO_SINK`).

### Access Control

**This section is the project's permission canon.** Any permission name a
service spec cites in a `permissionCheck` MUST be declared here.

**`pbacIsActive` is the switch that generates the permission resolver.** With
it off, no permission manager is generated at all, so a `permissionCheck` gate
(or a membership `rolePermissions` grant) is generated against a resolver that
does not exist and DENIES every caller - the record's owner, admins,
superAdmin - forever; the framework rejects that design
(`PERMISSION_CHECK_WITHOUT_PBAC`). So: if ANY service needs a
`permissionCheck`, or any object carries membership `rolePermissions`, turn
`pbacIsActive` ON here and declare the permission groups. If the project needs
nothing beyond roles, leave it off and WRITE IT DOWN as a finding: "This
project has no permission management; authorization is roles plus membership
roles." Without PBAC, a membership rule is a `membershipCheckAction` whose
`requiredRoles` name the member roles that may act - so the member roles you
settle here are the whole authorization vocabulary.

Decide, completely: **permission groups** (`group.permission` names by
domain, each with its meaning - the exact strings service specs cite);
**role items** (every role, built-in and custom); **seed rolePermissions**
(which role gets which permission); **permission types** in use
(role / user / userGroup / object / tenant based); **OBAC** objects;
**ABAC definitions** (name, data object, where-clause intent, granted
permissions); **usersHaveMultipleRoles**; and which objects carry membership
with which member roles.

### Auth Method Extensions

Only when the requirements demand them; silence = disabled, and say which are
disabled: **API keys** (type, location; enabling them GENERATES the
management APIs and `validateApiKey` - never respecified in K); **SSO** (IdP
endpoints, attribute mapping); **remote-service auth**; **foreign permission
provider** (`grpc` | `rest`, bindings, `failOpen` default false); **session
geo-sensitivity** (enforcement mode, track by, actions, grace).

### Notification Needs / BFF DataView Needs (machine-read)

```
- <event> -> <role(s)> - <why>
- <ViewName> - <main object + joins> - <why>
```

Domain notifications only (a welcome message on `userVerified`); EXCLUDE the
system flows the platform sends (password reset, verification codes, login
alerts). A topic named here is the derived, lowercase topic
(event-envelope canon). Both are usually `- (none)`.

### Open Questions

Every `OPEN` item from anywhere in the document.

## Production rules

- **Role promotion fires on the APPROVING outcome**, not the creating action:
  a role granted "upon first approved X" triggers on the approval outcome
  event (selecting the user by the creator id the outcome carries).
- **A service-triggered role change is ONE purpose-built M2M API per
  transition** (`promoteToArtist`, `M2MAllowed: true`, target `userId` only,
  idempotent) - never a generic `updateUserRole` opened to M2M.
- **No seed credentials.** The spec states no super-admin identifier or
  password (section H); provider credentials are referenced by NAME from the
  project settings, never inline.
- **No buckets for auth.** Avatars use the automatic built-in db bucket; if the
  requirements mention profile pictures, write "handled by the built-in avatar
  bucket".
- **Enum casing:** one casing per enum project-wide; passive status forms.

## Completeness check

1. Every skeleton section present, in order, with a decision or an explicit
   "(none)" / "disabled"; no "could / should consider" language.
2. No custom role without an admin-approval gate; the public-signup role maps
   to a built-in.
3. I and J tables hold no standard-shape field and use `DataTypes` literals.
4. Every permission name cited anywhere is declared in `## Access Control`;
   the PBAC decision is written down either way.
5. Every enabled verification flow has its type, windows and login gate;
   every excluded flow is explicitly disabled; token policy in integer days.
6. Every route path is quoted from the route surface or is a NEW path
   for a new custom API that duplicates no existing `(METHOD, routePath)`.
7. No literal secrets anywhere.

## Output

Write the document to `design/auth-spec.md` (writer contract section 4).
