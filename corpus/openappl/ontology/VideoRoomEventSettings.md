# VideoRoomEventSettings

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoomEventSettings in Part 2](../spec/VideoRoomEventSettings.md)

Kafka lifecycle event publication for the room. Events ride the project bus under the service's standard topic naming so other services, realtime hubs (HubKafkaEvent), event subscriptions, and the AI pipeline itself can react: roomStarted, roomEnded, participantJoined, participantLeft, recordingReady, broadcastStarted, broadcastStopped, transcriptReady, insightsReady.

## Contained in

- [VideoRoom](./VideoRoom.md) as `eventSettings`

Blueprint paths:

- `services.videoRooms.eventSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
