---
title: Authentication and sessions
---

# 9.1 Authentication and sessions

The `authentication` section of the project ([`ProjectAuthentication`](../spec/ProjectAuthentication.md))
produces the project's identity service: users, tenants, logins, sessions, verification
flows and the keys every other service uses to trust a session.

## Activation

- When the blueprint has an `authentication` section, the compiler **MUST** generate a
  service named `auth`. Without it, there is no login and no user session in the project.
- Every service **MUST** accept the sessions the `auth` service issues
  ([chapter 3](03-architecture-and-topology.md#35-invariants-under-every-topology)).

## Data objects

| Object | When | Key fields |
|---|---|---|
| `user` | always | `email`, `password` (hashed, never returned), `fullname` or `name` + `surname`, `avatar`, `roleId` (array with multiple roles), `mobile`, `emailVerified`, `mobileVerified`, `passwordChangeRequired`, `<tenantName>Id` (multi-tenant), and the blueprint's `userProperties` |
| the tenant object (named by `tenantName`) | multi-tenant | `name`, `codename` (lower-case letters, digits and inner hyphens), `fullname`, `avatar`, `ownerId` |
| `userSession` | always | an audit record of each session; the live session is held elsewhere (see Sessions) |
| `userGroup`, `userGroupMember` | `userGroupsActive` | group name; group and user ids |
| `givenPermission` | `pbacIsActive` | `permissionName`, `roleId`, `subjectUserId`, `subjectUserGroupId`, `objectId`, `canDo` ([chapter 6](06-authorization.md#64-permissions)) |
| `apiKey` | `useAPIKeyForAuthentication` | `name`, `userId`, the key's hash and prefix, `expiresAt` |
| `chatIdentity`, `userSocialAccount` | chat surfaces, social login | links between a user and an external identity |
| `sys_paymentCustomer`, `sys_paymentMethod` | the project uses payments ([9.4](09-04-payment.md)) | the user's payment identity |

**Seeded records.** On first start the service **MUST** create, once and never overwrite:
the first super admin (role `superAdmin`, identifier and password from the bootstrap
credential `SUPER_ADMIN_IDENTIFIER` / `SUPER_ADMIN_PASSWORD`), the root tenant (codename
`root`) in a multi-tenant project, and the grants of the declared role permissions. Their
ids are fixed ([chapter 4](04-data-layer.md#43-system-fields)).

The bootstrap credential is not a secret in the usual sense: it exists so that the first
operator can log in. In staging and production, a login with the unchanged seed password
**MUST** set `passwordChangeRequired`, and every other API then answers **403**
`PASSWORD_CHANGE_REQUIRED` for that session.

## Route families

Routes are relative to the `auth` service's base address and also reachable under `/v1`.

| Family | Representative routes |
|---|---|
| Session | `POST /login`, `POST /relogin`, `POST /logout`, `GET /currentuser`, `GET /getusersessions`, `DELETE /deleteusersession/:sessionId` |
| Key publication | `GET /publickey` |
| Permissions | `GET /permissions`, `GET /rolepermissions`, `GET /permissions/:permissionName` |
| Users | `POST /register` (when registration is public), `POST /users`, `GET /users/:userId`, `PATCH /users/:userId`, `PATCH /profile/:userId`, `GET /users`, `PATCH /userrole/:userId`, `PATCH /changepassword/:userId` |
| Verification | `POST /api/auth/verify/<flow>/start` and `…/complete` for `email-verification`, `mobile-verification`, `password-reset-by-email`, `password-reset-by-mobile`, `email-2factor-verification`, `mobile-2factor-verification` |
| API keys | `POST /secretapikey`, `GET /apikeys`, `DELETE /apikeys/:apiKeyId`, `POST /validateapikey` |
| Groups, grants | `POST /group`, `POST /addgroupmember`, `POST /givenpermissions`, `POST /rolepermission` |
| Tenants (`{t}` = tenant name) | `POST /{t}s`, `GET /{t}s/:{t}Id`, `GET /{t}home/:codename`, `POST /register{t}owner` |
| Machine-only | `POST /mintsessionforuser` |
| Social login | `GET /auth/<brand>`, `GET\|POST /auth/<brand>/callback`, `POST /auth/social-login-result` |

These routes follow the route derivation of [chapter 5](05-business-apis.md#53-routes):
for example `updateUserRole` is `PATCH /userrole/:userId`.

> Generated table goes here (S9): the full authentication route catalogue.

## Login

`POST /login` with `email` (or `mobile`, or `username`) and `password`; in a multi-tenant
project the tenant is named as in [chapter 6](06-authorization.md#66-tenant-isolation).

- Success answers **201** with the session record at the top level:
  `{ "_type": "userSession", "sessionId", "userId", "email", "fullname", "roleId", …, "accessToken", "refreshToken"? }`.
  It **MUST** also set the session cookie (below).
- An unknown identifier and a wrong password **MUST** give the same answer: **401** with
  `errorCode` `errMsg_InvalidCredentials`, in comparable time.
- Only after the password matched: account-status refusals (configured status, default
  403) and **403** `errMsg_EmailNotVerified` / `errMsg_MobileNotVerified` when verification
  is required for login.
- When the session store or the signing key is not available: **503**.

`POST /logout` ends the session, clears the cookie and answers `{ "status": "OK" }`; it is
idempotent.

## Session tokens

- A session token **MUST** be a JWT signed with **EdDSA (Ed25519)** by the `auth` service's
  identity key, with header `{ "alg": "EdDSA", "kid": <key id> }`.
- Claims: `sessionId`, `userId`, `sub` (= `userId`), `tokenName`
  (`<projectCodename>-access-token`), `tokenMark` (`<projectCodename>-inapp-token`),
  `keyId`, `loginDate`, `iat`, `exp`. The token points at the session; it does not carry it.
- `exp` is the configured token period (`tokenPeriodInDays`, default 30), capped at 24
  hours for absolute-role sessions and machine-minted sessions.
- `GET /publickey` (optionally `?keyId=`) **MUST** answer
  `{ "status": "OK", "keyId", "keyData" }` with the public key as an SPKI PEM, and **404**
  for an unknown `keyId`. Any service that lets users log in serves this route.

**Where a client sends the token**, in the order a service reads it:

1. query `access_token`;
2. `Authorization: Bearer <token>`;
3. header `<projectCodename>-access-token`;
4. cookie `<projectCodename>-access-token`;
5. cookie, query or body under `access-token`, `accessToken`, `access_token` or `token`.

**The cookie** set by login is `<projectCodename>-access-token` (or the configured
`SESSION_TOKEN_NAME`), `HttpOnly`, `Path=/`, `SameSite=Lax` by default, `Secure` over TLS,
with a lifetime no longer than the token's.

> **To verify:** the cookie domain rules (derived from the configured cookie domains and
> allowed origins) need a normative statement.

## Sessions

- The live session (the user record without secrets, plus `userId`, `sessionId`, `roleId`,
  `roles`, `<tenantName>Id`, `tenantCodename`, `loginAt`) is held in a store every service
  of the project can read. `GET /currentuser` returns it, or **401** when there is none.
- A service **MUST** validate a token by its signature (with the cached public key) and
  then load the session by `sessionId`; a session that was ended, or that was issued
  before the user's sessions were all revoked, **MUST** answer **401** everywhere.
- The session store is free (the reference uses a shared key-value store).

**Refresh.** With `refreshTokenSettings.useRefreshToken`, login also returns an opaque
`refreshToken`; `POST /relogin { refreshToken }` returns a new pair. A refresh token is
single-use: a rotated token is accepted for a short grace window, and a later replay
revokes the whole token family. Relogin re-applies the verification and account-status
checks.

## Verification and two-factor flows

Each flow that the blueprint activates (`verificationServices.<flow>`) gets an anonymous
pair of routes:

| Route | Body | Answer |
|---|---|---|
| `…/<flow>/start` | `{ email }` or `{ mobile }` | `{ status, codeIndex, timeStamp, date, expireTime, verificationType }` |
| `…/<flow>/complete` | the identifier and `secretCode` (and the new `password` for resets) | `{ status, isVerified, … }` |

- Start publishes `<projectCodename>-auth-service-<flow>-start` only when the identifier
  belongs to an account; the notification service delivers the code
  ([9.3](09-03-notification.md)). The answer is the same either way.
- A completed password reset ends every session of the account.
- While a session waits for a second factor, every API except logout, current user and
  relogin answers **403** (`EmailTwoFactorNeeded` / `MobileTwoFactorNeeded`).

## Events

| Topic | When |
|---|---|
| `<projectCodename>-auth-service-user-logged-in` | each login, unless `announceLoginEvent` is false |
| `<projectCodename>-auth-service-new-login-location` | a login from a new location, with session geo sensitivity on |
| `<projectCodename>-auth-service-<flow>-start`, `…-complete` | verification flows |

Plus the ordinary data-change events of the service's objects.

## Machine-to-machine calls

A service calling another service sends `x-m2m-token: <JWT>`:

- an EdDSA (Ed25519) JWT signed with the **calling** service's identity key, with
  `iss = svc:<serviceName>@<projectId>`, `aud = svc:<targetService>@<projectId>`, a short
  lifetime, and optionally the caller's tenant (`callerTenantId`);
- verified by the receiver against the caller's published key set;
- `Authorization` stays reserved for a forwarded user token.

What a machine caller may do is decided by [chapter 6](06-authorization.md#67-machine-callers).

> **To verify:** where the reference publishes each service's machine key set (it is
> served by the hosting platform today), and whether one key per service or one per
> project is the reference model; the documentation states both.

## Configuration surface

| Blueprint | Effect |
|---|---|
| `authenticationEssentials` | token period, API keys, refresh tokens, cookie domains |
| `loginDefinition.userSettings` | login identifier, verification required for login, two-factor, public registration, the bootstrap credential, login blocking, self-archiving |
| `loginDefinition.tenantSettings` | multi-tenancy, tenant name, tenant header name, public tenant registration |
| `verificationServices` | which flows exist, code or link, time windows, templates |
| `accessControl` | roles and permissions ([chapter 6](06-authorization.md)) |
| `projectSettings.socialLoginProvidersSettings` | social login brands |

Environment: the identity key (`SERVICE_PRIVATE_KEY_PEM`, `SERVICE_KID`), the bootstrap
credential and cookie settings ([chapter 10](10-configuration-and-secrets.md)). Without
the identity key the service starts degraded and login answers **503**.
