# AuthBasics

**Level:** `chapter` · **Family:** [AuthBasics](../ontology/families.md#authbasics) (domain `ProjectAuthentication`)

**Ontology:** [AuthBasics in Part 1](../ontology/AuthBasics.md)

Defines the fundamental authentication configuration for the project. These settings determine the authentication method(s) used across all services, including token-based or API key authentication.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `documentation` | [`ModuleDocumentation`](./ModuleDocumentation.md) | no |  |  |  | Module-level UX prompt and freeform description for auth login, registration, verification and password-reset interfaces. Intended frontend metadata; it does not configure backend authentication or route behavior. |
| `JWTAuthentication` | [`JWTAuth`](./JWTAuth.md) | no |  |  |  | Configuration for JWT-based authentication, where the project issues and verifies its own JSON Web Tokens. This is the recommended authentication method in OpenAPPL for secure, scalable identity management. |
| `ssoAuthentication` | [`SSOAuth`](./SSOAuth.md) | no |  |  |  | Retained Single Sign-On (SSO) configuration. SSO authentication is not available yet: useSSOForAuthentication=true is refused with SSO_NOT_SUPPORTED. No SSO login flow, environment variables or deploy secrets are generated. |
| `apiKeyAuthentication` | [`APIKeyAuth`](./APIKeyAuth.md) | no |  |  |  | Enables API key-based authentication for accessing the project's services. This method can be used either as the primary authentication mechanism or as a secondary option alongside others. |
| `refreshTokenSettings` | [`RefreshTokenSettings`](./RefreshTokenSettings.md) | no |  |  |  | Opt-in refresh-token support. When enabled, every login ALSO returns a long-lived `refreshToken` the client stores locally and later presents to `/relogin` to obtain a fresh access token after the access token expires. When disabled, no refresh token is issued and an expired access token means the user logs in again. NOTE: the `/relogin` route exists in BOTH modes — with the feature off it still accepts a currently-valid (but about-to-expire) access token and returns a fresh one, so a client can always extend its session before expiry. |
| `httpSettings` | [`AuthHttpSettings`](./AuthHttpSettings.md) | no |  |  |  | Defines the HTTP configuration of the auth service. Primarily includes the port on which the auth service will accept HTTP requests. |
| `cookieSettings` | [`CookieSettings`](./CookieSettings.md) | no |  |  |  | Use these settings to arrange the allowed domains of your application's session cookie. A generated service always sets its session cookie httpOnly with SameSite lax (SESSION_COOKIE_SAMESITE, emitted as lax), and Secure on an HTTPS request or when COOKIE_SECURE is true (stage, prod and test); these settings change neither. The cookie domain is set from the login request host when that host is in the allowed list; with allowedDomains set, a login on any other host gets no session cookie. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
