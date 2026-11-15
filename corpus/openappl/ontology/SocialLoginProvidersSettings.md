# SocialLoginProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [SocialLoginProvidersSettings in Part 2](../spec/SocialLoginProvidersSettings.md)

Container for social login provider entries, one per brand (google, apple, facebook, microsoft, linkedin, github, gitlab). Each entry carries the brand, its OAuth client credentials and its emailVerification decision; the auth service generates the OAuth start and callback routes of every listed brand. Mirrors the other provider families (a named array under projectSettings, org-shelf shareable, per-environment values addressed by family socialLogin and the entry name), with one difference: a brand may appear at most once (validation ERROR SOCIAL_LOGIN_PROVIDER_DUPLICATE_BRAND), because the runtime reads every brand from fixed env variable names.

## Contained in

- [ProjectSettings](./ProjectSettings.md) as `socialLoginProvidersSettings`

Blueprint paths:

- `projectSettings.socialLoginProvidersSettings`

## Contains

- `socialLoginProviders`: [SocialLoginProvider](./SocialLoginProvider.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
