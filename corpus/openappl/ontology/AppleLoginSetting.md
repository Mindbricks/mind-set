# AppleLoginSetting

**Level:** `section` · **Family:** [SocialLoginSettings](./families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Specification:** [AppleLoginSetting in Part 2](../spec/AppleLoginSetting.md)

Configuration for Apple Sign In with Apple. This section defines whether Apple login is enabled and its configuration. Apple OAuth requires a Service ID, Team ID, Key ID, and a private key (.p8 file contents) — all obtained from the Apple Developer portal.

## Contained in

- [SocialLoginSettings](./SocialLoginSettings.md) as `apple`

Blueprint paths:

- `authentication.socialLogins.apple`

## Contains

- `configuration`: [AppleLoginConfig](./AppleLoginConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
