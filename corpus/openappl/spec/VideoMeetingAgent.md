# VideoMeetingAgent

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoMeetingAgent in Part 1](../ontology/VideoMeetingAgent.md)

**Name:** an instance is named by `agentName`.

An AI meeting/voice agent that joins the video room as a participant (docs/ADR-video-live-ai-layer.md §4). agentName references an aiAgents agent deployed in the owning service. When the in-session live worker claims the room it joins the agent (autoJoin) as a participant, feeds it addressed turns per respondTo (a caption mention, a direct data-channel message, or every utterance), publishes the agent's text reply on the room data channel, and — when voiceEnabled — synthesizes the reply to speech on a published audio track. Requires an interactive room on an AI_PIPELINE_BRANDS provider (native/livekit); mention/always policies require live transcription.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `agentName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the aiAgents agent this participant runs. Must resolve to an agent DEPLOYED IN THE OWNING SERVICE (hub-level agents without a service assignment do not yet count — docs/ADR-video-live-ai-layer.md §4d). |
| `displayName` | `String` | no |  |  |  | Participant name shown to other participants in the room. Defaults to agentName when absent. |
| `roomRoleName` | `String` | no |  |  |  | roomRole (from roomRoles[].name) granted to the agent participant. When absent a default role is synthesized: canSubscribe + canUseDataChannel + (voiceEnabled ? canPublishAudio), hidden:false — an AI participant is visible by default. Set an explicit hidden role for recorder-style agents. |
| `autoJoin` | `Boolean` | no | `true` |  |  | When true (default), the agent joins as soon as the live worker claims the room session. When false the agent is provisioned but joined on demand. |
| `respondTo` | `VideoMeetingAgentRespondPolicy` | no | `"mention"` | `mention`, `directMessage`, `always` |  | Turn policy. 'mention' (default) = respond when a final utterance contains the agent's display name; 'directMessage' = respond only to data-channel messages addressed to the agent (no transcription required); 'always' = respond to every final utterance (rate-limited). |
| `voiceEnabled` | `Boolean` | no | `false` |  |  | When true, the agent speaks its replies: the reply text is synthesized to speech and pushed to a published audio track. Requires a TTS-capable AI provider. Default: false. |
| `voice` | `String` | no |  |  |  | TTS voice name for the spoken reply (provider-specific). Defaults to the provider's default voice. |
| `language` | `String` | no |  |  |  | BCP-47 language the agent replies in (e.g. 'en', 'tr'). Defaults to the room transcription language. |
| `bargeIn` | `Boolean` | no | `true` |  |  | When true (default), sustained human speech while this voice agent is talking cancels its in-flight TTS reply (barge-in / turn-taking). Set false to let the agent always finish. Only meaningful when voiceEnabled. Env VIDEO_LIVE_BARGE_IN=false disables barge-in room-wide. |

## Constraints

Property rules:

- `agentName` must be present. (`REQUIRED_FIELD_MISSING`)
- `respondTo` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `agentName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
