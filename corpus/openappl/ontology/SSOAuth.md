# SSOAuth

**Level:** `section` · **Family:** [AuthBasics](./families.md#authbasics) (domain `ProjectAuthentication`)

**Specification:** [SSOAuth in Part 2](../spec/SSOAuth.md)

Retained Single Sign-On (SSO) configuration schema. SSO authentication is not available yet: useSSOForAuthentication=true is refused with SSO_NOT_SUPPORTED, even with complete identity provider settings. No SSO login flow, environment variables or deploy secrets are generated.

## Contained in

- [AuthBasics](./AuthBasics.md) as `ssoAuthentication`

Blueprint paths:

- `authentication.authenticationEssentials.ssoAuthentication`

## Contains

- `configuration`: [SSOAuthConfig](./SSOAuthConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
