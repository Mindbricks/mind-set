# MicrosoftLoginConfig

**Level:** `subsection` · **Family:** [SocialLoginSettings](./families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Specification:** [MicrosoftLoginConfig in Part 2](../spec/MicrosoftLoginConfig.md)

Configuration details for Microsoft OAuth login. The clientId and clientSecret are obtained from the Azure Portal (Microsoft Entra ID \> App registrations). The tenant controls which account types are accepted: 'common' allows both personal and work/school accounts, 'organizations' allows only work/school accounts, 'consumers' allows only personal accounts, or a specific Azure AD tenant ID for single-tenant apps. Registration is always allowed via social login.

## Contained in

- [MicrosoftLoginSetting](./MicrosoftLoginSetting.md) as `configuration`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
