# VideoRoomSessionSettings

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomSessionSettings in Part 2](../spec/VideoRoomSessionSettings.md)

Controls the auto-generated session persistence DataObjects. {name}RoomSession holds one row per room session (start/end, peak participant count, recording storage keys, broadcast playback URL); {name}RoomParticipant holds one row per participant join (identity, roomRole, join/leave timestamps, publish stats). They are real DataObjects (db-layer, Elasticsearch indexing). On a nodejs, java or dotnet service the framework injects read-only list<Object>s / get<Object> Business APIs on them for meeting-history and attendance screens: GET /videoroom-history/<room>/rooms/{roomId}/sessions (or /participants) lists one room record's rows, GET /videoroom-history/<room>/sessions/{id} (or /participants/{id}) reads one row. Every call runs the room's own join authorization for that room record (and requires a tenant-level room record to belong to the caller's tenant), answering 403 VIDEO_ROOM_HISTORY_ACCESS_DENIED otherwise. No create/update/delete API is generated: the runtime writes these rows.

## Contained in

- [VideoRoom](./VideoRoom.md) as `sessionSettings`

Blueprint paths:

- `services.videoRooms.sessionSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
