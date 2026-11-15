---
title: SSO (Single Sign-On)
---

# SSO (Single Sign-On)

SSO authentication is not available yet. Setting
`authentication.authenticationEssentials.ssoAuthentication.useSSOForAuthentication` to
`true` produces the design-time error `SSO_NOT_SUPPORTED`, including when the identity
provider configuration is complete. Keep this flag `false`.

A conforming compiler generates no SSO login, callback, profile mapping, or logout flow. SSO
settings emit no environment variables or deploy secrets, including
`<SSONAME>_CLIENT_SECRET`. Configuring an identity provider does not enable SSO. A future SSO
implementation requires its own identity provider trust and account linking policy.

Existing token period settings and their resolution rules are unchanged;
`tokenPeriodInMinutes` does not enable an SSO flow.

For the authentication flows available today, see [Login](./login.md) and [Social
logins](./social-logins.md).

The retained configuration schema is described by [`SSOAuth`](../../../spec/SSOAuth.md),
[`SSOAuthConfig`](../../../spec/SSOAuthConfig.md), and
[`SSOServerSettings`](../../../spec/SSOServerSettings.md).
