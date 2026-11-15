# MicrosoftLoginConfig

**Level:** `subsection` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [MicrosoftLoginConfig in Part 1](../ontology/MicrosoftLoginConfig.md)

Configuration details for Microsoft OAuth login. The clientId and clientSecret are obtained from the Azure Portal (Microsoft Entra ID \> App registrations). The tenant controls which account types are accepted: 'common' allows both personal and work/school accounts, 'organizations' allows only work/school accounts, 'consumers' allows only personal accounts, or a specific Azure AD tenant ID for single-tenant apps. Registration is always allowed via social login.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `clientId` | `String` | yes |  |  | secure | The Microsoft Application (client) ID. Found in the Azure Portal under App registrations \> Overview. |
| `clientSecret` | `String` | yes |  |  | **secret** | The Microsoft client secret (value, not the secret ID). Created in Azure Portal under App registrations \> Certificates & secrets. Stored securely in the platform secret store. |
| `tenant` | `String` | no | `"common"` |  |  | Controls which Microsoft account types can sign in. Use 'common' (default) for both personal and work/school, 'organizations' for work/school only, 'consumers' for personal only, or a specific Azure AD tenant ID (GUID) for single-tenant apps. |

## Constraints

Property rules:

- `clientId`, `clientSecret` must be present. (`REQUIRED_FIELD_MISSING`)
