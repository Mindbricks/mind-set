# VideoProvider

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [VideoProvider in Part 1](../ontology/VideoProvider.md)

**Name:** an instance is named by `name`.

**Provider catalog:** the configuration keys of each brand are in [videoProvider](./providers/videoProvider.md).

A named video-conference / live-broadcast provider configuration. The `name` is the lookup key used by `VideoRoom.roomBasics.providerName` and the env-var prefix (e.g. `mainVideo` → `VIDEO_MAINVIDEO_*`). The `provider` enum selects the backend adapter; the `configuration` is a free-form key/value list whose required keys depend on the chosen `provider` (the aiProvidersSettings idiom). The brands cover the four adoption levels of docs/ADR-video-conference-pattern-family.md §3a — embedded video API (MVP), CPaaS (growing SaaS), self-hosted (enterprise), and platform-provisioned native — so a project can start on a managed brand and migrate to self-hosted/native WITHOUT touching its VideoRoom business design (only the provider entry changes).

Capabilities per brand — interactive (SFU rooms: oneToOne/groupMeeting/webinar) vs broadcast (HLS out / RTMP in, the `broadcast` room kind):
- native: interactive + broadcast (platform-provisioned LiveKit incl. egress/ingress)
- livekit: interactive + broadcast (egress/ingress)
- jitsi: interactive (broadcast partial, via jibri)
- daily: interactive + broadcast
- whereby: interactive ONLY (Embedded join-URL model — the token route returns a room URL, not an SFU token; no server-side egress pipeline)
- zoom: interactive (Zoom Video SDK, NOT Zoom Meetings; broadcast partial via RTMP livestream)
- twilio: interactive ONLY (Twilio Video — carries platform risk: EOL announced 2023 then walked back; prefer other brands for new projects)
- vonage: interactive + broadcast (Vonage Video API, ex-TokBox/OpenTok; HLS/RTMP broadcast supported)
- agora: interactive + broadcast
- hundredMs: interactive + broadcast (100ms; HLS live streaming)
- awsIvs: broadcast ONLY
- mux: broadcast ONLY
- cloudflareStream: broadcast ONLY

Expected configuration keys per provider:
- native: NO keys — the hosting platform provisions the server (NativeBucket precedent); resolved at runtime from VIDEO_<NAME>_URL / VIDEO_<NAME>_API_KEY / VIDEO_<NAME>_API_SECRET (locally the FARM LiveKit ws://localhost:17880, devkey/secret)
- livekit: url (ws(s):// server url), apiKey, apiSecret (secret)
- jitsi: domain (e.g. meet.example.com), appId, appSecret (secret — JWT auth for self-hosted/JaaS)
- daily: domain (e.g. yourteam.daily.co), apiKey (secret)
- whereby: apiKey (secret — Whereby Embedded API key)
- zoom: sdkKey, sdkSecret (secret — Zoom Video SDK credentials)
- twilio: accountSid, apiKeySid, apiKeySecret (secret)
- vonage: applicationId, privateKey (secret — Vonage application private key)
- agora: appId, appCertificate (secret)
- hundredMs: accessKey, secret (secret — 100ms management credentials), templateId (optional default room template)
- awsIvs: awsAccessKeyId (secret), awsSecretAccessKey (secret), awsRegion
- mux: tokenId, tokenSecret (secret)
- cloudflareStream: accountId, apiToken (secret)

Secret keys (apiSecret, appSecret, apiKey, sdkSecret, apiKeySecret, privateKey, appCertificate, secret, awsAccessKeyId, awsSecretAccessKey, tokenSecret, apiToken) are masked in API responses and emitted to VIDEO_<NAME>_<KEY> env vars at codegen time.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique provider identifier within the project. Used as the lookup key from VideoRoom.roomBasics.providerName and as the env-var prefix (VIDEO_<NAME>_*). Must be a valid codeName. |
| `provider` | `VideoProviderType` | no | `"native"` | 13 values, see [VideoProviderType](#videoprovidertype) |  | The backend provider brand. Decides which keys are expected in `configuration`, which adapter the codegen wires up, and which room kinds the provider can host (interactive SFU kinds vs the broadcast kind — see the VideoProvider doc string capability list). |
| `configuration` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | Free-form key/value list of provider-specific credentials and settings. The required keys depend on `provider` — see the VideoProvider doc string for the per-provider key list. Empty/absent for the `native` brand (the hosting platform provisions the server). Sensitive keys are masked in API responses and emitted to environment variables at codegen time. |

## Allowed values

### VideoProviderType

`native`, `livekit`, `jitsi`, `daily`, `whereby`, `zoom`, `twilio`, `vonage`, `agora`, `hundredMs`, `awsIvs`, `mux`, `cloudflareStream`

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `configuration` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `VIDEO_PROVIDER_MISSING_CONFIGURATION` | error | Video provider brand "…" requires the configuration key…: …. |
| `VIDEO_PROVIDER_NATIVE_HAS_CREDENTIALS` | error |  |
