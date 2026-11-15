# GitlabLoginConfig

**Level:** `subsection` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [GitlabLoginConfig in Part 1](../ontology/GitlabLoginConfig.md)

Configuration details for GitLab OAuth login, including client ID and secret. This object is used when GitLab login is enabled. Registration is always allowed via social login.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `clientId` | `String` | yes |  |  | secure | The GitLab OAuth client ID. This should match the identifier registered in your GitLab application settings. |
| `clientSecret` | `String` | yes |  |  | **secret** | The GitLab OAuth client secret. This is a confidential key issued by GitLab, stored securely in the platform secret store. |

## Constraints

Property rules:

- `clientId`, `clientSecret` must be present. (`REQUIRED_FIELD_MISSING`)
