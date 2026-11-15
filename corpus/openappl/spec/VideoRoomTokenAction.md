# VideoRoomTokenAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [VideoRoomTokenAction in Part 1](../ontology/VideoRoomTokenAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Authorizes a room identity and mints its provider join token or broadcast playback grant. BusinessApiAction that runs a declared VideoRoom's authorization flow for a room record + identity and mints the provider join credential — an SFU join token carrying the resolved roomRole's media grants, or an HLS playback grant for subscribe-only access to a broadcast room. Writes `{ token, url, roomRole }` to the action context. Use inside composed workflows (e.g. mint a token at the end of a paid-ticket checkout API); simple cases use the room's auto token route instead (codegen phase).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `videoRoom` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the target VideoRoom (must match a service videoRooms[].roomBasics.name). |
| `roomId` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression evaluating to the ID of the room record (an instance of the room's roomDataObject). Example: `{ "js": "this.meeting.id" }`. |
| `identity` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression evaluating to the participant identity encoded in the token. Defaults to the session user's id when absent. |
| `displayName` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression evaluating to the participant's display name shown to other participants. Optional. |
| `roomRole` | `String` | no |  |  |  | Optional roomRole override (must match a roomRoles[].name). When absent (recommended), the role is resolved by the room's authorization flow. |

## Constraints

Property rules:

- `videoRoom`, `roomId` must be present. (`REQUIRED_FIELD_MISSING`)
- `videoRoom` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
