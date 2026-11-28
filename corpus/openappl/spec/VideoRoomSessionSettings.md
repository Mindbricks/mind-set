# VideoRoomSessionSettings

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomSessionSettings in Part 1](../ontology/VideoRoomSessionSettings.md)

Controls the auto-generated session persistence DataObjects. {name}RoomSession holds one row per room session (start/end, peak participant count, recording storage keys, broadcast playback URL); {name}RoomParticipant holds one row per participant join (identity, roomRole, join/leave timestamps, publish stats). They are real DataObjects (db-layer, Elasticsearch indexing). On a nodejs, java, dotnet, rust or python service the framework injects read-only list<Object>s / get<Object> Business APIs on them for meeting-history and attendance screens: GET /videoroom-history/<room>/rooms/{roomId}/sessions (or /participants) lists one room record's rows, GET /videoroom-history/<room>/sessions/{id} (or /participants/{id}) reads one row. Every call runs the room's own join authorization for that room record (and requires a tenant-level room record to belong to the caller's tenant), answering 403 VIDEO_ROOM_HISTORY_ACCESS_DENIED otherwise. No create/update/delete API is generated: the runtime writes these rows.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `persistSessions` | `Boolean` | no | `true` |  |  | When true (default), a {name}RoomSession DataObject is auto-generated and one record is written per room session (created on roomStarted, finalized on roomEnded). |
| `persistParticipants` | `Boolean` | no | `true` |  |  | When true (default), a {name}RoomParticipant DataObject is auto-generated and one record is written per participant join (finalized on leave with duration and publish stats). |
| `sessionDataObjectName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Override name for the auto-generated session DataObject. Defaults to '{roomName}RoomSession'. Must be a valid code name. |
| `participantDataObjectName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Override name for the auto-generated participant DataObject. Defaults to '{roomName}RoomParticipant'. Must be a valid code name. |

## Constraints

Property rules:

- `sessionDataObjectName`, `participantDataObjectName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
