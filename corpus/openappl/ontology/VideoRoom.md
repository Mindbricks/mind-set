# VideoRoom

**Level:** `chapter` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoRoom in Part 2](../spec/VideoRoom.md)

Defines a video-conference / live-broadcast room surface for the service (docs/ADR-video-conference-pattern-family.md). A VideoRoom binds an EXISTING DataObject (the room record — a meeting, a lesson, a live event) to a media provider from projectSettings.videoProvidersSettings. The `roomKind` folds the whole family into one chapter: interactive SFU kinds (oneToOne, groupMeeting, webinar) where authorized participants publish camera/mic, and the broadcast kind (one/few publishers → RTMP/HLS/CDN, massive viewer scale) where viewers only watch. Key rule: if viewers only watch → broadcast; if they join with camera/mic → an interactive kind. The generated service is the CONTROL PLANE only — it mints capability-scoped join tokens (via the RealtimeHub-style layered auth flow), drives the provider's room API, persists auto-generated Session/Participant DataObjects, and runs the optional AI pipeline (transcription → meeting analysis → smart search); media itself never passes through the service. Lifecycle events are published on Kafka; recordings land in a service bucket.

## Contained in

- [Service](./Service.md) as `videoRooms` (a list)

Blueprint paths:

- `services.videoRooms`

## Contains

- `roomBasics`: [VideoRoomBasics](./VideoRoomBasics.md)
- `roomSettings`: [VideoRoomSettings](./VideoRoomSettings.md)
- `roomRoles`: [VideoRoomRole](./VideoRoomRole.md), a list
- `sessionSettings`: [VideoRoomSessionSettings](./VideoRoomSessionSettings.md)
- `recordingSettings`: [VideoRoomRecordingSettings](./VideoRoomRecordingSettings.md)
- `broadcastSettings`: [VideoRoomBroadcastSettings](./VideoRoomBroadcastSettings.md)
- `aiPipeline`: [VideoRoomAiPipeline](./VideoRoomAiPipeline.md)
- `eventSettings`: [VideoRoomEventSettings](./VideoRoomEventSettings.md)
- `guardrails`: [VideoRoomGuardrails](./VideoRoomGuardrails.md)
- `meetingAgents`: [VideoMeetingAgent](./VideoMeetingAgent.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
