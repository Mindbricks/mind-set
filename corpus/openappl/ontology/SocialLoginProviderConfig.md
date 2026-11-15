# SocialLoginProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [SocialLoginProviderConfig in Part 2](../spec/SocialLoginProviderConfig.md)

OAuth client credentials of a SocialLoginProvider entry. Fields are flat across brands and only the ones of the selected `provider` are read: google, facebook, linkedin, github and gitlab read clientId and clientSecret; microsoft also reads tenant; apple reads clientId (the Services ID), teamId, keyId and privateKey (the .p8 key contents) instead of a clientSecret. clientSecret and privateKey are secrets: masked in API responses, written as blank placeholders into the committed env files and delivered as CI/CD variables to the service that hosts the OAuth routes only.

## Contained in

- [SocialLoginProvider](./SocialLoginProvider.md) as `configuration`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
