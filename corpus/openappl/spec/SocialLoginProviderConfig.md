# SocialLoginProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [SocialLoginProviderConfig in Part 1](../ontology/SocialLoginProviderConfig.md)

OAuth client credentials of a SocialLoginProvider entry. Fields are flat across brands and only the ones of the selected `provider` are read: google, facebook, linkedin, github and gitlab read clientId and clientSecret; microsoft also reads tenant; apple reads clientId (the Services ID), teamId, keyId and privateKey (the .p8 key contents) instead of a clientSecret. clientSecret and privateKey are secrets: masked in API responses, written as blank placeholders into the committed env files and delivered as CI/CD variables to the service that hosts the OAuth routes only.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `clientId` | `String` | no |  |  | secure | (all brands) OAuth client id: the Google client ID, the Facebook App ID, the Microsoft Application (client) ID, the LinkedIn / GitHub / GitLab client ID, or the Apple Services ID (not the App ID). Emitted as <BRAND>_CLIENT_ID (FACEBOOK_APP_ID for facebook). |
| `clientSecret` | `String` | no |  |  | **secret** | (every brand except apple) OAuth client secret. Secret: emitted as <BRAND>_CLIENT_SECRET (FACEBOOK_APP_SECRET for facebook) through the secret store and CI/CD, never committed. |
| `tenant` | `String` | no | `"common"` |  |  | (microsoft) Which Microsoft accounts may sign in: 'common' (default, personal and work/school), 'organizations' (work/school only), 'consumers' (personal only), or your own directory (tenant) ID for a single-tenant app. Emitted as MICROSOFT_TENANT. |
| `teamId` | `String` | no |  |  | secure | (apple) Your Apple Developer Team ID, a 10-character string. Emitted as APPLE_TEAM_ID. |
| `keyId` | `String` | no |  |  | secure | (apple) The Key ID of the Sign In with Apple private key. Emitted as APPLE_KEY_ID. |
| `privateKey` | `String` | no |  |  | **secret** | (apple) The contents of the Sign In with Apple .p8 key, which signs the short-lived ES256 client secret. Secret: emitted as APPLE_PRIVATE_KEY through the secret store and CI/CD (use \n for newlines in an env value). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
