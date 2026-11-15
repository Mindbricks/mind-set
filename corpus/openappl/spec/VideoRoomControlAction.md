# VideoRoomControlAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [VideoRoomControlAction in Part 1](../ontology/VideoRoomControlAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Performs a provider control-plane operation on a declared VideoRoom. BusinessApiAction that performs a control-plane operation against a declared VideoRoom through its provider's server API: create or end a room session, remove/mute a participant, start/stop recording, start/stop broadcast outputs. The media itself never passes through the service — this action only drives the provider. Writes the provider response (e.g. session info, egress id) to the action context.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `videoRoom` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the target VideoRoom (must match a service videoRooms[].roomBasics.name). |
| `operation` | `VideoRoomControlOperation` | yes |  | `createRoom`, `endRoom`, `removeParticipant`, `muteParticipant`, `startRecording`, `stopRecording`, `startBroadcast`, `stopBroadcast` |  | The control-plane operation to perform. |
| `roomId` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression evaluating to the ID of the room record the operation targets. Example: `{ "js": "this.meeting.id" }`. |
| `participantIdentity` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression evaluating to the target participant identity — required by removeParticipant / muteParticipant, ignored by the other operations. |

## Constraints

Property rules:

- `videoRoom`, `operation`, `roomId` must be present. (`REQUIRED_FIELD_MISSING`)
- `operation` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `videoRoom` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
