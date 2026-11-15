# VideoRoomBasics

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomBasics in Part 2](../spec/VideoRoomBasics.md)

Core identity of the video room. The name is used as the code identifier, the auto route prefix (/videoroom/{name}/), and the prefix of the auto-generated DataObjects ({name}RoomSession, {name}RoomParticipant, {name}Transcript, {name}MeetingInsight).

## Contained in

- [VideoRoom](./VideoRoom.md) as `roomBasics`

Blueprint paths:

- `services.videoRooms.roomBasics`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
