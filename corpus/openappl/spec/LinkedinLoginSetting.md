# LinkedinLoginSetting

**Level:** `section` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [LinkedinLoginSetting in Part 1](../ontology/LinkedinLoginSetting.md)

**Activation:** the pattern is switched on by `useLinkedinLogin`.

Configuration for LinkedIn OAuth login. This section defines whether LinkedIn login is enabled, the client ID and secret, and whether users can register using their LinkedIn accounts. LinkedIn uses OpenID Connect with the 'openid', 'profile', and 'email' scopes.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useLinkedinLogin` | `Boolean` | no | `false` |  |  | A boolean value to enable or disable LinkedIn OAuth login. When true, users can sign in using their LinkedIn accounts. |
| `configuration` | [`LinkedinLoginConfig`](./LinkedinLoginConfig.md) | no |  |  |  | The configuration object for LinkedIn OAuth login. Leave it null if useLinkedinLogin is false. |
| `emailVerification` | `SocialEmailVerification` | no | `"providerSignal"` | `providerSignal`, `requireVerification`, `trusted` |  | When a sign-in through this provider counts the returned email as verified: 'providerSignal' (default, the provider's own verification signal), 'requireVerification' (never) or 'trusted' (always). The decision marks a new account's email verified and is what lets a sign-in reach an EXISTING account with the same email: an email this setting does not count as verified creates an unverified account (which verifies through the normal email verification flow) and never signs in to an existing account by email; that sign-in is refused with 403 errMsg_SocialLoginEmailNotVerified and the user signs in with the existing method instead. A provider account linked to a user in the auth userSocialAccount object (written at the social registration and at a verified-email sign-in) is matched first and reaches that user whatever this setting decides. 'trusted' is only for a deployment locked to one directory you control (for Microsoft: configuration.tenant set to your own directory ID); see the SocialEmailVerification value docs for the warning. |

## Constraints

Property rules:

- `emailVerification` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
