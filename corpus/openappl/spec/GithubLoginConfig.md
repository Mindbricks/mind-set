# GithubLoginConfig

**Level:** `subsection` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [GithubLoginConfig in Part 1](../ontology/GithubLoginConfig.md)

Configuration details for GitHub OAuth login, including client ID and secret. This object is used when GitHub login is enabled. Registration is always allowed via social login.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `clientId` | `String` | yes |  |  | secure | The GitHub OAuth client ID. This should match the identifier registered in your GitHub application settings. |
| `clientSecret` | `String` | yes |  |  | **secret** | The GitHub OAuth client secret. This is a confidential key issued by GitHub, stored securely in the platform secret store. |

## Constraints

Property rules:

- `clientId`, `clientSecret` must be present. (`REQUIRED_FIELD_MISSING`)
