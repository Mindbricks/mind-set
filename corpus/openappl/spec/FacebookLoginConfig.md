# FacebookLoginConfig

**Level:** `subsection` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [FacebookLoginConfig in Part 1](../ontology/FacebookLoginConfig.md)

Configuration details for Facebook OAuth login, including App ID and App Secret. These are obtained from the Meta Developer portal (developers.facebook.com). The Facebook Login product must be added to the app, and 'email' and 'public_profile' permissions are required. Registration is always allowed via social login.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `clientId` | `String` | yes |  |  | secure | The Facebook App ID. This should match the identifier registered in your Meta Developer portal application settings. |
| `clientSecret` | `String` | yes |  |  | **secret** | The Facebook App Secret. This is a confidential key issued by Meta, stored securely in the platform secret store. |

## Constraints

Property rules:

- `clientId`, `clientSecret` must be present. (`REQUIRED_FIELD_MISSING`)
