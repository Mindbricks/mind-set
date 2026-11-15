# AppleLoginConfig

**Level:** `subsection` · **Family:** [SocialLoginSettings](../ontology/families.md#socialloginsettings) (domain `ProjectAuthentication`)

**Ontology:** [AppleLoginConfig in Part 1](../ontology/AppleLoginConfig.md)

Configuration details for Apple Sign In. Apple uses a JWT-based client secret generated from a private key, unlike other providers that use a static client secret. Registration is always allowed via social login.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `clientId` | `String` | yes |  |  | secure | The Apple Service ID (not the App ID). This is the identifier you create under 'Services IDs' in the Apple Developer portal (e.g., com.yourapp.web.signin). |
| `teamId` | `String` | yes |  |  | secure | Your Apple Developer Team ID. A 10-character alphanumeric string found in your Apple Developer account membership details. |
| `keyId` | `String` | yes |  |  | secure | The Key ID of the Sign In with Apple private key. Found in the Apple Developer portal under 'Keys' after creating a Sign In with Apple key. |
| `privateKey` | `String` | yes |  |  | **secret** | The contents of the .p8 private key file downloaded from Apple. This key is used to generate a JWT client secret for token exchange. Store securely — use \n for newlines in environment variables. |

## Constraints

Property rules:

- `clientId`, `teamId`, `keyId`, `privateKey` must be present. (`REQUIRED_FIELD_MISSING`)
