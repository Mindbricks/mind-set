# FacebookLoginSetting

**Level:** `section` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [FacebookLoginSetting in Part 1](../ontology/FacebookLoginSetting.md)

**Activation:** the pattern is switched on by `useFacebookLogin`.

Configuration for Facebook OAuth login. This section defines whether Facebook login is enabled, the App ID and App Secret, and whether users can register using their Facebook accounts. This also covers Instagram accounts since Meta uses a unified login system (Facebook Login).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useFacebookLogin` | `Boolean` | no | `false` |  |  | A boolean value to enable or disable Facebook OAuth login. When true, users can sign in using their Facebook (or Instagram) accounts. |
| `configuration` | [`FacebookLoginConfig`](./FacebookLoginConfig.md) | no |  |  |  | The configuration object for Facebook OAuth login. Leave it null if useFacebookLogin is false. |
| `emailVerification` | `SocialEmailVerification` | no | `"providerSignal"` | `providerSignal`, `requireVerification`, `trusted` |  | When a sign-in through this provider counts the returned email as verified: 'providerSignal' (default, the provider's own verification signal), 'requireVerification' (never) or 'trusted' (always). The decision marks a new account's email verified and is what lets a sign-in reach an EXISTING account with the same email: an email this setting does not count as verified creates an unverified account (which verifies through the normal email verification flow) and never signs in to an existing account by email; that sign-in is refused with 403 errMsg_SocialLoginEmailNotVerified and the user signs in with the existing method instead. A provider account linked to a user in the auth userSocialAccount object (written at the social registration and at a verified-email sign-in) is matched first and reaches that user whatever this setting decides. 'trusted' is only for a deployment locked to one directory you control (for Microsoft: configuration.tenant set to your own directory ID); see the SocialEmailVerification value docs for the warning. |

## Constraints

Property rules:

- `emailVerification` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
