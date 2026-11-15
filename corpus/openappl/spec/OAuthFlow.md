# OAuthFlow

**Level:** `chapter` · **Family:** [OAuthFlow](../ontology/families.md#oauthflow) (domain `Service`)

**Ontology:** [OAuthFlow in Part 1](../ontology/OAuthFlow.md)

**Name:** an instance is named by `flowBasics.provider`.

A declarative OAuth redirect flow hosted by the service. Each flow exposes its own REST start route (redirects the browser to the provider's authorize URL) and callback route (exchanges the code for a token and fetches the user's profile via the config-driven common OAuth runtime). On the auth service the callback completes the login (find-or-register the user + mint a session) and stashes a one-time `socialCode` result the portal exchanges; every flow also publishes its `completeKafkaTopic` completion event so other services can react. Replaces the hand-written social-login router. Provider credentials come from env (e.g. GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET; Apple uses TEAM_ID/KEY_ID/PRIVATE_KEY for its ES256 client secret).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `flowBasics` | [`OAuthFlowBasics`](./OAuthFlowBasics.md) | yes |  |  |  | Provider binding, scopes, start/callback routes, completion topic and the register policy. |
| `grants` | [`OAuthIdentityGrant`](./OAuthIdentityGrant.md)[] | no |  |  |  | Identity grants — which application user identities this provider VERIFIES. Each grant maps a user verification column (e.g. emailVerified, mobileVerified) to a condition over the normalized OAuth `profile`; when the condition is truthy the runtime marks that identity verified — at login (flips the existing user's flag) and at registration (the bare-socialCode grant the register flow consumes server-side). Provider-intrinsic: a new provider (incl. KYC/wallet providers granting extra identities like a verified real name) arranges its grants here, never trusting a client-supplied flag. Most email-based providers grant `emailVerified` when `profile.emailVerified === true`; `profile.emailVerified` is the value flowBasics.emailVerification decided, not the raw provider answer. The grants do NOT decide whether a sign-in may reach an existing account: that is flowBasics.emailVerification alone. An emailVerified grant is always capped by that decision: a condition other than the canonical `profile.emailVerified === true` is evaluated ANDed with it, so it can narrow flowBasics.emailVerification but never widen it, and design time warns about it (OAUTH_EMAIL_VERIFIED_GRANT_NOT_CANONICAL). |

## Constraints

Property rules:

- `flowBasics` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `grants` must have distinct names (`identity`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `OAUTH_EMAIL_VERIFIED_GRANT_NOT_CANONICAL` | warning | This emailVerified grant's condition is not the canonical "…". |
| `OAUTH_FLOW_HOST_COLUMNS_EXTRA_REQUIRED` | error | An OAuthFlow needs the … data object to require NO MORE columns than the emitted OAuth callback writes to it. |
| `OAUTH_FLOW_HOST_COLUMNS_MISSING` | error | An OAuthFlow needs the … data object to declare the columns the emitted OAuth callback writes to it, not just to exist. |
| `OAUTH_FLOW_SERVICE_UNSUPPORTED` | error | An OAuthFlow may only be declared on a service that owns the … data objects — the emitted OAuth callback finds or registers the user and mints their session through that service's own db layer. |

## Migration

> **Warning:** deprecated and relocated properties. They are listed so that older blueprints can be updated; new blueprints must not use them.

| Property | Status | Use instead | Note |
| --- | --- | --- | --- |
| `provider` | moved | `flowBasics.provider` | Write the value at the new path. |
| `scopes` | moved | `flowBasics.scopes` | Write the value at the new path. |
| `startPath` | moved | `flowBasics.startPath` | Write the value at the new path. |
| `callbackPath` | moved | `flowBasics.callbackPath` | Write the value at the new path. |
| `callbackMethod` | moved | `flowBasics.callbackMethod` | Write the value at the new path. |
| `completeKafkaTopic` | moved | `flowBasics.completeKafkaTopic` | Write the value at the new path. |
| `allowRegister` | moved | `flowBasics.allowRegister` | Write the value at the new path. |
