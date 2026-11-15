# VideoMeetingAgent

**Level:** `section` · **Family:** [VideoRoom](./families.md#videoroom) (domain `Service`)

**Specification:** [VideoMeetingAgent in Part 2](../spec/VideoMeetingAgent.md)

An AI meeting/voice agent that joins the video room as a participant (docs/ADR-video-live-ai-layer.md §4). agentName references an aiAgents agent deployed in the owning service. When the in-session live worker claims the room it joins the agent (autoJoin) as a participant, feeds it addressed turns per respondTo (a caption mention, a direct data-channel message, or every utterance), publishes the agent's text reply on the room data channel, and — when voiceEnabled — synthesizes the reply to speech on a published audio track. Requires an interactive room on an AI_PIPELINE_BRANDS provider (native/livekit); mention/always policies require live transcription.

## Contained in

- [VideoRoom](./VideoRoom.md) as `meetingAgents` (a list)

Blueprint paths:

- `services.videoRooms.meetingAgents`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
