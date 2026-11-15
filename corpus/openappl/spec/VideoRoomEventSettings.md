# VideoRoomEventSettings

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomEventSettings in Part 1](../ontology/VideoRoomEventSettings.md)

Kafka lifecycle event publication for the room. Events ride the project bus under the service's standard topic naming so other services, realtime hubs (HubKafkaEvent), event subscriptions, and the AI pipeline itself can react: roomStarted, roomEnded, participantJoined, participantLeft, recordingReady, broadcastStarted, broadcastStopped, transcriptReady, insightsReady.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `publishLifecycleEvents` | `Boolean` | no | `true` |  |  | When true (default), the room publishes its lifecycle events to Kafka. The AI pipeline's post-session stages are driven by these events, so disabling them also disables postSession AI processing. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
