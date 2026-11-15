# SocialLoginProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [SocialLoginProvider in Part 2](../spec/SocialLoginProvider.md)

One social login provider: the brand, its OAuth client credentials and when the email it returns counts as verified. The `provider` brand fixes the OAuth endpoints and the env variable names the auth service reads (GOOGLE_CLIENT_ID ...), so a brand appears at most once in the list. The `name` addresses the entry in the org shelf, in its per-environment values and in the encrypted secret store; the legacy `authentication.socialLogins` normalization and the moveSocialLoginsToProviders tool name an entry after its brand. Missing credentials are not a validation error: the login route answers a typed 503 at runtime and the production credential report names the missing variables. `mock` is not a credential mode of this family: there is no runtime mock OAuth.

## Contained in

- [SocialLoginProvidersSettings](./SocialLoginProvidersSettings.md) as `socialLoginProviders` (a list)

## Contains

- `configuration`: [SocialLoginProviderConfig](./SocialLoginProviderConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
