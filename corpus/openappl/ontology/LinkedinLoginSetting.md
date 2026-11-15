# LinkedinLoginSetting

**Level:** `section` · **Family:** [SocialLoginSettings](./families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Specification:** [LinkedinLoginSetting in Part 2](../spec/LinkedinLoginSetting.md)

Configuration for LinkedIn OAuth login. This section defines whether LinkedIn login is enabled, the client ID and secret, and whether users can register using their LinkedIn accounts. LinkedIn uses OpenID Connect with the 'openid', 'profile', and 'email' scopes.

## Contained in

- [SocialLoginSettings](./SocialLoginSettings.md) as `linkedin`

Blueprint paths:

- `authentication.socialLogins.linkedin`

## Contains

- `configuration`: [LinkedinLoginConfig](./LinkedinLoginConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
