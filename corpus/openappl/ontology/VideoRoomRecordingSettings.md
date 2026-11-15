# VideoRoomRecordingSettings

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomRecordingSettings in Part 2](../spec/VideoRoomRecordingSettings.md)

Recording configuration for the room. Recording runs on the provider's egress (never through the service) and artifacts land in the configured service bucket; the storage keys are written to the {name}RoomSession record and a recordingReady event is published. Recording artifacts are the input of the postSession AI transcription.

## Contained in

- [VideoRoom](./VideoRoom.md) as `recordingSettings`

Blueprint paths:

- `services.videoRooms.recordingSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
