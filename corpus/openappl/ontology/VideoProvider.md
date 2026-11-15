# VideoProvider

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [VideoProvider in Part 2](../spec/VideoProvider.md)

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

## Contained in

- [VideoProvidersSettings](./VideoProvidersSettings.md) as `videoProviders` (a list)

## Contains

- `configuration`: [DataMapSimpleItem](./DataMapSimpleItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
