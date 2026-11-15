# Provider catalog: socialLoginProvider

Entries of this family are written with [`SocialLoginProvider`](../SocialLoginProvider.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

Social login OAuth clients (the socialLoginProvidersSettings family). Env names are FIXED per brand (GOOGLE_CLIENT_ID, FACEBOOK_APP_ID, APPLE_PRIVATE_KEY, ...), not derived from __envPrefix and the entry name, because one entry per brand is read by the auth service OAuth routes. There is no mock brand and no runtime mock OAuth, so the credential mode mock is refused for this family.

## Environment names

| Prefix | Key style |
|---|---|
| `SOCIAL_LOGIN` | `verbatim` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`google`](#google) | 2 | 2 | 1 |
| [`apple`](#apple) | 4 | 4 | 1 |
| [`facebook`](#facebook) | 2 | 2 | 1 |
| [`microsoft`](#microsoft) | 3 | 2 | 1 |
| [`linkedin`](#linkedin) | 2 | 2 | 1 |
| [`gitlab`](#gitlab) | 2 | 2 | 1 |
| [`github`](#github) | 2 | 2 | 1 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` | socialLogin |
| `credentialSets` | true |
| `credentialModes` | ["auto","sandbox","live"] |
| `mockCredentialMode` | refused |
| `mockBrand` |  |
| `liveDetection` | none |
| `credentialScopes` | ["saas"] |
| `scopeField` |  |
| `note` | The OAuth routes need a real client, so the credential mode `mock` is refused; the test kit's mock OAuth server is test-only. |

## google

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | Google OAuth client id. Emitted as GOOGLE_CLIENT_ID on every service. |
| `clientSecret` | string | yes | yes |  |  |  | Google OAuth client secret. Emitted as GOOGLE_CLIENT_SECRET to the service that hosts the OAuth routes only; masked in API responses. |

## apple

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | Apple Services ID (not the App ID). Emitted as APPLE_CLIENT_ID. |
| `teamId` | string |  | yes |  |  |  | Apple Developer Team ID. Emitted as APPLE_TEAM_ID. |
| `keyId` | string |  | yes |  |  |  | Key ID of the Sign In with Apple key. Emitted as APPLE_KEY_ID. |
| `privateKey` | text | yes | yes |  |  |  | Contents of the Sign In with Apple .p8 key. Emitted as APPLE_PRIVATE_KEY to the service that hosts the OAuth routes only; masked in API responses. |

## facebook

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | Facebook (App ID / App Secret) OAuth client id. Emitted as FACEBOOK_APP_ID on every service. |
| `clientSecret` | string | yes | yes |  |  |  | Facebook (App ID / App Secret) OAuth client secret. Emitted as FACEBOOK_APP_SECRET to the service that hosts the OAuth routes only; masked in API responses. |

## microsoft

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | Microsoft OAuth client id. Emitted as MICROSOFT_CLIENT_ID on every service. |
| `clientSecret` | string | yes | yes |  |  |  | Microsoft OAuth client secret. Emitted as MICROSOFT_CLIENT_SECRET to the service that hosts the OAuth routes only; masked in API responses. |
| `tenant` | string |  |  | `common` |  |  | Accepted accounts: 'common', 'organizations', 'consumers' or a directory ID. Emitted as MICROSOFT_TENANT. |

## linkedin

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | LinkedIn OAuth client id. Emitted as LINKEDIN_CLIENT_ID on every service. |
| `clientSecret` | string | yes | yes |  |  |  | LinkedIn OAuth client secret. Emitted as LINKEDIN_CLIENT_SECRET to the service that hosts the OAuth routes only; masked in API responses. |

## gitlab

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | GitLab OAuth client id. Emitted as GITLAB_CLIENT_ID on every service. |
| `clientSecret` | string | yes | yes |  |  |  | GitLab OAuth client secret. Emitted as GITLAB_CLIENT_SECRET to the service that hosts the OAuth routes only; masked in API responses. |

## github

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `clientId` | string |  | yes |  |  |  | GitHub OAuth client id. Emitted as GITHUB_CLIENT_ID on every service. |
| `clientSecret` | string | yes | yes |  |  |  | GitHub OAuth client secret. Emitted as GITHUB_CLIENT_SECRET to the service that hosts the OAuth routes only; masked in API responses. |
