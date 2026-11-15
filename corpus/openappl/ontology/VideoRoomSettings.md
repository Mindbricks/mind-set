# VideoRoomSettings

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomSettings in Part 2](../spec/VideoRoomSettings.md)

Binds the video room to an existing DataObject and configures who may join and with which roomRole. Every video room requires a roomDataObject — an existing DataObject that represents the room (a meeting, a lesson, a live event); clients request tokens by referencing the ID of this DataObject. Authorization uses the RealtimeHub layered flow: (1) roomEligibility checks the room record supports video, (2) absoluteRoles bypass all checks (full-capability system role), (3) checkRoles gates access to specific user roles, (4) checkScript applies a custom condition, (5) authSources and authScripts (OR-logic, ordered highest-privilege first) determine the user's roomRole — the first match wins.

## Contained in

- [VideoRoom](./VideoRoom.md) as `roomSettings`

Blueprint paths:

- `services.videoRooms.roomSettings`

## Contains

- `authSources`: [VideoRoomAuthSource](./VideoRoomAuthSource.md), a list
- `authScripts`: [VideoRoomAuthScript](./VideoRoomAuthScript.md), a list

## References

- `roomDataObject` names an instance of [DataObject](./DataObject.md) (type [LocalDataObjectName](./LocalDataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
