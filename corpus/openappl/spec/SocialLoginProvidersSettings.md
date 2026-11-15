# SocialLoginProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [SocialLoginProvidersSettings in Part 1](../ontology/SocialLoginProvidersSettings.md)

Container for social login provider entries, one per brand (google, apple, facebook, microsoft, linkedin, github, gitlab). Each entry carries the brand, its OAuth client credentials and its emailVerification decision; the auth service generates the OAuth start and callback routes of every listed brand. Mirrors the other provider families (a named array under projectSettings, org-shelf shareable, per-environment values addressed by family socialLogin and the entry name), with one difference: a brand may appear at most once (validation ERROR SOCIAL_LOGIN_PROVIDER_DUPLICATE_BRAND), because the runtime reads every brand from fixed env variable names.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `socialLoginProviders` | [`SocialLoginProvider`](./SocialLoginProvider.md)[] | no |  |  |  | List of social login providers, one entry per brand. An entry in the list is active: there is no enable flag, remove the entry to turn the brand off. A second entry of the same brand is a validation ERROR; different clients per environment come from the environment values of the entry, not from a second entry. |

## Constraints

Property rules:

- The items of `socialLoginProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SOCIAL_LOGIN_PROVIDER_DUPLICATE_BRAND` | error | Social login brand "…" already has an entry (socialLoginProviders[…] "…"). |
| `SOCIAL_LOGIN_PROVIDER_SHADOWS_LEGACY` | warning | Social login brand "…" is configured twice: as provider entry "…" (…) and in the legacy location …. |
| `UNIQUE_SOCIAL_LOGIN_PROVIDER_NAME` | error | Social login provider name "…" is already used by socialLoginProviders[…]. |
