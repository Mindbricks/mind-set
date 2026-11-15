# MicrosoftLoginSetting

**Level:** `section` · **Family:** [SocialLoginSettings](./families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Specification:** [MicrosoftLoginSetting in Part 2](../spec/MicrosoftLoginSetting.md)

Configuration for Microsoft Azure AD / Microsoft Entra ID OAuth login. Supports personal Microsoft accounts (Outlook, Hotmail, Xbox), work/school accounts (Azure AD / Microsoft 365), or both — controlled by the tenant setting. Uses OpenID Connect with the Microsoft identity platform v2.0 endpoints.

## Contained in

- [SocialLoginSettings](./SocialLoginSettings.md) as `microsoft`

Blueprint paths:

- `authentication.socialLogins.microsoft`

## Contains

- `configuration`: [MicrosoftLoginConfig](./MicrosoftLoginConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
