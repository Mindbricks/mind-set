# OAuthFlowBasics

**Level:** `section` · **Family:** [OAuthFlow](../ontology/families.md#oauthflow) (domain `Service`)

**Ontology:** [OAuthFlowBasics in Part 1](../ontology/OAuthFlowBasics.md)

Identity and transport of one OAuth flow: the provider it binds to, the requested scopes, the start/callback route shape, the completion Kafka topic, and whether an unknown identity may register.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | The OAuth provider key — one of google, apple, facebook, microsoft, github, gitlab, linkedin. Selects the authorize URL, token endpoint, profile endpoint, and credential env-var names in the common OAuth runtime. |
| `scopes` | `String` | no |  |  |  | Optional space- or comma-separated scope override. When empty, the provider's default scopes are used (e.g. 'profile email' for google). |
| `startPath` | `String` | no |  |  |  | REST path of the start route that redirects to the provider (e.g. '/auth/google'). Defaults to '/auth/<provider>'. |
| `callbackPath` | `String` | no |  |  |  | REST path the provider redirects back to (e.g. '/auth/google/callback'). Defaults to '/auth/<provider>/callback'. |
| `callbackMethod` | `HTTPRequestMethods` | no | `"GET"` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |  | HTTP method of the callback route. GET for most providers; Apple posts the result (form_post), so it uses POST. |
| `completeKafkaTopic` | `String` | no |  |  |  | Topic the callback publishes the OAuth completion event to (the normalized profile + outcome). On the auth service this is the social-login-complete topic; other services can consume it. Defaults to '<codename>-auth-service-oauth-complete'. |
| `allowRegister` | `Boolean` | no | `true` |  |  | When true (default), an OAuth login for an unknown email flags a needs-registration result the portal can complete; when false, unknown users are rejected. |
| `emailVerification` | `SocialEmailVerification` | no | `"providerSignal"` | `providerSignal`, `requireVerification`, `trusted` |  | When a sign-in through this flow counts the profile email as verified: 'providerSignal' (default, the runtime's per-provider verification signal), 'requireVerification' (never) or 'trusted' (always). The callback applies it before anything else reads the profile: the identity grants see the decided emailVerified, and a sign-in reaches an EXISTING account with the profile email ONLY when the email counts as verified; otherwise it is refused with 403 errMsg_SocialLoginEmailNotVerified. A host that owns a userSocialAccount object matches the provider account link (provider + the profile subject) first, which reaches the linked user whatever this setting decides, and links the provider account at a verified-email match only when that user has no link for this provider. If the user already has a different subject linked for that provider, the email fallback is refused with 403 errMsg_AccountLinkedToAnotherProviderAccount, including in trusted mode; adding another subject requires authenticated, explicit linking. The auth service fills it from authentication.socialLogins.<provider>.emailVerification; an authored flow sets it here. |

## Constraints

Property rules:

- `provider` must be present. (`REQUIRED_FIELD_MISSING`)
- `callbackMethod`, `emailVerification` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `UNKNOWN_OAUTH_PROVIDER` | error | OAuth provider "…" is not supported. |
