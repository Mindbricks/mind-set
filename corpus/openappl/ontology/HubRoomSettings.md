# HubRoomSettings

**Level:** `section` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubRoomSettings in Part 2](../spec/HubRoomSettings.md)

Configures how rooms are managed and who can join them. Every hub requires a roomDataObject -- an existing DataObject that represents rooms. Authorization uses a layered flow: (1) roomEligibility checks if the room supports real-time features, (2) absoluteRoles bypass all checks, (3) checkRoles gates access to specific user roles, (4) checkScript applies a custom condition, (5) authSources and authScripts (OR-logic) determine the user's hub role. The first matching authSource/authScript wins (ordered highest-privilege first).

## Contained in

- [RealtimeHub](./RealtimeHub.md) as `roomSettings`

Blueprint paths:

- `services.realtimeHubs.roomSettings`

## Contains

- `authSources`: [HubAuthSource](./HubAuthSource.md), a list
- `authScripts`: [HubAuthScript](./HubAuthScript.md), a list

## References

- `roomDataObject` names an instance of [DataObject](./DataObject.md) (type [LocalDataObjectName](./LocalDataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
