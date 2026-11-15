# VideoSimulcastTarget

**Level:** `subsection` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoSimulcastTarget in Part 1](../ontology/VideoSimulcastTarget.md)

**Name:** an instance is named by `name`.

One external RTMP push target of a broadcast (e.g. a YouTube Live / Twitch / LinkedIn Live endpoint). The provider egress pushes the program feed to rtmpUrl using the secret streamKey.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique target identifier. Examples: 'youtube', 'twitch', 'linkedin'. |
| `rtmpUrl` | `String` | yes |  |  |  | The target's RTMP(S) ingest URL, e.g. 'rtmp://a.rtmp.youtube.com/live2'. |
| `streamKey` | `String` | yes |  |  | **secret** | The target's stream key. Secret — masked in API responses and emitted to a VIDEO-room env var at codegen time. |

## Constraints

Property rules:

- `name`, `rtmpUrl`, `streamKey` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
