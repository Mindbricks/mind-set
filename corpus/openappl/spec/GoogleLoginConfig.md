# GoogleLoginConfig

**Level:** `subsection` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [GoogleLoginConfig in Part 1](../ontology/GoogleLoginConfig.md)

Configuration details for Google OAuth login, including client ID and secret. This object is used when Google login is enabled. Registration is always allowed via social login.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `clientId` | `String` | yes |  |  | secure | The Google OAuth client ID. This should match the identifier registered in your Google Developer Console. |
| `clientSecret` | `String` | yes |  |  | **secret** | The Google OAuth client secret. This is a confidential key issued by Google, stored securely in the platform secret store. |

## Constraints

Property rules:

- `clientId`, `clientSecret` must be present. (`REQUIRED_FIELD_MISSING`)
