---
title: Login
---

# Login

The `auth` service supports several login methods, all of which converge on the same flow
and issue a signed access token on success:

- Native identifier/password login (email, mobile, or either, depending on
  `primaryLoginIdentifier`).
- [Social logins](./social-logins.md) (Google, Apple, GitHub, GitLab, and more).

[SSO authentication](./sso.md) is not available yet. Enabling it is refused at design time
with `SSO_NOT_SUPPORTED`.

Whatever the method, success yields a JWT used to authenticate subsequent requests (see
[Access tokens](./access-tokens.md)). Delegating the whole authentication to an external
user service is not one of the methods (see [Remote authentication](./remote-auth.md)).

## Login identifier model

`primaryLoginIdentifier` (in [`LoginDefUserSettings`](../../../spec/LoginDefUserSettings.md))
picks the field used to log in:

- **`email`** (default): email + password.
- **`mobile`**: mobile + password (WhatsApp-style). Numbers are stored and matched in E.164
  format.
- **`emailOrMobile`**: either identifier + password; both fields exist in the model.

When the primary identifier is `email` or `mobile`, the non-primary ("secondary") field is
controlled by `secondaryIdentifierPresence`:

- `'none'`: the secondary field is not stored.
- `'optional'`: the field exists but is not required at registration.
- `'required'`: the field must be provided at registration.

When `primaryLoginIdentifier` is `emailOrMobile`, `dualIdentifierRegistration` controls
registration instead:

- `'atLeastOne'`: at least one identifier must be provided.
- `'both'`: both email and mobile must be provided.

## Login via identifier and password

The most common method uses the primary identifier and **password**, with JWT-based auth
configured under `authenticationEssentials.JWTAuthentication` (enabled by default):

```json
{
  "authentication": {
    "authenticationEssentials": {
      "JWTAuthentication": {
        "useJWTForAuthentication": true,
        "configuration": {
          "tokenPeriodInDays": 30
        }
      }
    }
  }
}
```

Login is handled via:

```plaintext
POST /login
```

On success:

- A session object is returned in the response.
- A JWT access token is issued.
- For browser clients, the access token is also written as an **HttpOnly** session cookie
  (see below and [Access tokens](./access-tokens.md)).

The token can also be sent on later requests via:

```plaintext
Authorization: Bearer <token>
```

On a refused credential, an identifier that matches no active account and a wrong password
get the **same** answer: status `401`, `errorCode` `errMsg_InvalidCredentials`, the same
`detail` sentence. The unknown-identifier path also runs one password-hash compare (against
a fixed dummy hash), so the two cases cost the same time. `POST /login` therefore cannot be
used to find out which emails or mobiles are registered; a client shows one "email or
password is incorrect" message. The account-status and verification refusals below are
checked only after the password matched, so they never answer a caller who has not proved
the identity.

### Session cookie (browser clients)

When `POST /login` succeeds the service issues the access token as an HttpOnly cookie so
cookie-based auth and cross-subdomain SSO work without the client having to store the
token. The same cookie is set by `POST /validateapikey` and by auto-login-after-register
(see below).

- **Cookie name**: the codename-scoped `<codename>-access-token` by default (no tenant
  suffix), overridable via the `SESSION_TOKEN_NAME` environment variable. The read side
  looks for both names (see [Access tokens](./access-tokens.md)).
- **Attributes**: `HttpOnly`; `Path=/`; `SameSite` from `SESSION_COOKIE_SAMESITE` (default
  `lax`); `Secure` when `SameSite` is `none`, when the request is over TLS, or when
  `COOKIE_SECURE=true` (for a TLS-terminating proxy); `Max-Age` is the SMALLER of
  `SESSION_COOKIE_MAX_AGE_MS`, which every generated service derives from
  `sessionCookieMaxAgeDays` when the project sets it, and otherwise from its resolved token
  period (`tokenPeriodInDays`, default 30 days), and the time remaining to the `exp` of the
  token being set. Set `sessionCookieMaxAgeDays` to make the browser cookie expire SOONER
  than the token: the token and its server-side session keep the full `tokenPeriodInDays`,
  the browser just stops sending the cookie earlier. A value larger than `tokenPeriodInDays`
  extends nothing, and an explicit non-positive one is a design-time error. The setting is
  the ceiling and the token the floor, so an operator can shorten the cookie but nothing
  can extend it past the credential inside it: an absolute (super-admin) or delegated
  session, whose token is bounded to 24 hours, gets a 24-hour cookie even under a 30-day
  project period. With the setting removed the token's `exp` is the whole answer; with a
  token that carries no usable `exp` the configured value stands alone, and with neither, 7
  days.
- **`Domain` attribute**: resolved from the request `Host` and the cookie allow-list
  (`COOKIE_DOMAINS` plus the hostnames of `ALLOWED_ORIGINS`):
  - If the request host falls under an allow-listed **base domain** (e.g. `xapp.com`), the
    cookie is scoped to `.xapp.com` so it is shared across that domain's subdomains; this
    is what enables SSO across `app.` / `api.` hosts.
  - If only a **specific host** is allow-listed (e.g. `api.xapp.com`), the cookie is scoped
    to that host.
  - For allow-listed dev hosts (`localhost`, `127.0.0.1`, `::1`) the `Domain` attribute is
    omitted, producing a host-only cookie.
- **Hosts outside the allow-list**: when `COOKIE_DOMAINS` is set, a request whose host it
  does not cover gets **no session cookie**; login still returns its token and the refusal
  is logged with the host and the configured list. `COOKIE_DOMAINS` comes from
  `authentication.authenticationEssentials.cookieSettings.allowedDomains` and is provided
  to the deployed (non-local) environments only, so local development is never gated. With
  it unset the allow-list is not a gate and every host gets a host-only cookie.

### Auto-login after registration

When a registration flow logs the user in immediately, the same session cookie is written
on the registration response. Only login-producing APIs set the cookie.

### Logout

`POST /logout` clears the session cookie, using the same name, `Domain`, and `Path` it was
issued with (a cookie under the bare `access-token` name is cleared too), and returns
`{ "status": "OK" }`.

## Email and mobile verification during login

You can require verified contact info before login. The user model includes
`emailVerified` (when `email` exists) and `mobileVerified` (when `mobile` exists). All
mobile numbers are normalized to E.164 before storage and comparison.

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "emailVerificationRequiredForLogin": true,
        "mobileVerificationRequiredForLogin": true
      }
    }
  }
}
```

**Defaults.** `emailVerificationRequiredForLogin` defaults to `true`;
`mobileVerificationRequiredForLogin`, `email2FARequiredForLogin` and
`mobile2FARequiredForLogin` default to `false`. A blueprint that omits a flag gets its
default in every place that reads it: the generated password login, the social login and
the registration auto-login. So a project that does not want email verification at login
sets `"emailVerificationRequiredForLogin": false` explicitly. When the flag is omitted and
`verificationServices.emailVerification` is not enabled, validation warns
(`VERIFICATION_FLOW_MISMATCH_BY_DEFAULT`): users could never complete the verification the
login requires. An explicit `true` without the flow stays the `VERIFICATION_FLOW_MISMATCH`
error.

**Only a user who has the identity is gated.** The email gate refuses a user whose `email`
is set but not verified; a user who has **no** email (possible only when the email is
optional, for example `primaryLoginIdentifier: "mobile"` with
`secondaryIdentifierPresence: "optional"`) is not held back by it. The mobile gate works
the same way on `mobile` / `mobileVerified`. The check is decided at generation time from
whether the identity can be absent:

| Identity in the user model | Check applied (password login, `relogin`, social login, registration auto-login) |
|---|---|
| required (for example email primary) | `user.emailVerified === true` |
| optional | `user.email == null \|\| user.emailVerified === true` |

A user **with** an unverified email is always refused. The password login, `relogin`, the
social login and the registration auto-login read this one predicate.

**`relogin` checks it too.** A refresh (by refresh token or by the live session) re-reads
the user row and applies the same gate, with the same `403 errMsg_EmailNotVerified` /
`errMsg_MobileNotVerified`, after the account-status gate and before a new session is
minted or the refresh token is rotated. So a user whose verification was removed, or whose
email was changed to an unverified one, cannot keep refreshing a session off a refresh
token issued earlier; the refused refresh token is not rotated.

An empty value counts as no identity: every create door (`register`, `registerUser`,
`createUser`, the tenant-owner registrations) stores an optional `email` / `mobile` sent as
`""` as `null`, so that user is a user without the identity, and no two users collide on an
empty value. A required identity is never empty: its format check refuses `""` before the
write.

If a required verification is missing, the login pipeline refuses with
`403 errMsg_EmailNotVerified` (or `errMsg_MobileNotVerified`), and the service serializes
it as an RFC 9457 problem+json body. **Which field carries the key depends on the target
language of the generated service**, so match it in `errorCode` **or** `detail`, never only
one:

- Some targets resolve the raw key to a human sentence and move the key itself to
  `errorCode`:

  ```json
  {
    "type": "about:blank",
    "title": "Forbidden",
    "status": 403,
    "detail": "Verify your email address before signing in.",
    "errorCode": "errMsg_EmailNotVerified",
    "requestId": "r_a1b2"
  }
  ```

- Other targets do not resolve the key: the raw key rides in `detail`, and `errorCode` is
  the generic status-derived default (`FORBIDDEN`):

  ```json
  {
    "type": "about:blank",
    "title": "Forbidden",
    "status": 403,
    "detail": "errMsg_EmailNotVerified",
    "errorCode": "FORBIDDEN",
    "requestId": "r_a1b2"
  }
  ```

The same two shapes apply to `errMsg_MobileNotVerified`. Match the key in **either** field
rather than assuming one (see [Error handling](../../workflow/error-handling.md)).

It is good UX to verify during or right after registration. Registration responses include
verification flags, for example:

```json
{ "emailVerificationNeeded": true }
```

or

```json
{ "mobileVerificationNeeded": true }
```

The registration answers `emailVerificationNeeded` / `mobileVerificationNeeded` under
exactly the condition the login applies: `emailVerificationRequiredForLogin` on a project
whose users have an email (required or optional), `mobileVerificationRequiredForLogin` on
a project whose users have a mobile. When either is `true` the registration issues no
session (no auto-login), so a registration never hands out a session the login door would
refuse. With an optional email (for example `primaryLoginIdentifier: "mobile"` and
`secondaryIdentifierPresence: "optional"`) and `emailVerificationRequiredForLogin: true`,
a user who registers WITH an email that is not yet verified is refused at login and is not
auto-logged-in at registration (`emailVerificationNeeded: true`); a user who registers
WITHOUT an email logs in and is auto-logged-in (`emailVerificationNeeded: false`).

See [Verification services](./verification-services.md) for the flow configuration.

## Blocking login on account status (moderation)

Verification and soft delete are the framework's own reasons to refuse a login. For a
reason the **project** owns (suspended, banned, awaiting review), declare a gate over one
of your own user properties. Name the property in `loginBlockedProperty` and the values
that refuse admission in `loginBlockedValues`:

```json
{
  "authentication": {
    "userProperties": [
      {
        "basicSettings": {
          "name": "accountStatus",
          "type": "Enum",
          "enumOptions": ["active", "suspended", "banned"],
          "defaultValue": "active"
        }
      }
    ],
    "loginDefinition": {
      "userSettings": {
        "loginBlockedProperty": "accountStatus",
        "loginBlockedValues": ["suspended", "banned"],
        "loginBlockedErrorCode": "errMsg_AccountBlocked",
        "loginBlockedStatus": "403"
      }
    }
  }
}
```

`POST /login` then answers the configured status (default `403`) with the configured code
in `detail`, so a client can tell a moderation block apart from a wrong password or an
unverified email:

```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "errMsg_AccountBlocked",
  "errorCode": "FORBIDDEN",
  "requestId": "r_a1b2"
}
```

Write the property back to a permitted value and the same credentials log in again;
**this is not a soft delete**. The row keeps `isActive: true`, so a blocked user stays
visible to admin and user-directory reads (which are `isActive`-scoped) and can be
un-blocked through any api you model.

The account owner never writes the gate's property: the self-service `updateProfile`
(`PATCH /profile/:userId`) refuses it with **400** (`AdminManagedFieldsCantBeSelfUpdated`)
instead of letting a blocked user unblock itself, whatever api the project administers it
through. The admin `updateUser` and your own admin or machine apis keep writing it. The
same applies to any other custom user property that one of your declared update apis on
the user object administers: a role-gated api (`checkRoles`), or one that is neither an
owner door nor public and names its administrator (`absoluteRoles`, `M2MAllowed`, a machine
`requiredCallerKind`).

Two properties of the gate are worth knowing:

- **It runs after the password check.** Login never reveals an account's status to a caller
  who has not proved the identity, and a blocked user is told they are blocked rather than
  being pushed into a verify-your-email flow they cannot escape.
- **Where supported, it covers every path that mints a session**, not only `POST /login`:
  `relogin` re-reads the user row (so a refresh token issued before the block stops
  working), the api-key exchange refuses before it assembles a session (both the remote
  `validateApiKey` call and the auth service's own local admission), `mintSessionForUser`
  refuses to let a trusted peer impersonate a blocked user, an OAuth / social sign-in
  refuses before it mints, and auto-login after registration is skipped rather than handing
  out a session the login gate would refuse. Sessions minted *before* the block was applied
  live until they expire or are logged out: the gate is checked when a session is created.
- **A refusal is only as strong as its caller's handling.** Covering every mint path stops a
  session from being *issued*; it does not by itself stop a caller from carrying on without
  one. The agent chat surfaces (Telegram / WhatsApp) therefore treat a refused
  `mintSessionForUser` as a denial and stop the run, rather than continuing with the
  resolved user identity and no session behind it.

> **Target-language coverage.** The gate is implemented in the reference compiler's Node.js
> target. Services generated for other languages do **not** necessarily honor it on their
> native login, api-key and social-login paths, so do not rely on it as the sole moderation
> control in a project targeting those languages without checking the compiler's
> conformance statement ([the compiler specification](../../../compiler/index.md)).

Absolute roles (`superAdmin`) bypass 401/403 validation actions, so a super admin cannot
lock themselves out with this gate.

Design time refuses a gate that could never fire: the named property must be declared in
`authentication.userProperties`, it must come with at least one blocked value, and, for an
`Enum` property, every blocked value must be one of its options. Blocking every option is
allowed but warned about; leave the property's default value permitted so users created
before the gate existed can still log in.

## Two-factor authentication (2FA)

2FA differs from pre-verification: it happens **after** the password (or social) step, as a
second factor. Configure it under
[`LoginDefUserSettings`](../../../spec/LoginDefUserSettings.md):

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "email2FARequiredForLogin": true,
        "mobile2FARequiredForLogin": false
      }
    }
  }
}
```

When 2FA is enabled, the session carries a pending-second-factor flag:
`sessionNeedsEmail2FA` / `sessionNeedsMobile2FA`. Every interactive login door stamps the
same flags: the password login, `relogin` and the social login decide them from the same
settings. The code always has a channel to travel on: when a project declares no email or
SMS notification provider, the framework's last-resort sink provider carries it.

**A login second factor needs a required identity.** Every interactive login is stamped,
and the code goes to the user's email (or mobile), so a user who may have no email could
never finish a login. The design-time check `LOGIN_2FA_ON_OPTIONAL_IDENTITY` (an ERROR, so
a save of the authentication settings carrying the combination is refused) rejects:

| Setting | Not allowed with | Way out |
|---|---|---|
| `email2FARequiredForLogin: true` | an optional email (`primaryLoginIdentifier: "mobile"` with `secondaryIdentifierPresence: "optional"` or `"none"`; `"emailOrMobile"` with `dualIdentifierRegistration: "atLeastOne"`) | make the email required (`secondaryIdentifierPresence: "required"`, or `dualIdentifierRegistration: "both"`), or set `email2FARequiredForLogin` to `false` |
| `mobile2FARequiredForLogin: true` | an optional mobile (`primaryLoginIdentifier: "email"` with `secondaryIdentifierPresence: "optional"`; `"emailOrMobile"` with `"atLeastOne"`) | make the mobile required, or set `mobile2FARequiredForLogin` to `false` |

(An email-primary model with no mobile field at all is reported as
`MOBILE_FLAG_WITHOUT_MOBILE_FIELD`.) A **verification** requirement is different:
`emailVerificationRequiredForLogin` is allowed on an optional email, because it gates only
a user who has one (see above). The second factor is completed through the
`sendEmail2FACode` / `verifyEmail2FACode` (or `sendMobile2FACode` / `verifyMobile2FACode`)
APIs; a successful verify clears the flag on the live session, preserving its TTL.

### Per-user second factor (`allowUserLevel2FA`)

The flags above are project-global: every account is challenged at every login, or none is.
`allowUserLevel2FA: true` (default `false`) adds the per-user "two-factor authentication
on/off" setting on top:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": { "allowUserLevel2FA": true }
    },
    "verificationServices": {
      "email2Factor": { "email2FactorIsActive": true }
    }
  }
}
```

- The auth user object gains a framework-owned Boolean per channel whose 2FA flow is
  active: `email2FAEnabled` (with `email2Factor` active) and `mobile2FAEnabled` (with
  `mobile2Factor` active, on a user object that has a mobile). Both default to `false`.
  With neither flow active the option does nothing and validation warns
  `USER_LEVEL_2FA_WITHOUT_FLOW`.
- The password login, `relogin` by refresh token alone, and the social login stamp
  `sessionNeedsEmail2FA` for a user whose `email2FAEnabled` is `true`, and
  `sessionNeedsMobile2FA` for a user whose `mobile2FAEnabled` and `mobileVerified` are both
  `true` (the mobile 2FA start refuses an unverified mobile). This is in ADDITION to the
  global flags: `email2FARequiredForLogin` still challenges every user, enrolled or not. A
  `relogin` from a live session carries that session's own pending state, as for the global
  flags. The pending session completes through the same `sendEmail2FACode` /
  `verifyEmail2FACode` routes and is gated the same way.
- No register, `updateUser` or `updateProfile` door writes the flags, even when a project
  redeclares the column as its own user property.
- The session owner turns a factor on or off with a completed challenge of that channel:

  | API | Route | Body |
  |---|---|---|
  | `startEmail2FAEnrolment` | `POST /api/auth/verify/email-2factor-enrolment/start` | `{ enable: true \| false }` |
  | `completeEmail2FAEnrolment` | `POST /api/auth/verify/email-2factor-enrolment/complete` | `{ secretCode }` |
  | `startMobile2FAEnrolment` | `POST /api/auth/verify/mobile-2factor-enrolment/start` | `{ enable: true \| false }` |
  | `completeMobile2FAEnrolment` | `POST /api/auth/verify/mobile-2factor-enrolment/complete` | `{ secretCode }` |

  Start records the requested state with a fresh code and sends it to the channel (through
  the channel's 2FA start topic, so the 2FA notification delivers it); complete writes the
  recorded state after the right code. Both are `loginRequired` and NOT exempt from the
  second-factor gate, so a 2FA-pending session cannot enrol or disenrol
  (`403 EmailTwoFactorNeeded`, and `403 errMsg_TwoFactorEnrolmentNeedsCompletedLogin` in
  the flow itself). The subject and the session come from the bearer token, never from the
  body; the challenge is bound to the session that started it and lives at most 10 minutes
  (600 s; a shorter configured 2FA window, such as the mobile default of 300 s, still
  applies). Every submitted code is counted against the challenge before it is compared,
  atomically, so concurrent requests cannot share one attempt; the fifth wrong code
  discards it. Start answers `409 errMsg_TwoFactorEnrolmentUnchanged` when the account is
  already in the requested state, and `400 errMsg_TwoFactorEnrolmentEnableRequired` without
  a boolean `enable`.
- An administrator resets a user's enrolment (a lost handset) with `updateUser2FAEnrolment`
  (`PATCH /user2faenrolment/:userId`, the `updateUserVerification` gate and role-hierarchy
  guard).
- `GET /currentuser` returns `email2FAEnabled` / `mobile2FAEnabled` off the live user row.

The per-user factor is implemented by the Node.js, Java, .NET and Rust auth services of the
reference compiler. A build whose auth service is generated in another language refuses
`allowUserLevel2FA` at design time (`USER_LEVEL_2FA_LANGUAGE`): that login would not
enforce the enrolled factor, so no enrolment route is generated there. Where the language is
known only advisorily, validation warns `USER_LEVEL_2FA_LANGUAGE_UNSUPPORTED` instead.

### The 2FA routes are bound to the pending session

The four login 2FA APIs (`sendEmail2FACode`, `verifyEmail2FACode`, `sendMobile2FACode`,
`verifyMobile2FACode`) are declared `loginRequired: false`, because the caller is mid-login
and has not satisfied the gate yet, but they are **not** anonymous. The generated service
binds each of them to the pending session the login leg just minted: the subject and the
session id are read from the session the bearer token resolves to (on every request,
regardless of `loginRequired`), the `userId` / `sessionId` request parameters are
cross-checked against it and a mismatch is a `403`, and a call carrying no resolvable
session is a `401`. Complete additionally requires the stored challenge to name the same
owner, and returns only
`{ status, isVerified, userId, sessionId, sessionNeedsEmail2FA, sessionNeedsMobile2FA }`,
never the cached session record. So a code delivered to one account's channel cannot satisfy
another account's session, and the resend window is keyed on a session id the caller cannot
choose.

Enforcement of a pending flag: the login stamps the flag, and the generated service
refuses a 2FA-pending session with HTTP 403 and an error code `EmailTwoFactorNeeded` /
`MobileTwoFactorNeeded` on every API except the exempt set (`logout`, `currentUser`,
`relogin`). The four send/verify 2FA APIs are `loginRequired: false`, so they never reach
that gate and need no exemption entry; they carry their own session binding instead,
described above. The exact body of the refusal (for example a `code` / `message` pair
versus problem+json fields) follows the target language's error serialization; match on
the code `EmailTwoFactorNeeded` / `MobileTwoFactorNeeded`. For how a service
enforces this see [the compiler specification](../../../compiler/index.md).

The 2FA channel itself is configured under `verificationServices.email2Factor` /
`mobile2Factor` (see [Verification services](./verification-services.md)).

## See also

- [Access tokens](./access-tokens.md): token lifetime, key rotation, read order.
- [Social logins](./social-logins.md) / [SSO](./sso.md): alternative login flows.
- [Verification services](./verification-services.md): the underlying email / mobile / 2FA
  / password-reset flows.
- Spec: [`LoginDefinition`](../../../spec/LoginDefinition.md),
  [`LoginDefUserSettings`](../../../spec/LoginDefUserSettings.md),
  [`JWTAuth`](../../../spec/JWTAuth.md).
