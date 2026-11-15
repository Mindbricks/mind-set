# SocialLoginSettings

**Level:** `chapter` · **Family:** [SocialLoginSettings](./families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Specification:** [SocialLoginSettings in Part 2](../spec/SocialLoginSettings.md)

Configuration for enabling social login support within the project. This object defines integration settings for third-party authentication providers, such as Google, Apple, Facebook, Microsoft, LinkedIn, GitHub, and GitLab, allowing users to sign in or register using their existing accounts. Each provider must be configured with its credentials and registration behavior. Each provider also carries emailVerification, which decides when its email counts as verified; only a verified email lets a social sign-in reach an existing account with that email.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `socialLogins`

Blueprint paths:

- `authentication.socialLogins`

## Contains

- `google`: [GoogleLoginSetting](./GoogleLoginSetting.md)
- `apple`: [AppleLoginSetting](./AppleLoginSetting.md)
- `facebook`: [FacebookLoginSetting](./FacebookLoginSetting.md)
- `microsoft`: [MicrosoftLoginSetting](./MicrosoftLoginSetting.md)
- `linkedin`: [LinkedinLoginSetting](./LinkedinLoginSetting.md)
- `gitlab`: [GitlabLoginSetting](./GitlabLoginSetting.md)
- `github`: [GithubLoginSetting](./GithubLoginSetting.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
