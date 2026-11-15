# Provider catalog: videoProvider

Entries of this family are written with [`VideoProvider`](../VideoProvider.md); the keys below are what an entry's `configuration` takes, per `provider` brand.

## Environment names

| Prefix | Key style |
|---|---|
| `VIDEO` | `upperSnake` |

The key style `upperSnake` turns a camelCase key into UPPER_SNAKE; `verbatim` keeps it as written.

## Brands

| Brand | Keys | Required | Secret |
|---|---|---|---|
| [`native`](#native) | 0 | 0 | 0 |
| [`livekit`](#livekit) | 3 | 3 | 2 |
| [`jitsi`](#jitsi) | 3 | 3 | 1 |
| [`daily`](#daily) | 2 | 2 | 1 |
| [`whereby`](#whereby) | 1 | 1 | 1 |
| [`zoom`](#zoom) | 2 | 2 | 1 |
| [`twilio`](#twilio) | 3 | 3 | 2 |
| [`vonage`](#vonage) | 2 | 2 | 1 |
| [`agora`](#agora) | 2 | 2 | 1 |
| [`hundredMs`](#hundredms) | 3 | 2 | 1 |
| [`awsIvs`](#awsivs) | 3 | 3 | 2 |
| [`mux`](#mux) | 2 | 2 | 1 |
| [`cloudflareStream`](#cloudflarestream) | 3 | 2 | 1 |

## Credentials

| Entry | Value |
|---|---|
| `overlayFamily` | video |
| `credentialSets` | true |
| `credentialModes` | ["auto","sandbox","live"] |
| `mockCredentialMode` | refused |
| `mockBrand` |  |
| `liveDetection` | none |
| `credentialScopes` | ["saas"] |
| `scopeField` |  |

## native

This brand takes no configuration keys.

## livekit

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `url` | string |  | yes |  |  |  | LiveKit server URL, ws(s)://... |
| `apiKey` | string | yes | yes |  |  |  | LiveKit API key. |
| `apiSecret` | string | yes | yes |  |  |  | LiveKit API secret. |

## jitsi

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `domain` | string |  | yes |  |  |  | Jitsi domain, e.g. meet.example.com. |
| `appId` | string |  | yes |  |  |  | App/tenant id (JaaS appId). |
| `apiSecret` | string | yes | yes |  |  |  | JWT signing secret (app secret). |

## daily

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | Daily API key. |
| `domain` | string |  | yes |  |  |  | Daily domain, e.g. yourteam.daily.co. |

## whereby

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `apiKey` | string | yes | yes |  |  |  | Whereby Embedded API key. |

## zoom

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `sdkKey` | string |  | yes |  |  |  | Zoom Video SDK key. |
| `sdkSecret` | string | yes | yes |  |  |  | Zoom Video SDK secret. |

## twilio

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `accountSid` | string |  | yes |  |  |  | Twilio account SID. |
| `apiKey` | string | yes | yes |  |  |  | Twilio API key SID. |
| `apiSecret` | string | yes | yes |  |  |  | Twilio API key secret. |

## vonage

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `applicationId` | string |  | yes |  |  |  | Vonage application id. |
| `privateKey` | text | yes | yes |  |  |  | Vonage application private key (PEM). |

## agora

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `appId` | string |  | yes |  |  |  | Agora app id. |
| `appCertificate` | string | yes | yes |  |  |  | Agora app certificate. |

## hundredMs

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `accessKey` | string |  | yes |  |  |  | 100ms management access key. |
| `secret` | string | yes | yes |  |  |  | 100ms management secret. |
| `templateId` | string |  |  |  |  |  | Default room template id. |

## awsIvs

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `awsAccessKeyId` | string | yes | yes |  |  |  | AWS access key id. Credential material: delivered as a deploy secret, never compiled into the service. |
| `awsSecretAccessKey` | string | yes | yes |  |  |  | AWS secret access key. |
| `awsRegion` | string |  | yes |  |  |  | AWS region. |

## mux

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `tokenId` | string |  | yes |  |  |  | Mux token id. |
| `tokenSecret` | string | yes | yes |  |  |  | Mux token secret. |

## cloudflareStream

| Key | Type | Secret | Required | Default | Allowed values | Notes | Description |
|---|---|---|---|---|---|---|---|
| `accountId` | string |  | yes |  |  |  | Cloudflare account id. |
| `apiToken` | string | yes | yes |  |  |  | Cloudflare Stream API token. |
| `customerSubdomain` | string |  |  |  |  |  | Customer subdomain for playback URLs. |
