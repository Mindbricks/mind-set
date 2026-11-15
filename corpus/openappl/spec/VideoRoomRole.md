# VideoRoomRole

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomRole in Part 1](../ontology/VideoRoomRole.md)

**Name:** an instance is named by `name`.

Defines a named media-capability set for video room users. Each capability maps 1:1 onto a grant in the minted provider join token (e.g. LiveKit video grants) — the SFU enforces them, the service only declares them. Roles are assigned by authSources, authScripts, or absoluteRoles (which get a built-in full-capability 'system' role). Examples: a webinar 'speaker' (publish all), 'attendee' (subscribe + data channel), a broadcast 'presenter' vs 'viewer' (playback only).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique role name, referenced by authSources/authScripts via their roomRole property. Examples: 'host', 'speaker', 'attendee', 'viewer'. |
| `canPublishAudio` | `Boolean` | no | `true` |  |  | When true, the user may publish their microphone. Default: true. |
| `canPublishVideo` | `Boolean` | no | `true` |  |  | When true, the user may publish their camera. Default: true. |
| `canScreenShare` | `Boolean` | no | `false` |  |  | When true, the user may publish a screen-share track. Default: false. |
| `canSubscribe` | `Boolean` | no | `true` |  |  | When true, the user receives other participants' tracks (or the HLS playback grant in a broadcast room). Default: true. |
| `canUseDataChannel` | `Boolean` | no | `true` |  |  | When true, the user may send data-channel messages (in-room chat, reactions, live caption relay). Default: true. |
| `canModerate` | `Boolean` | no | `false` |  |  | When true, the user can mute/remove other participants and approve pending speakers. Default: false. |
| `canRecord` | `Boolean` | no | `false` |  |  | When true, the user can start/stop recording (when recordingSettings is enabled and autoRecord is false). Default: false. |
| `canManageRoom` | `Boolean` | no | `false` |  |  | When true, the user can start/end the room session and start/stop broadcast outputs. Default: false. |
| `hidden` | `Boolean` | no | `false` |  |  | When true, the user joins invisibly (not listed to other participants) — for observers, QA monitors, or service bots. Default: false. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
