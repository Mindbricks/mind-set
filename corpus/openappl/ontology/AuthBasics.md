# AuthBasics

**Level:** `chapter` · **Family:** [AuthBasics](./families.md#authbasics) (domain `ProjectAuthentication`)

**Specification:** [AuthBasics in Part 2](../spec/AuthBasics.md)

Defines the fundamental authentication configuration for the project. These settings determine the authentication method(s) used across all services, including token-based or API key authentication.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `authenticationEssentials`

Blueprint paths:

- `authentication.authenticationEssentials`

## Contains

- `documentation`: [ModuleDocumentation](./ModuleDocumentation.md)
- `JWTAuthentication`: [JWTAuth](./JWTAuth.md)
- `ssoAuthentication`: [SSOAuth](./SSOAuth.md)
- `apiKeyAuthentication`: [APIKeyAuth](./APIKeyAuth.md)
- `refreshTokenSettings`: [RefreshTokenSettings](./RefreshTokenSettings.md)
- `httpSettings`: [AuthHttpSettings](./AuthHttpSettings.md)
- `cookieSettings`: [CookieSettings](./CookieSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
