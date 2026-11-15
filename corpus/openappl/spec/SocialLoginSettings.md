# SocialLoginSettings

**Level:** `chapter` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [SocialLoginSettings in Part 1](../ontology/SocialLoginSettings.md)

Configuration for enabling social login support within the project. This object defines integration settings for third-party authentication providers, such as Google, Apple, Facebook, Microsoft, LinkedIn, GitHub, and GitLab, allowing users to sign in or register using their existing accounts. Each provider must be configured with its credentials and registration behavior. Each provider also carries emailVerification, which decides when its email counts as verified; only a verified email lets a social sign-in reach an existing account with that email.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `google` | [`GoogleLoginSetting`](./GoogleLoginSetting.md) | no |  |  |  | Settings for enabling Google OAuth login and optional user registration. Defined as a GoogleLoginSetting object. |
| `apple` | [`AppleLoginSetting`](./AppleLoginSetting.md) | no |  |  |  | Settings for enabling Apple OAuth login and optional user registration. Defined as an AppleLoginSetting object. |
| `facebook` | [`FacebookLoginSetting`](./FacebookLoginSetting.md) | no |  |  |  | Settings for enabling Facebook OAuth login and optional user registration. This also covers Instagram accounts since Meta uses a unified login system. Defined as a FacebookLoginSetting object. |
| `microsoft` | [`MicrosoftLoginSetting`](./MicrosoftLoginSetting.md) | no |  |  |  | Settings for enabling Microsoft Azure AD / Microsoft Entra ID login and optional user registration. Supports personal Microsoft accounts, work/school (Azure AD) accounts, or both. Defined as a MicrosoftLoginSetting object. |
| `linkedin` | [`LinkedinLoginSetting`](./LinkedinLoginSetting.md) | no |  |  |  | Settings for enabling LinkedIn OAuth login and optional user registration. Defined as a LinkedinLoginSetting object. |
| `gitlab` | [`GitlabLoginSetting`](./GitlabLoginSetting.md) | no |  |  |  | Settings for enabling GitLab OAuth login and optional user registration. Defined as a GitlabLoginSetting object. |
| `github` | [`GithubLoginSetting`](./GithubLoginSetting.md) | no |  |  |  | Settings for enabling GitHub OAuth login and optional user registration. Defined as a GithubLoginSetting object. |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SOCIAL_LOGIN_CONFIG_MISSING` | error | … login is enabled (`…: true`) but `configuration.…` is missing. |
| `SOCIAL_LOGIN_LEGACY_LOCATION` | warning | … login is configured in the legacy location authentication.socialLogins.…. |
