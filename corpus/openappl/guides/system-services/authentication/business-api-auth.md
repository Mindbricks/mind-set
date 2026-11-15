---
title: Business API authentication
---

# Business API authentication

`accessControl` defines the project's permission *vocabulary*; per-API *enforcement* lives
on each Business API's [`authOptions`](../../../spec/ApiAuthOptions.md) block, under
`basics.authOptions`.

Every Business API, whether it operates over REST, WebSocket, Kafka, or cron, carries this
block:

```json
{
  "authOptions": {
    "loginRequired": true,
    "checkRoles": ["admin", "editor"],
    "permissionCheck": { "permission": "invoice.write" },
    "ownershipCheck": true,
    "absoluteRoles": ["superAdmin"],
    "apiInSaasLevel": false,
    "crossTenantScopeOf": null,
    "M2MAllowed": false
  }
}
```

| Field | Effect |
|---|---|
| `loginRequired` | When `true`, the request must carry a valid session (or an M2M token if `M2MAllowed` is set). |
| `checkRoles` | The session must hold one of these roles (see [RBAC](./rbac.md)). Each name must be a defined role (a system role, a `roleItems` name or value, or a `customRoleLookups` name): an undefined one is the warning `UNDEFINED_GATE_ROLE`, and on a login-required api a list whose every name is undefined is that code as an error, unless `absoluteRoles` names a defined role, because the api then admits no defined-role session. A business membership accessLevel (for example `businessAdmin`) is not a session role. |
| `ownershipCheck` | Restricts access to records the caller owns. Covers the **main** data object only; for authorization against a parent/scope object use `permissionCheck`. |
| `permissionCheck` | Opts the API into the project's native permission resolver, including parent/scope checks via `scopeFields` (see [PBAC](./pbac.md)). One permission name, not a set. |
| `absoluteRoles` | Bypasses every other authorization check, the foreign permission provider (`foreignPermissionCheck`) included (still subject to business validations, and never to tenant isolation). `superAdmin` is in this list on every login-required API whether you declare it or not, and `tenantOwner` wherever the tenant filter is in force; see below. |
| `apiInSaasLevel` | When `true`, **removes tenant isolation from this API's reads** (and its scoped writes): the `{ <tenantName>Id: session.<tenantName>Id }` term is not injected, so the API addresses rows belonging to every tenant. For global admin endpoints, public catalogues and cross-tenant analytics. |
| `crossTenantScopeOf` | Declares that the cross-tenant read above is deliberate, by naming the source whose isolation it waives: the API's own `dataViewName`, or its `dataObjectName` when it reads no view. |
| `M2MAllowed` | When `true`, the API accepts the project's machine-to-machine token in addition to (or instead of) a user session. A **verified, session-less** M2M token passes the login, role and permission gates; the only further guard there is the service's caller lists (`allowedM2MClients` / `blockedM2MClients`). It does **not** pass an ownership gate: a machine token names no user, so on an api with `ownershipCheck` (any crudType but `create`) or `parentOwnershipChecks` the session-less machine caller is refused **403 `M2M_SUBJECT_REQUIRED`** (the list filter does not drop the owner term for it). A verified token whose payload NAMES a user (`userId`, else `sub`) is not session-less: it is held to that user: the login gate authenticates it as that user, the role, permission and tenant gates find no grant in the token (403), and the ownership gates compare that user. A service acting for a user forwards that user's token (`forwardCallerToken`); a flow that has no user calls a machine-only api (`requiredCallerKind: machineWithoutUserIdentity`, no `ownershipCheck`). It WIDENS the login gate and never narrows it, so it does not keep human callers out. See [M2M](./m2m.md). |
| `requiredCallerKind` | The flag that NARROWS. `machine` refuses an interactive user session with 403 `M2M_CALLER_REQUIRED` while still admitting an end-user identity forwarded on an interservice hop; `machineWithoutUserIdentity` refuses that hop too. Default `any` = no demand. A Kafka dispatch counts as a machine caller for this gate only; `machineWithoutUserIdentity` still refuses an event whose `actor` names a user. Not bypassed by `absoluteRoles`. See [the four-caller table](../m2m-communication.md#four-callers-not-two). |
| `requireApproval` | Step-up approval of a critical operation: the API answers its first call with **403 `APPROVAL_REQUIRED`** and sends a one-time code to the caller's own verified email or mobile; the same request repeated with `api-approval-id` + `api-approval-code` runs it. See [Step-up approval](#step-up-approval-requireapproval). |

`absoluteRoles` is the master override: a session holding one of those roles skips
role/permission/ownership checks entirely. That includes the FOREIGN permission gate
(maintainer ruling): when the project declares a `foreignPermissionProvider` and the API a
`foreignPermissionCheck`, an absolute-role session (an authored role or the automatic
`superAdmin` / `tenantOwner` pair below) is never sent to the provider at all (no
round-trip, so an unreachable provider does not refuse it either). This is intentional and
there is no per-API opt-out; `absoluteRoles: []` narrows only the authored list. The tenant
filter still applies.

`apiInSaasLevel: true` is for SaaS-level admin endpoints and public surfaces that must see
across tenants. Because it takes tenant isolation off, an API that sets it over
tenant-level data has to say so: name the view or object it reads in
`crossTenantScopeOf`. An undeclared pairing is reported at design time
(`SAAS_LEVEL_TENANT_READ_UNDECLARED`), and a declaration naming something the API does not
read is refused (`CROSS_TENANT_READ_DECLARATION_MISMATCH`); that is the shape a
cross-tenant API copied and retargeted at tenant-scoped data leaves behind.

## `superAdmin` and `tenantOwner` are automatic; hierarchy still is not

There is **no role hierarchy** in the language. `checkRoles` is compared against the
session's `roleId` by name; one role never inherits another's access, and `superAdmin` is
a sibling role like any other, not a superset of `admin`.

What IS implicit is the operator bypass, and it covers exactly two roles. **Every
login-required Business API, yours and the framework's own, is GENERATED with `superAdmin`
in its absolute-role list, and with `tenantOwner` added wherever the tenant filter is in
force on that API** (a tenant-scoped object, not a SaaS-level surface; see below). So the
API declared

```json
{ "authOptions": { "loginRequired": true, "checkRoles": ["admin"] } }
```

answers a `superAdmin` session normally, answers the owning tenant's `tenantOwner`
normally when the API is tenant-scoped, and still answers every other non-`admin` caller
with `403 FORBIDDEN`.

This is emitted into the generated service, **not written into your blueprint**. You will
not see it in `authOptions`, you do not add it, and nothing rewrites what you wrote. It
lives one layer below the blueprint on purpose: a blueprint default invites exceptions and
drifts, and an author who forgets to list the operator roles is exactly how a legitimate
operator, or a tenant owner on their own tenant, ends up refused on their own system.

Four things follow, each decided rather than incidental:

- **Your entries survive.** The emitted list is the UNION of what you declared with the
  automatic roles, never a substitution. Duplicates are folded case-insensitively, the
  same way the runtime compares role identities, so declaring `superAdmin` or
  `tenantOwner` yourself changes nothing and costs nothing.
- **Exactly these two roles are automatic: not `tenantAdmin`, and never where the tenant
  filter is absent.** `superAdmin` is automatic on every login-required API: it IS the
  platform operator and already sits above both the tenant plane and the SaaS plane.
  `tenantOwner` is automatic only where the tenant filter actually runs, because an
  absolute role bypasses roles, permissions, ownership and validation but NEVER the tenant
  scope, so on a tenant-scoped API the owner reaches its own tenant and nothing else. That
  safety is why the arm rides the filter and not the API in general. Making `tenantOwner`
  automatic UNCONDITIONALLY would be a privilege escalation: on the SaaS-level and
  shared-catalog surfaces there is no tenant filter behind the gate, so anyone who
  registered their own tenant would walk straight through, listing every tenant, editing
  the shared plan catalog, writing billing rows. A CREATE API is the same shape for the
  same reason: a create emits no where clause at all, so no tenant term ever rides it; the
  only tenant confinement on a create is the create-time session stamp, and that stamp
  yields by design to an authored tenant-column `dataClauseItems` entry (the provisioning
  shape), so an automatic `tenantOwner` on a create would be one authored entry away from a
  cross-tenant WRITE through a bypassed gate. Those three shapes (`apiInSaasLevel: true`,
  an API over a non-tenant-scoped object, and a create) therefore emit `superAdmin` only;
  name any other role you want there in `checkRoles` or `absoluteRoles` yourself. A bypass
  is not a role hierarchy and cannot stand in for one.
- **A public API still emits exactly what it authored.** `loginRequired: false` switches
  the whole authorization pipeline off, so there is no gate for an operator role to bypass
  and none is added.
- **Tenant isolation is untouched.** `absoluteRoles` bypasses authorization (roles,
  permissions, ownership, membership) and never the tenant filter, which is assembled
  separately on every scoped query. A `superAdmin` OR an automatic `tenantOwner`
  addressing tenant B's row from a tenant-A session still reads, updates and deletes ZERO
  rows of tenant B. Crossing tenants is a different, declared mechanism:
  `apiInSaasLevel: true`, which is unrelated to this and unchanged by it. Note what that
  means for a bypass: a SaaS-level API has NO tenant filter behind its gate, so the role
  gate is the only thing standing there. That is precisely why `tenantOwner` is NOT
  automatic on a SaaS-level API, and why the automatic set there holds the platform
  operator and nothing else.
- **Content moderation is untouched too.** `absoluteRoles` do not bypass
  [`objectModeration`](../../capabilities/object-moderation.md): it is content policy, not
  authorization, so an absolute role's write to a moderated object is moderated like
  anyone's unless the role is listed in the block's `exemptRoles`. On the `onPlace` read
  gate, author-declared `absoluteRoles` are not privileged either; only the reviewer
  roles, the automatic `superAdmin` / `tenantOwner` and trusted system transports are.

Still worth deciding deliberately: `checkRoles` is what RESTRICTS, and it is untouched by
any of the above. An admin surface gated on `checkRoles: ["admin"]` refuses a plain user
exactly as before.

## A tenant-scoped API needs a tenant

On a multi-tenant project, a login-required API that is not SaaS-level and reads
tenant-scoped rows refuses a logged-in user who carries no tenant with **403
`TENANT_REQUIRED`**. "Reads tenant-scoped rows" means: its own object is tenant-scoped and
it is not a `create` (the tenant object itself counts), or it runs a fetch, fetch-parent,
fetch-stats, update-crud or delete-crud action on a tenant-scoped object, or it declares a
`parentOwnershipChecks` parent that is tenant-scoped.

- The tenant that counts is the **session's own tenant**. A `superAdmin` session without
  one may name a tenant with the tenant header; it counts when it resolved to a real
  tenant other than `root`. For a plain user the header is not enough, and the root
  fallback never is.
- Not affected: login-free APIs, cron runs, a verified machine (M2M) caller with no user
  session, and Kafka events from a system actor (a Kafka event from a user without a
  tenant is already refused with `KAFKA_EVENT_TENANT_REQUIRED`).
- A plain `create` does not arm the check: it keeps stamping the root tenant for a caller
  without one, which is what login and provisioning rely on.
- On such an API the login, tenant and early role checks run before the
  `afterStartBusinessApi` workflow stage, so author actions there never run for a caller
  about to be refused. The SSE pre-flush check applies the same refusal before the stream
  opens.

## A machine call names its tenant

On a multi-tenant project a verified machine (M2M) caller is scoped at one place, right
after the `x-m2m-token` is verified and before the login check:

- A `callerTenantId` claim signed into the token (the interservice call's tenant argument;
  the agent hub client and the agent harness runner's machine arm sign the caller's / the
  event's tenant) scopes the call to that tenant **exactly as a session tenant would**: the
  where-clause pin, the create stamp, the search-index pin, the cache key and the
  authorization tenant (`TENANT_REQUIRED`, the tenant-scoped parent fetch) all read it. A
  tenant header that resolved to a different, non-root tenant is refused **403
  `M2M_TENANT_MISMATCH`** (an explicit `root` codename names nothing, as for a user).
- A forwarded user session (a user riding an InterService hop) keeps the user's tenant; a
  claim naming another tenant is refused **403 `M2M_TENANT_MISMATCH`**.
- A machine call that names **no tenant at all** (no session tenant, no claim, no header)
  on an API whose service reads the session tenant (the APIs the API document declares the
  tenant header on) is refused **403 `M2M_TENANT_REQUIRED`** instead of being served the
  root tenant. A platform-level object (`objectDataIsInTenantLevel: false`) and a
  SaaS-level API (`apiInSaasLevel`) keep the root floor. The framework's own payment
  machine twins (`<api>ForMachine`, whose callers are the payment plane's session-less
  webhook and 3-D Secure hops) are armed too: those callers sign the persisted ticket,
  order or mapping tenant. A header naming a tenant scopes the call as before. A
  machine-only API you declare yourself (`requiredCallerKind`, the shape recommended for
  kafka and cron flows) is **not** exempt: its machine caller signs the tenant or names it
  (`InterserviceCallAction.tenantContext`). A generated `InterserviceCallAction` hop that
  declares neither a `tenantContext` nor `forwardCallerToken` signs the calling service's
  own verified tenant by itself (never another tenant; a caller with no verified tenant
  signs nothing), so a Kafka or cron flow that hops inside tenant A acts in A.
- A cross-project forwarded identity (`x-project-m2m-token` with the sibling project's user
  claim) carries its tenant under the generic `tenantId`; that tenant stands exactly as a
  session tenant does, whatever this project's tenant is named.
- Single-tenant projects are unaffected: nothing is emitted and the rule never runs.

## Step-up approval (`requireApproval`)

A critical operation (closing an account, sending a payout, changing where money goes) can
demand that the user approve **this exact call** with a one-time code, even though they
are logged in. Declare it on the API
([`ApiApprovalRequirement`](../../../spec/ApiApprovalRequirement.md)):

```json
{
  "authOptions": {
    "loginRequired": true,
    "requireApproval": {
      "channel": "email",
      "bindInput": true,
      "expireTimeWindow": null,
      "actionName": "Send payout",
      "actionDescription": "Transfers the balance to the IBAN you entered"
    }
  }
}
```

**The contract (challenge, then retry).**

1. The first call answers **403** with `errorCode: "APPROVAL_REQUIRED"`. This is the
   expected first answer of such an API, not a failure. The problem body's `errors` member
   carries the challenge:
   `{ approvalId, channel, codeIndex, expireTime, expiresAt, actionName, actionDescription }`.
   The code goes to the caller's verified email (or mobile, by SMS) through the
   notification service.
2. The client shows a code input and repeats the **same request** (same parameters) with
   two more fields: `api-approval-id` (the `approvalId`) and `api-approval-code` (what the
   user typed). REST sends them as headers (or as the same two fields in the JSON body);
   gRPC and MCP callers put them in the request envelope next to `api-idempotency-key`.
   They are **never** read from the query string.
3. The API runs. The approval is consumed: the same id and code cannot run it a second
   time.

**Where the check sits.** A fixed milestone of the API pipeline (see [the compiler
specification](../../../compiler/index.md)), never a workflow stage you place:

- after every authorization check: login, `checkRoles` / `absoluteRoles`,
  `permissionCheck`, `ownershipCheck`, `parentOwnershipChecks`, the parameter checks and
  every workflow stage up to `afterCheckBasicAuth`;
- before the first stage that may write: for `create`, `list` and a `get` that fetches no
  instance, right before `buildWhereClause` / `buildDataClause`; for `update`, `delete`
  and an ownership-checked `get`, right after `afterCheckInstance` and the object-level
  permission check, before `buildDataClause` and the main operation.

So a caller who may not run the API never gets a code, and nothing from
`afterBuildDataClause` on runs before the approval. An action that writes the database in
an EARLIER stage runs on the challenged first call too; validation reports that as
`APPROVAL_GATE_AFTER_WRITE`.

**What the approval is bound to.** The user, the API (and its service), and, with
`bindInput: true`, the default, the canonical digest of the API's declared request
parameters (the same rule `useIdempotencyKey` uses). A retry with a changed amount,
another target or another API is refused. Every failure answers the same **403
`APPROVAL_INVALID`**: unknown, expired or used approval, another user's approval, changed
input, wrong code.

**Limits.** The code expires after `expireTimeWindow` seconds, by default **900 (15
minutes) for email, 300 (5 minutes) for mobile**, and the record is gone with it. A wrong
code or a changed input counts an attempt; the **fifth** destroys the approval, and a new
call without `api-approval-id` starts a new one. The attempt is counted before the code is
compared, so retries sent at the same time share the same five attempts: at most five
codes are ever checked against one approval. A second first call within 60 seconds with
the same input answers the same challenge again without sending a second code; with
another input it answers **429 `APPROVAL_RESEND_WINDOW`**.

**Test mode.** In a development or test deployment mode the challenge also carries the code
(`errors.secretCode`), so a tester or a test harness completes it without a mailbox. A
production deployment never does.

**Who can approve.**

| Caller | Result |
|---|---|
| A logged-in user over REST, gRPC or MCP (an agent tool call with the user's session included) | Challenged; approves with the code. |
| A logged-in user over SSE | The stream's error frame carries `APPROVAL_REQUIRED` but not the `approvalId`: take the challenge from the REST route (the same input answers the same challenge), then open the stream with the two headers (`APPROVAL_ON_SSE_CONTROLLER` warns). |
| cron, an in-process internal call | Passes without approval (a trusted system call). |
| A Kafka-consumed call, a JobStream worker call | **403 `APPROVAL_NOT_AVAILABLE`**: nobody there can receive a code (`APPROVAL_ON_KAFKA_CONTROLLER` warns about a Kafka controller). |
| A machine caller with no user, an agent run with no caller | **403 `APPROVAL_NOT_AVAILABLE`**. |
| A user whose session has no VERIFIED identifier of the channel | **403 `APPROVAL_NOT_AVAILABLE`**, nothing sent (`APPROVAL_UNVERIFIED_IDENTITY` warns when login does not require the verification). |
| An idempotent replay (`useIdempotencyKey`) | Answers the stored response of the approved execution; no second approval. |

**Design-time rules.** `requireApproval` needs `loginRequired: true`
(`APPROVAL_REQUIRES_LOGIN`), refuses a machine-only `requiredCallerKind`
(`APPROVAL_ON_MACHINE_API`), and needs the channel's identity to be a **required**
identity of your users (`APPROVAL_ON_OPTIONAL_IDENTITY`: email primary, or
`secondaryIdentifierPresence: "required"`, or `dualIdentifierRegistration: "both"`).
`actionName` holds at most 64 characters and `actionDescription` 256
(`APPROVAL_TEXT_TOO_LONG`); `expireTimeWindow` is a positive number of seconds
(`APPROVAL_EXPIRE_INVALID`). `bindInput: false` draws `APPROVAL_UNBOUND_INPUT`. Not every
target language generates the gate yet: on a service of a language that does not, the
block is refused (`APPROVAL_NOT_PORTED`), because that service would run the API without
asking.

**Not supported:** approving from another device by a link in the mail. The approval is a
code the caller sends back with the retry; there is no standalone action-approve
verification flow to use instead (see [Verification services](./verification-services.md)).

## Conditional access

When access depends on runtime state rather than static `authOptions`, drop into
action-level checks inside the API workflow:

- [`PermissionCheckAction`](../../../spec/PermissionCheckAction.md): assert the session
  holds a permission.
- [`ObjectPermissionCheckAction`](../../../spec/ObjectPermissionCheckAction.md): assert a
  permission on a specific object instance (OBAC).
- [`MembershipCheckAction`](../../../spec/MembershipCheckAction.md): assert the caller's
  membership/relationship to a record.

## See also

- [Business APIs overview](../../business-apis/overview.md): where `authOptions` sits in
  context.
- [RBAC](./rbac.md) / [PBAC](./pbac.md): the vocabularies enforced here.
- [M2M](./m2m.md): the `M2MAllowed` / `loginRequired` interaction.
- Spec: [`ApiAuthOptions`](../../../spec/ApiAuthOptions.md).
