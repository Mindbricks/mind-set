# VideoRoomBroadcastSettings

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomBroadcastSettings in Part 1](../ontology/VideoRoomBroadcastSettings.md)

Live-broadcast delivery for webinar and broadcast room kinds. Configures the HLS output viewers play, the DVR window, RTMP ingest for external encoders (OBS/vMix) as publishers, the latency mode, and simulcast push targets — external RTMP endpoints (YouTube Live, Twitch, LinkedIn Live) the provider egress pushes the program feed to in parallel. Broadcast viewers authorize through the SAME roomSettings flow but receive an HLS playback grant instead of an SFU join token.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hlsEnabled` | `Boolean` | no | `true` |  |  | When true (default), the room session is packaged to HLS and viewers receive the playback URL (written to the session record and returned by the token route for subscribe-only roles). Default: true. |
| `dvrWindowMinutes` | `Integer` | no | `0` |  |  | Reserved on nodejs: intended minutes of rewindable DVR window retained in HLS output; 0 (default) means live edge only. No generated adapter currently provisions a rolling DVR window. Positive values emit VIDEO_BROADCAST_DVR_WINDOW_IGNORED and do not affect playback. Leave at 0 until exact provider window support is implemented. |
| `rtmpIngestEnabled` | `Boolean` | no | `false` |  |  | Declares that the room's publisher streams from an external RTMP encoder (OBS, vMix, hardware). Only the broadcast-only brands (mux, awsIvs, cloudflareStream) serve it: their publisher /token answer is the RTMP(S) ingest URL + stream key. A LiveKit (native/livekit) or other SFU-brand room returns no ingest URL or stream key from /token or /control, so the flag is config data only there. Default: false. |
| `latencyMode` | `VideoBroadcastLatencyMode` | no | `"standard"` | `standard`, `low` |  | Delivery latency/scale trade-off for the HLS output. 'standard' = normal HLS latency (~10-30s), maximum CDN compatibility (default); 'low' = low-latency HLS (~2-6s) where the provider supports it. |
| `maxViewers` | `Integer` | no |  |  |  | Reserved on nodejs: intended cap on concurrent broadcast viewers (playback grants). Null/absent means unlimited. The current token route returns the session's playback URL without an expiring viewer-grant lifecycle, so numeric values emit VIDEO_BROADCAST_MAX_VIEWERS_IGNORED and do not impose a concurrent-viewer cap. Leave null until playback admission and release semantics are implemented. |
| `simulcastTargets` | [`VideoSimulcastTarget`](./VideoSimulcastTarget.md)[] | no |  |  |  | External RTMP endpoints the provider egress pushes the program feed to in parallel with (or instead of) HLS — this is where YouTube Live / Twitch / LinkedIn Live live. Each target is a named rtmpUrl + secret streamKey. |

## Constraints

Property rules:

- `latencyMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `simulcastTargets` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
