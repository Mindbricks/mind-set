---
title: Social logins
---

# Social logins

The `auth` service supports social login through **Google, Apple, Facebook, Microsoft,
LinkedIn, GitLab, and GitHub**. Each brand you want is one entry of the social login provider
family, [`socialLoginProvidersSettings`](../../../spec/SocialLoginProvidersSettings.md) under
`projectSettings` (see [Where social login is configured](#where-social-login-is-configured)).

Behind the scenes the generated service runs OAuth2 flows to authenticate the user and extract
profile data (e.g. email). Once the provider returns the profile:

- If this provider account is already linked to a user (it registered the account, or signed in
  to it earlier with a verified email), that user is signed in (see [the provider account
  link](#the-provider-account-link)).
- Otherwise, if a user with that email already exists, they are logged in ONLY when the
  provider's email counts as verified (see [the `emailVerification`
  setting](#when-a-social-login-marks-the-email-verified)). Otherwise the sign-in is refused with
  `403 errMsg_SocialLoginEmailNotVerified` and the user signs in with the account's existing
  method.
- If not, the auth service returns a registration-needed response with a short-lived
  `socialCode` reference.

The frontend then exchanges `socialCode` to complete registration or receive a direct login
result. The final outcome is identical to native login: a JWT session is issued (see [Access
tokens](./access-tokens.md)).

```plaintext
Security note:
Once the user model is created, subsequent sessions are native JWT-based
sessions. Permissions, roles, and access control apply exactly as with
native login.
```

## Where social login is configured

Social login is a provider family, like payment or AI providers: one entry per brand in
`projectSettings.socialLoginProvidersSettings.socialLoginProviders`.

```json
{
  "projectSettings": {
    "socialLoginProvidersSettings": {
      "socialLoginProviders": [
        {
          "name": "google",
          "provider": "google",
          "configuration": {
            "clientId": "yourGoogleClientIdHere",
            "clientSecret": "yourGoogleClientSecretHere"
          },
          "emailVerification": "providerSignal"
        }
      ]
    }
  }
}
```

- **An entry in the list is active.** There is no enable flag; remove the entry to turn the
  brand off.
- **One entry per brand.** A second entry of the same brand is the validation error
  `SOCIAL_LOGIN_PROVIDER_DUPLICATE_BRAND`. The auth service reads every brand from fixed
  environment variable names (`GOOGLE_CLIENT_ID`, ...), so two entries could never be told
  apart. A different OAuth client per environment (a sandbox client for test deployments, the
  live client for production) is an environment value of the one entry, not a second entry.
- **Missing credentials never block.** Validation, the build and the start-up do not fail on a
  missing `clientId` / `clientSecret`: the login route of the brand answers a typed 503 until
  they are set (see [A provider without an OAuth client](#a-provider-without-an-oauth-client)).
- **No mock.** There is no runtime mock OAuth, so the credential mode `mock` is refused for this
  family.

### The legacy location: `authentication.socialLogins`

Projects created before the family keep their social logins under
`authentication.socialLogins.<brand>` (`use<Brand>Login`, `configuration`,
`emailVerification`). They keep working unchanged and emit the same generated code: every reader
normalizes an enabled legacy brand (`use<Brand>Login: true` with a `configuration`) into a
family entry named after the brand. A legacy brand that is switched off produces no entry.

- Validation marks each enabled legacy brand with the info `SOCIAL_LOGIN_LEGACY_LOCATION`.
- When a brand is in both places, the provider entry wins and validation warns with
  `SOCIAL_LOGIN_PROVIDER_SHADOWS_LEGACY`, naming both locations.
- Moving a legacy entry into the family is an authoring edit: write one provider entry per
  enabled legacy brand and switch the legacy entry off. A hosting platform may offer a tool that
  does this for you; nothing moves automatically.

## When a social login marks the email verified

A provider that merely returns an email address does not make it verified. Each provider carries
an `emailVerification` setting that decides when its email counts as verified:

| `emailVerification` | The email counts as verified when |
|---|---|
| `providerSignal` (default) | the provider's own verification signal says so (table below) |
| `requireVerification` | never: the account verifies through the normal email verification flow |
| `trusted` | always |

```json
{
  "name": "microsoft",
  "provider": "microsoft",
  "emailVerification": "trusted",
  "configuration": {
    "clientId": "yourMicrosoftClientIdHere",
    "clientSecret": "yourMicrosoftClientSecretHere",
    "tenant": "00000000-0000-0000-0000-000000000000"
  }
}
```

(The block above is one entry of `socialLoginProviders`, shown as a fragment.)

> **Warning - `trusted`.** Use `trusted` only for a deployment locked to ONE directory you
> control: for Microsoft, `configuration.tenant` set to your own directory ID, as above. An app
> that accepts accounts from any directory (Microsoft `tenant` `common` - the default -,
> `organizations` or `consumers`) receives addresses the provider has not verified, so `trusted`
> must not be used there. Design time reports that combination as the warning
> `SOCIAL_LOGIN_TRUSTED_EMAIL_OPEN_DIRECTORY`.

The decision is made once per sign-in, before anything else reads the profile, and it drives
three things:

1. **The `emailVerified` identity grant.** A new user registered with the `socialCode` is
   created with `emailVerified: true` only when the email counts as verified; an existing user
   reached by the sign-in gets the flag flipped true.
2. **Whether the sign-in may reach an existing account by its email.** An existing account with
   the same email is signed in to ONLY when the email counts as verified. An email that does not
   count as verified never signs in to an existing account by email: the callback answers
   `403 errMsg_SocialLoginEmailNotVerified` (through the SPA error redirect, or as the
   problem+json `detail` on the direct flow), and the user signs in with the account's existing
   method or uses a provider whose email counts as verified. The one exception is a provider
   account already [linked](#the-provider-account-link) to the user: it is matched by the
   provider's account id, not by the email.
3. **What the registration-needed envelope reports.** `accountInfo.emailVerified` and
   `accountInfo.grants.emailVerified` carry the decided value.

A self-hosted login service that declares its own [`OAuthFlow`](../../../spec/OAuthFlow.md) sets
the same decision in `flowBasics.emailVerification`, and its `emailVerified` identity grant
should keep the canonical condition `profile.emailVerified === true`. An authored
`emailVerified` grant with any other condition is evaluated together with the decision:
`emailVerified` is granted only when the condition holds AND the email counts as verified, so a
condition can narrow the decision (for example to one domain) but never widen it. Design time
reports such a grant as the warning `OAUTH_EMAIL_VERIFIED_GRANT_NOT_CANONICAL`; to change when an
email counts as verified, change `flowBasics.emailVerification`.

With `providerSignal`, the service sets the profile's `emailVerified` only from a verification
signal the provider guarantees:

| Provider | `emailVerified` is true when |
|---|---|
| Google | the userinfo `email_verified` / `verified_email` flag is `true` |
| Apple | the ID token's `email_verified` is `true` (or `"true"`) |
| LinkedIn | the OIDC userinfo `email_verified` is `true` |
| GitHub | the address is the `/user/emails` entry marked primary AND verified; a profile with a public email makes no emails call and stays unverified |
| GitLab | the `/api/v4/user` profile carries a `confirmed_at` timestamp |
| Microsoft | the ID token carries `xms_edov: true` (email domain owner verified) and its `email` claim is the stored address; the Graph `mail` / `userPrincipalName` never count, since a directory admin can set them to any address. `xms_edov` is an Entra optional claim: add it (and `email`) to the app registration's ID token claims to get verified Microsoft emails |
| Facebook | never (the Graph API exposes no verification flag) |

So with the default setting a Facebook sign-in (no verification signal) can register a new
account, and signs in again to the account it registered through the [provider account
link](#the-provider-account-link), but never reaches any OTHER existing account by its email; set
`emailVerification: "trusted"` on Facebook only if you accept its addresses as verified.

An unverified social registration is not refused. The account is created with
`emailVerified: false`; when the project requires a verified email for login
(`emailVerificationRequiredForLogin`) the registration answers `emailVerificationNeeded: true`,
no session is issued, and the user verifies through the normal email verification flow before
logging in. Users created before this rule are not rewritten.

### The social login honours the login verification requirement

The social login is a login door like the password login and applies the same
`LoginDefUserSettings` requirements before it issues a session:

- `emailVerificationRequiredForLogin`: a user who HAS an email whose `emailVerified` is not
  `true` (after the sign-in's own grant was applied) is refused with
  `403 errMsg_EmailNotVerified`.
- `mobileVerificationRequiredForLogin` (projects with a mobile identity): a user who HAS a mobile
  whose `mobileVerified` is not `true` is refused with `403 errMsg_MobileNotVerified`.

Both use the password login's codes and conditions. A user without that identity, possible only
where the project makes it optional, is not refused by this gate; where the identity is required
the check stays strict.

### A service without a signing identity

A social sign-in that reaches an account mints a session token with the service's signing
identity. When the service has none, the callback answers the same curated, retryable error the
password login answers: on the direct flow a `503` problem+json body with
`errorCode: "AUTH_SIGNING_KEY_MISSING"`, `retryable: true` and a fixed detail that names no
environment variable; on the SPA flow the error redirect carries
`{ type: "error", message, errorCode: "AUTH_SIGNING_KEY_MISSING", status: 503, retryable: true }`.
No token is issued. Retrying after the signing identity is provided starts a fresh sign-in. Only
the token mint raises this curated error. On the direct flow, other callback failures (including
a database 503) still answer the generic `500 OAuth failed`; the SPA flow keeps its existing
error redirect envelope for those failures.

The session is a snapshot of the user record taken at login: a verification completed after the
login updates the user record, but the live session keeps the login-time `emailVerified` until
the user signs in again. Read the user record, or ask for a re-login, before relying on the fresh
value.

## The provider account link

Every provider identifies the account that signed in with a stable id (the OIDC `sub`, or the
provider's user id). The auth service of a project with social login keeps a `userSocialAccount`
data object that links that id to a user:

| Field | Meaning |
|---|---|
| `userId` | the linked user |
| `provider` | the provider name (`google`, `facebook`, ...) |
| `providerSubject` | the provider's id of the account |
| `createdAt` | when the link was written |

`(provider, providerSubject)` is unique. In a multi-tenant project the link is tenant-level like
the user, so the key also carries the tenant and the same provider account can be linked once in
each tenant.

The framework writes the link itself, from what the service's own OAuth callback proved, never
from a client-sent provider id, in three places:

1. **At a social registration.** The OAuth callback stores the provider and the account id in the
   `socialCode` grant, and the register api links the new user to them after the user is created.
2. **At a sign-in that reaches an existing account by a verified email.** The first such sign-in
   links the provider account, so later ones match by the link. This happens only while the
   account holds NO link for that provider (see below).
3. **At an explicit link by the signed-in user** (`linkMySocialAccount`, see [Listing, unlinking
   and linking your own provider
   accounts](#listing-unlinking-and-linking-your-own-provider-accounts)).

A social sign-in looks for a link FIRST. When one exists and its user is active, the sign-in
reaches that user whatever the provider says about the email, so a person who registered through
a provider with no verification signal (Facebook by default, or a Microsoft account without
`xms_edov`) signs in again through the same provider account. A DIFFERENT provider account with
the same email has no link and goes through the email rule above, so an unverified email still
never reaches the account. A link whose user is gone (deleted or archived) is ignored, and a
later link of the same provider account replaces it. The `(provider, providerSubject)` key is
insert-only, so every write is conditional: a writer (the sign-in, the registration, the explicit
link) removes an existing row only after it read the row's owner and found that user gone (a
registration needs the owner read as archived; a failed owner read never counts as gone), and a
row an active user owns is never moved, also when two writes race; the later write is refused.

Everything else is unchanged for a user reached by the link: the account status gate,
`emailVerificationRequiredForLogin` / `mobileVerificationRequiredForLogin` and the second factor
apply exactly as for any other sign-in, including the rule that they refuse only a user who has
the identity unverified. A social registration always carries the provider's email (the callback
refuses a profile without one), so in a project that requires a verified email for login, a
Facebook-registered user first verifies the email through the normal email verification flow, and
from then on signs in with Facebook. The provider's identity grants are written back only when
the linked user's email is the provider's address; a user who has since changed the email gets
none of them.

### One provider account per provider, unless linked explicitly

An account that already holds a link for a provider is reached through that provider ONLY by the
linked provider account. A sign-in through the same provider with a DIFFERENT account id, or with
no account id, whose verified email matches the account is refused with
`403 errMsg_AccountLinkedToAnotherProviderAccount`, whatever the `emailVerification` setting says
(`trusted` included): a verified email proves control of the mailbox, not that this provider
account is the one the user linked. Nothing is minted, linked or written back. Linking a second
account of the same provider needs an authenticated, explicit link by the signed-in user
(`linkMySocialAccount` below), never a sign-in; replacing a provider account the user lost access
to is an unlink followed by a sign-in. A link of ANOTHER provider does not count: a user linked
through Facebook can still sign in through Google with a verified email, and that sign-in links
the Google account.

A provider that sends no account id, and an `OAuthFlow` hosted by a service that does not own a
`userSocialAccount` object, keep the email-only match (with no link of that provider on the
account). Accounts registered before the link existed have no link; their first sign-in with a
verified email creates one.

### Listing, unlinking and linking your own provider accounts

The auth service of a project with social login declares three Business APIs over
`userSocialAccount` for the signed-in user (not every target language generates them yet). All
three require a full session (a 2FA-pending or password-change-pending session is refused by the
login gate like any business route) and touch ONLY the caller's own links: the caller is the
session owner, never a request field, and in a multi-tenant project the generated tenant filter
also pins every read and delete to the session tenant.

| API | Route | What it does |
|---|---|---|
| `listMySocialAccounts` | `GET /mysocialaccounts` | The caller's links (`id`, `provider`, `providerSubject`, timestamps). |
| `unlinkMySocialAccount` | `DELETE /mysocialaccounts/:userSocialAccountId` | Deletes one of the caller's links (a hard delete: a link has no soft delete). Another user's or another tenant's link id resolves no row and answers 404. |
| `linkMySocialAccount` | `POST /mysocialaccounts` `{ socialCode }` | Links the provider account of a completed OAuth sign-in to the caller. |

**The link takes the provider account from the server-side grant only.** Every OAuth callback
stores a short-lived (180 s), single-use grant under the `socialCode` it answers with;
`linkMySocialAccount` reads the provider and the provider account id from that grant, never from
the request body. It refuses:

| Status | Error | When |
|---|---|---|
| 400 | `errMsg_SocialLinkGrantNotFound` | no grant under that code: expired, already used (also by a concurrent request that claimed it first), or not a code the callback minted |
| 400 | `errMsg_InvalidSocialLoginTenant` | multi-tenant: the grant was minted in another tenant than the caller's session |
| 400 | `errMsg_SocialLinkGrantHasNoSubject` | the provider sent no account id |
| 409 | `errMsg_SocialAccountLinkedToAnotherUser` | that provider account is linked to another active user (of this tenant); it is not moved |
| 409 | `errMsg_DuplicateRecord` | another request linked the same provider account at the same moment and its write landed first; nothing was moved |
| 500 | `errMsg_SocialLinkGrantUnavailable` | the grant store failed while reading or claiming the code; the link is refused |

A link of the same provider account to the caller itself, or a link whose user is gone (archived
or deleted), is rewritten for the caller (the held row is deleted and written again). The code is
single use: after the checks above it is claimed by one atomic delete, so of two requests
redeeming the same code exactly one links and the other is refused with
`400 errMsg_SocialLinkGrantNotFound`. A refusal before the claim (401, the 400s and the
`errMsg_SocialAccountLinkedToAnotherUser` 409 above) leaves the code usable until it expires.

**Where the client gets the `socialCode`.** The callback answers it in the registration-needed
envelope and in the SPA redirect, and, for this link, in the two refusals of an existing account:
`403 errMsg_AccountLinkedToAnotherProviderAccount` and `403 errMsg_SocialLoginEmailNotVerified`
carry a `socialCode` field (in the problem JSON of the direct flow, and in the base64url `error`
envelope of the SPA redirect). A signed-in user who wants to add the refused provider account
posts that code to `linkMySocialAccount`. The link always goes to the caller's own account, never
to the account that was refused. The code itself is a short-lived bearer credential, as for a
social registration: whoever holds it within its 180 s can link that provider account to THEIR
own account. Keep it out of logs, analytics and shared URLs, and drop it once it is used or
expired.

**Recovering a lost provider account.** `listMySocialAccounts`, then `unlinkMySocialAccount` for
the old link. The next sign-in through the new provider account with a verified email is no
longer refused with `errMsg_AccountLinkedToAnotherProviderAccount` and links it (rule 2 above); a
provider whose email does not count as verified is linked with `linkMySocialAccount` instead.

Should a target language ever emit `linkMySocialAccount` without the grant consumption, the
declarative `requireSocialLinkGrant` check refuses every link with
`400 errMsg_SocialLinkGrantNotFound` rather than writing one.

## Frontend URL and auth callback

After OAuth processing, the auth service redirects the browser back to the frontend's callback
page. The redirect URL is resolved at runtime:

1. If `SOCIAL_LOGIN_REDIRECT_URL` is explicitly set in the deployment environment, that value is
   used as-is.
2. Otherwise the auth service derives it from `FRONTEND_URL + /auth/callback`.

**`FRONTEND_URL`** is an environment variable set from the project's `frontendUrl` setting in
the basic project settings ([`BasicProjectSettings`](../../../spec/BasicProjectSettings.md)
`.frontendUrl`). It holds the base URL of the frontend for the current environment and is also
used for email notification links, password-reset URLs, and other frontend-facing URLs. Override
it for any environment by configuring `frontendUrl` (e.g. a custom domain
`https://app.mycustomdomain.com`); the defaults for environments where it is not configured are
compiler- and platform-specific.

**The frontend must serve a page at `/auth/callback`** (relative to `FRONTEND_URL`): the default
route the auth service redirects to after OAuth. The callback page receives query parameters
(`provider`, `socialCode`, or `error`) and exchanges the `socialCode` for the full session via
`POST /auth/social-login-result`.

Every callback failure comes back to this page with an `error` parameter, a base64url JSON
envelope. The failures raised before the provider profile is read carry
`{ type: "error", message, errorCode, status }`; a failure raised later, while the user is looked
up or the session is minted, carries `{ type: "error", message }` (the two 503s, session store
and signing key unavailable, also carry `errorCode`, `status` and `retryable: true`):

| Failure | `status` | `errorCode` |
|---------|----------|-------------|
| The user cancelled on the provider's consent screen (`?error=access_denied` or a provider cancel code) | 400 | `errMsg_OAuthAccessDenied` |
| Any other provider-reported `?error=` | 400 | `errMsg_OAuthProviderError` |
| No authorization code on the callback | 400 | `errMsg_OAuthCodeMissing` |
| Missing, expired, replayed, forged or another browser's OAuth state, a state minted for another brand (multi-tenant: or a tenant that does not match it); see [Browser-bound state](#browser-bound-state-and-pkce) | 400 | `errMsg_InvalidSocialLoginState` / `errMsg_InvalidSocialLoginTenant` |
| The provider refused the code exchange | 401 | `errMsg_OAuthTokenExchangeFailed_<provider>` |
| The provider could not be reached for the code exchange | 502 | `BAD_GATEWAY` |

The provider's own error text (`error_description`) and any upstream response text are never
forwarded. The redirect target is always the configured one, never a value from the request.
Without `SOCIAL_LOGIN_REDIRECT_URL` and `FRONTEND_URL` the same failures answer an
`application/problem+json` body on the auth host (some target languages answer their JSON error
body `{ "status": "ERR", "message": <key> }` there instead). A target whose exchange leg has no
trusted 401 reports a provider that refused the code exchange as `502` / `BAD_GATEWAY`.

In rare cases where a different callback path is needed, `SOCIAL_LOGIN_REDIRECT_URL` can be set
explicitly (as a custom variable in the project settings or a deployment environment variable).
Usually you do not need it: the `FRONTEND_URL`-derived default suffices.

### Browser-bound state and PKCE

Every start route (`GET /auth/<brand>`, every brand, the legacy `socialLoginSettings` entries and
the provider-family entries alike) binds the flow to the browser that started it, so the callback
can tell a sign-in this browser began from one an attacker began in their own browser and then
planted (login CSRF). Where supported, the start:

1. mints a **signed state**: a service-identity token of the auth service itself (with a purpose
   marking it as a social-login state; the multi-tenant portal leg below uses a distinct purpose),
   valid for 300 seconds, naming the brand, the registered callback URI and the hash of the
   cookie secret below. It rides to the provider as the OAuth `state` parameter;
2. stores a **one-shot nonce** for it with the same lifetime;
3. sets an **HttpOnly correlation cookie** scoped to the brand on the service's `/auth` path (the
   gateway base path included) holding a random browser secret, `SameSite=Lax`, `Secure` when the
   callback URI is https. The provider sends the browser back with a top-level GET, which a Lax
   cookie travels with; it never travels on a cross-site POST or a subresource request. The one
   exception is a brand whose callback is a cross-site POST (Apple's `response_mode=form_post`):
   its cookie is `SameSite=None; Secure` on https. On a plain-http callback URI (local
   development) a Secure cookie cannot be set, so Apple falls back to Lax there and its real
   callback needs an https callback URI (a tunnel) or a same-site simulation;
4. for a brand that documents PKCE on its authorization-code flow (Google, Microsoft, GitLab) adds
   `code_challenge` and `code_challenge_method=S256` to the authorize URL and sends the matching
   `code_verifier` at the token exchange. The verifier is derived from the browser's cookie
   secret and never appears in the URL, the state or the nonce store, so an authorization code
   read off a redirect cannot be redeemed without that browser. GitHub, Facebook, LinkedIn and
   Apple document no PKCE and get the same authorize URL and exchange body they always did; the
   signed state and the cookie guard them.

The callback (`GET|POST /auth/<brand>/callback`) runs the state gate before it reads the
provider's `error`, the `code` or anything else: a callback with no `state`, a state whose
signature, purpose, audience or expiry does not verify, a state minted for another brand or
another callback URI, a state whose cookie is missing or hashes to a different value (compared in
constant time), and a state whose nonce was already consumed are all refused with
`400 errMsg_InvalidSocialLoginState` through the SPA failure envelope (or problem+json without an
SPA target), before any token exchange, user lookup or session effect. An unverified caller never
clears the cookie, so an attacker's planted state cannot cancel a flow the victim has in
progress. The nonce is consumed atomically once the browser has proved possession, so two racing
callbacks on one state succeed at most once; the happy path then clears the cookie, exchanges the
code (with the PKCE verifier where applicable) and signs the user in exactly as before, refresh
token included when `refreshTokenSettings.useRefreshToken` is on.

What this asks of the frontend and the deployment:

- Start the flow with a **full-page navigation** to `GET /auth/<brand>`
  (`window.location.href = ...`), never with `fetch`/XHR: the start answers a 302 and a
  `Set-Cookie` the browser must store on the auth service's origin. Do not open it in a popup or
  iframe whose cookie jar the callback will not see, and never copy or proxy the cookie into
  application storage.
- The cookie is a **host cookie**: it lives on the host of the callback, the brand's configured
  redirect URI when one is set, otherwise the service URL plus `/auth/<brand>/callback`. A start
  that arrives on any other host (a frontend on a custom domain that calls the auth API
  same-origin while the service URL names the platform host, say) mints nothing there: it answers
  a 302 to the same start route on the callback host (callback origin and base path, the original
  query kept, plus a one-hop marker so it never bounces twice), and the flow runs and ends on that
  host. A tenant selector the start was given in a header rides the hop as the tenant query
  field, since a redirect drops headers. The result exchange (`POST /auth/social-login-result`)
  does not depend on the host, so the SPA still finishes on its own domain. The host compared is
  the one the request names, `X-Forwarded-Host` first; a proxy that hides the public host costs
  one extra hop, never a loop. To keep the whole flow on the custom domain instead, configure the
  brand's redirect URI as that domain's callback URL and register it with the provider. A browser
  or privacy mode that drops third-party cookies still keeps this first-party cookie.
- An API probe of the start route (on the callback host, or following the one hop above) must
  expect a 302 whose `Location` carries `state` (and, for
  Google / Microsoft / GitLab, `code_challenge` + `code_challenge_method=S256`) and a `Set-Cookie`
  of the brand's correlation cookie with `HttpOnly`; a probe that then calls the callback with a
  bare `code` must expect `400 errMsg_InvalidSocialLoginState`, and must carry the state and the
  cookie to exercise the exchange.
- A user who waits more than 300 seconds on the consent screen, or opens the callback in another
  browser, sees the state refusal: show "session expired, try again" and restart from the start
  route.

### Multi-tenant projects

The generated OAuth router is emitted for the project's tenancy, decided from the blueprint when
the code is generated (multi-tenant means `tenantSettings.useMultiTenantFeature: true` with a
named tenant), not checked again on every request. On a multi-tenant project a start with an
explicit non-root tenant selector registers the common portal (`/auth/social-login-redirect`) as
the provider's redirect URI and the signed state additionally carries that tenant; the portal
verifies the state and the cookie and forwards to the brand's callback, which restores the exact
tenant before the token exchange, scopes the account lookup to it (a callback with no resolved
tenant is refused) and binds the registration grant and the session to it. A root start takes the
direct leg above with a state that names no tenant; a direct state is refused at the portal and a
portal state at a single-tenant callback. On a single-tenant project none of the tenant code is
emitted. Changing the tenancy setting therefore needs a rebuild of the service, like any other
blueprint change.

## Per-provider setup

Each entry holds the brand in `provider`, an optional `emailVerification` setting (default
`providerSignal`, see [above](#when-a-social-login-marks-the-email-verified)) and a
`configuration` object with the brand's credentials
([`SocialLoginProviderConfig`](../../../spec/SocialLoginProviderConfig.md)).

| Brand | `configuration` keys |
|---|---|
| `google`, `facebook`, `linkedin`, `github`, `gitlab` | `clientId`, `clientSecret` (Facebook: the App ID and App Secret) |
| `microsoft` | `clientId`, `clientSecret`, optional `tenant` (default `common`) |
| `apple` | `clientId` (the Services ID, not the App ID), `teamId`, `keyId`, `privateKey` (the `.p8` key contents) |

### Apple

```json
{
  "name": "apple",
  "provider": "apple",
  "configuration": {
    "clientId": "com.example.web.signin",
    "teamId": "ABCDE12345",
    "keyId": "XYZ987WVUT",
    "privateKey": "<contents of the .p8 key file>"
  }
}
```

(One entry of `socialLoginProviders`, shown as a fragment.)

### GitHub

A GitHub OAuth App takes ONE callback URL. Use a separate OAuth App per environment and enter its
client as an environment value of the one `github` entry.

The blueprint expects plain strings, not nested secret descriptors. Enter the real values through
the secret handling of your hosting platform rather than authoring them into a blueprint file.

### Where the credentials end up

Each social login entry becomes environment variables of the generated services, under the same
fixed names whether the entry is a provider entry or a legacy one. The secret ones go only to the
service that hosts the OAuth routes: a login service (`serviceAllowsUserToLogin`, the auth service)
or a service that declares an OAuthFlow and owns the `user` and `userSession` objects. Every other
service gets the ids but no secret.

SSO authentication is unavailable. No SSO environment variables or deploy secrets are generated;
enabling SSO is refused with `SSO_NOT_SUPPORTED`.

| Setting | Env variable |
|---|---|
| `clientId` | `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `MICROSOFT_CLIENT_ID`, `LINKEDIN_CLIENT_ID`, `GITHUB_CLIENT_ID`, `GITLAB_CLIENT_ID`, `APPLE_CLIENT_ID` |
| `clientSecret` | `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_SECRET`, `MICROSOFT_CLIENT_SECRET`, `LINKEDIN_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`, `GITLAB_CLIENT_SECRET` |
| Apple `privateKey` | `APPLE_PRIVATE_KEY` |
| Apple `teamId` / `keyId`, Microsoft `tenant` | `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `MICROSOFT_TENANT` |

The secrets never reach committed source: the secret variables are left blank in committed
configuration and injected into the service's environment at deployment. How a compiler and its
hosting platform store and inject them is described in [the compiler
specification](../../../compiler/index.md). The provider secrets (AI, payment, bucket, ...) are
handled the same way.

### Pointing a provider at another host

A deployment can point a provider at a self-hosted, regional or Enterprise endpoint (or a test at a
local mock provider) with `<PROVIDER>_AUTHORIZE_URL`, `<PROVIDER>_TOKEN_URL` and
`<PROVIDER>_PROFILE_URL` (for example `GITHUB_PROFILE_URL=https://ghe.example.com/api/v3/user`).
When the GitHub profile carries no public email, the service reads the user's email list, and that
call stays on the configured host too: `GITHUB_EMAILS_URL` when set, otherwise
`<profile URL>/emails` for a profile path ending in `/user`, otherwise `/user/emails` on the
profile URL's host. Only with no override at all does it call `https://api.github.com/user/emails`.

## Social-login registration behavior

Social login for new users is a **two-step flow**:

1. The OAuth callback authenticates the user and creates a short-lived `socialCode`.
2. The frontend exchanges `socialCode` via `POST /auth/social-login-result`.
3. If the user does not exist, the backend returns `type: RegisterNeededForSocialLogin` with:
   - `message`
   - `socialCode`: echoed back so the frontend always has the code the register call needs
   - `accountInfo` (the profile fields from the provider, plus the `grants` the provider proved).
     The same profile fields are repeated flat at the response root for convenience.

   `type` is the discriminator: a login outcome is the flat session and never carries it.

The frontend then has two registration paths:

- **Direct registration with social profile data.** Call the register API with `socialCode` and
  minimal fields; the backend complements the user from the social profile.
- **Registration with additional input.** First collect missing/required fields (e.g. mobile or
  custom required properties), then call register with those plus `socialCode`.

The register API resolves social profile data by `socialCode`, merges the provided fields, creates
the user, and links it to the provider account (see [the provider account
link](#the-provider-account-link)).

### Legacy migration note

Older projects may still contain `useForRegister` in social-login configurations. During current
write/migration flows this legacy field is removed automatically, and social-login registration
follows the current default model.

## Callback failures before sign-in completes

The generated callbacks use `SOCIAL_LOGIN_REDIRECT_URL`, or `FRONTEND_URL` plus `/auth/callback`,
as the SPA failure target. With neither configured, failures keep their problem+json response. The
target comes from deployment configuration. Callback request fields never select it.

State and tenant validation precede provider consent errors, code validation and code exchange (a
callback without a state is itself refused: every start mints one, see [Browser-bound
state](#browser-bound-state-and-pkce)). A provider consent refusal returns
`errMsg_OAuthAccessDenied`; other provider errors return `errMsg_OAuthProviderError`. The SPA
receives a 302 with `provider` and a base64url JSON `error` containing `type`, `message`,
`errorCode`, and `status` (and `retryable` when applicable). Provider descriptions and untrusted
exchange text are excluded. Apple form_post failures follow the same contract. A portal state
refusal names a provider only after both the signed state and browser correlation have verified.

## A provider without an OAuth client

A brand whose required credential variables are blank on a deployment (`<BRAND>_CLIENT_ID` /
`<BRAND>_CLIENT_SECRET`, Facebook `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`, Apple
`APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY`) is not reached with an
empty client id. The service starts and every other route keeps working; the brand's start route
and its callback answer `503` with `errorCode: "OAUTH_PROVIDER_NOT_CONFIGURED"`, as problem+json or
through the SPA failure redirect (whose `message` is the key
`errMsg_OAuthProviderNotConfigured_<brand>`, for example
`errMsg_OAuthProviderNotConfigured_google`). The service log names the blank variables
(`OAuthProviderNotConfigured`), never their values. Set the credentials and redeploy.

## See also

- [Login](./login.md): the native login flow social login converges on.
- [Access tokens](./access-tokens.md): the session issued after social login.
- Spec: [`SocialLoginProvidersSettings`](../../../spec/SocialLoginProvidersSettings.md),
  [`SocialLoginProvider`](../../../spec/SocialLoginProvider.md),
  [`SocialLoginProviderConfig`](../../../spec/SocialLoginProviderConfig.md); the legacy location:
  [`SocialLoginSettings`](../../../spec/SocialLoginSettings.md).
