# VideoRoomBasics

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomBasics in Part 1](../ontology/VideoRoomBasics.md)

Core identity of the video room. The name is used as the code identifier, the auto route prefix (/videoroom/{name}/), and the prefix of the auto-generated DataObjects ({name}RoomSession, {name}RoomParticipant, {name}Transcript, {name}MeetingInsight).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique room identifier within the service. Used as the auto REST route prefix (/videoroom/{name}/) and the auto-generated DataObject prefix. Must be a valid code name (camelCase). Examples: 'teamMeeting', 'lessonRoom', 'townHall'. |
| `description` | `Text` | no |  |  |  | Human-readable description of the room's purpose. Used in documentation and AI assistant context. |
| `roomKind` | `VideoRoomKind` | no | `"groupMeeting"` | `oneToOne`, `groupMeeting`, `webinar`, `broadcast` |  | The family discriminator. 'oneToOne' = SFU call capped at 2 participants, everyone publishes. 'groupMeeting' = interactive SFU meeting, everyone may publish. 'webinar' = SFU with few publishers and a silenced audience (via roomRoles); may ALSO enable broadcastSettings to stream the session out to HLS/simulcast. 'broadcast' = YouTube-Live-style: one/few publishers (SFU or RTMP ingest) → HLS/CDN playback for massive viewer scale; viewers receive playback grants, not SFU join tokens. Key rule: viewers only watch → broadcast; viewers join with camera/mic → an interactive kind. |
| `providerName` | `String` | yes |  |  |  | Name of the video provider this room runs on (must match a projectSettings.videoProvidersSettings.videoProviders[].name). Interactive kinds (oneToOne/groupMeeting/webinar) require an interactive-capable brand; the broadcast kind requires a broadcast-capable brand — see the VideoProvider capability list. |
| `mediaRouting` | `VideoMediaRoutingMode` | no | `"sfu"` | `sfu`, `p2p`, `auto` |  | Intended media-routing policy for interactive room kinds. Node.js currently accepts absent/'sfu' (the default) and rejects 'p2p'/'auto' with VIDEO_MEDIA_ROUTING_NOT_IMPLEMENTED. The intended 'p2p' contract is oneToOne only, without enabled recording or AI pipeline. Provider TURN fallback and adaptive routing guarantees require a capability ruling before other modes can be enabled. Intended routing semantics do not apply to broadcast, but the current validator still rejects p2p/auto when declared there. Leave absent. |

## Constraints

Property rules:

- `name`, `providerName` must be present. (`REQUIRED_FIELD_MISSING`)
- `roomKind`, `mediaRouting` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
