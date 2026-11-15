# GitlabLoginSetting

**Level:** `section` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [GitlabLoginSetting in Part 1](../ontology/GitlabLoginSetting.md)

**Activation:** the pattern is switched on by `useGitlabLogin`.

Configuration for GitLab OAuth login. This section defines whether GitLab login is enabled, the client ID and secret, and whether users can register using their GitLab accounts.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `useGitlabLogin` | `Boolean` | no | `false` |  |  | A boolean value to enable or disable GitLab OAuth login. When true, users can sign in using their GitLab accounts. |
| `configuration` | [`GitlabLoginConfig`](./GitlabLoginConfig.md) | no |  |  |  | The configuration object for GitLab OAuth login. Leave it null if useGitlabLogin is false. |
| `emailVerification` | `SocialEmailVerification` | no | `"providerSignal"` | `providerSignal`, `requireVerification`, `trusted` |  | When a sign-in through this provider counts the returned email as verified: 'providerSignal' (default, the provider's own verification signal), 'requireVerification' (never) or 'trusted' (always). The decision marks a new account's email verified and is what lets a sign-in reach an EXISTING account with the same email: an email this setting does not count as verified creates an unverified account (which verifies through the normal email verification flow) and never signs in to an existing account by email; that sign-in is refused with 403 errMsg_SocialLoginEmailNotVerified and the user signs in with the existing method instead. A provider account linked to a user in the auth userSocialAccount object (written at the social registration and at a verified-email sign-in) is matched first and reaches that user whatever this setting decides. 'trusted' is only for a deployment locked to one directory you control (for Microsoft: configuration.tenant set to your own directory ID); see the SocialEmailVerification value docs for the warning. |

## Constraints

Property rules:

- `emailVerification` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
