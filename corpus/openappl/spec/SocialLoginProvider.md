# SocialLoginProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [SocialLoginProvider in Part 1](../ontology/SocialLoginProvider.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [socialLoginProvider](./providers/socialLoginProvider.md).

One social login provider: the brand, its OAuth client credentials and when the email it returns counts as verified. The `provider` brand fixes the OAuth endpoints and the env variable names the auth service reads (GOOGLE_CLIENT_ID ...), so a brand appears at most once in the list. The `name` addresses the entry in the org shelf, in its per-environment values and in the encrypted secret store; the legacy `authentication.socialLogins` normalization and the moveSocialLoginsToProviders tool name an entry after its brand. Missing credentials are not a validation error: the login route answers a typed 503 at runtime and the production credential report names the missing variables. `mock` is not a credential mode of this family: there is no runtime mock OAuth.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique entry name within the project (a codeName), conventionally the brand itself (`google`). It addresses the entry in the org shelf, its per-environment values (family socialLogin) and its relocated secrets; the env variable names do not depend on it. |
| `provider` | `SocialLoginProviderType` | no | `"google"` | `google`, `apple`, `facebook`, `microsoft`, `linkedin`, `gitlab`, `github` |  | The social login brand. One entry per brand: a second entry of the same brand is validation ERROR SOCIAL_LOGIN_PROVIDER_DUPLICATE_BRAND. The brand selects the OAuth endpoints, the configuration fields that are read and the env variable names. |
| `configuration` | [`SocialLoginProviderConfig`](./SocialLoginProviderConfig.md) | no |  |  |  | OAuth client credentials (SocialLoginProviderConfig); only the fields of the selected brand are read. Missing values never fail validation, the build or the boot: the login route of the brand answers a typed 503 errMsg_OAuthProviderNotConfigured_<brand> until they are set. |
| `emailVerification` | `SocialEmailVerification` | no | `"providerSignal"` | `providerSignal`, `requireVerification`, `trusted` |  | When a sign-in through this provider counts the returned email as verified: 'providerSignal' (default, the provider's own verification signal), 'requireVerification' (never) or 'trusted' (always). The decision marks a new account's email verified and is what lets a sign-in reach an EXISTING account with the same email: an email this setting does not count as verified creates an unverified account (which verifies through the normal email verification flow) and never signs in to an existing account by email; that sign-in is refused with 403 errMsg_SocialLoginEmailNotVerified and the user signs in with the existing method instead. A provider account linked to a user in the auth userSocialAccount object (written at the social registration and at a verified-email sign-in) is matched first and reaches that user whatever this setting decides. 'trusted' is only for a deployment locked to one directory you control (for Microsoft: configuration.tenant set to your own directory ID); see the SocialEmailVerification value docs for the warning. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider`, `emailVerification` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
