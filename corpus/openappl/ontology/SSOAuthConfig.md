# SSOAuthConfig

**Level:** `subsection` · **Family:** [AuthBasics](./families.md#authbasics) (domain `ProjectAuthentication`)

**Specification:** [SSOAuthConfig in Part 2](../spec/SSOAuthConfig.md)

Retained external identity provider settings for the unavailable SSO feature. Configuring these fields does not enable SSO; useSSOForAuthentication=true is refused with SSO_NOT_SUPPORTED. No profile mapping or account linking flow is generated.

## Contained in

- [SSOAuth](./SSOAuth.md) as `configuration`

## Contains

- `ssoServerSettings`: [SSOServerSettings](./SSOServerSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
