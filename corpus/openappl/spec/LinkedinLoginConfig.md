# LinkedinLoginConfig

**Level:** `subsection` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [LinkedinLoginConfig in Part 1](../ontology/LinkedinLoginConfig.md)

Configuration details for LinkedIn OAuth login, including client ID and secret. This object is used when LinkedIn login is enabled. LinkedIn uses the 'Sign In with LinkedIn using OpenID Connect' product. Registration is always allowed via social login.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `clientId` | `String` | yes |  |  | secure | The LinkedIn OAuth client ID. This should match the identifier registered in your LinkedIn Developer application. |
| `clientSecret` | `String` | yes |  |  | **secret** | The LinkedIn OAuth client secret. This is a confidential key issued by LinkedIn, stored securely in the platform secret store. |

## Constraints

Property rules:

- `clientId`, `clientSecret` must be present. (`REQUIRED_FIELD_MISSING`)
