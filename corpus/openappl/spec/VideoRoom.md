# VideoRoom

**Level:** `chapter` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoom in Part 1](../ontology/VideoRoom.md)

**Name:** an instance is named by `roomBasics.name`.

Defines a video-conference / live-broadcast room surface for the service (docs/ADR-video-conference-pattern-family.md). A VideoRoom binds an EXISTING DataObject (the room record — a meeting, a lesson, a live event) to a media provider from projectSettings.videoProvidersSettings. The `roomKind` folds the whole family into one chapter: interactive SFU kinds (oneToOne, groupMeeting, webinar) where authorized participants publish camera/mic, and the broadcast kind (one/few publishers → RTMP/HLS/CDN, massive viewer scale) where viewers only watch. Key rule: if viewers only watch → broadcast; if they join with camera/mic → an interactive kind. The generated service is the CONTROL PLANE only — it mints capability-scoped join tokens (via the RealtimeHub-style layered auth flow), drives the provider's room API, persists auto-generated Session/Participant DataObjects, and runs the optional AI pipeline (transcription → meeting analysis → smart search); media itself never passes through the service. Lifecycle events are published on Kafka; recordings land in a service bucket.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `roomBasics` | [`VideoRoomBasics`](./VideoRoomBasics.md) | yes |  |  |  | Core identity of the video room: name, room kind (the family discriminator), and the video provider it runs on. |
| `roomSettings` | [`VideoRoomSettings`](./VideoRoomSettings.md) | yes |  |  |  | Binds the room to an existing DataObject and configures the layered join-authorization flow (roomEligibility → absoluteRoles → checkRoles → checkScript → authSources → authScripts) that determines each user's roomRole. Mirrors the proven RealtimeHub room authorization shape. |
| `roomRoles` | [`VideoRoomRole`](./VideoRoomRole.md)[] | no |  |  |  | Named media-capability sets (publish audio/video, screen share, subscribe, data channel, moderate, record, manage). Roles are assigned to users by the roomSettings authorization flow; the minted join token carries exactly the role's grants. When absent, every authorized user gets the room kind's default capabilities (oneToOne/groupMeeting: full publish+subscribe; webinar/broadcast: subscribe-only audience, absoluteRoles publish). |
| `sessionSettings` | [`VideoRoomSessionSettings`](./VideoRoomSessionSettings.md) | no |  |  |  | Controls the auto-generated session persistence DataObjects ({name}RoomSession per room session, {name}RoomParticipant per join). They are real DataObjects (db-layer, ES indexing); on a nodejs, java, dotnet, rust or python service the framework also injects read-only list/get Business APIs on them (and on {name}MeetingInsight) under /videoroom-history/<room>/, gated by the room's own join authorization and, for a tenant-level room record, pinned to the caller's tenant. No create/update/delete API is generated: the runtime writes these rows. |
| `recordingSettings` | [`VideoRoomRecordingSettings`](./VideoRoomRecordingSettings.md) | no |  |  |  | Recording configuration — mode (composite / individual tracks / audio only) and the service bucket (remoteBuckets / nativeBuckets entry) recording artifacts land in. Recording artifacts are also the input of the postSession AI transcription. |
| `broadcastSettings` | [`VideoRoomBroadcastSettings`](./VideoRoomBroadcastSettings.md) | no |  |  |  | Live-broadcast delivery configuration — HLS output, DVR window, RTMP ingest for external encoders (OBS), latency mode, and simulcast push targets (YouTube Live / Twitch / LinkedIn Live style RTMP endpoints). Only meaningful for the webinar (optional broadcast output of an interactive session) and broadcast room kinds. |
| `aiPipeline` | [`VideoRoomAiPipeline`](./VideoRoomAiPipeline.md) | no |  |  |  | The AI layer on top of the room: speech-to-text transcription, LLM meeting analysis (summary, action items, decisions, topics, custom prompts), and smart search over transcripts + insights via Elasticsearch. Providers are referenced BY NAME from projectSettings.aiProvidersSettings — no new provider system. |
| `eventSettings` | [`VideoRoomEventSettings`](./VideoRoomEventSettings.md) | no |  |  |  | Kafka lifecycle event publication for the room (roomStarted, roomEnded, participantJoined/Left, recordingReady, broadcastStarted/Stopped, transcriptReady, insightsReady). |
| `guardrails` | [`VideoRoomGuardrails`](./VideoRoomGuardrails.md) | no |  |  |  | Safety limits for the room: participant/publisher caps, duration cap, empty-room timeout, and join-token TTL. |
| `meetingAgents` | [`VideoMeetingAgent`](./VideoMeetingAgent.md)[] | no |  |  |  | AI meeting/voice agents that JOIN the room as participants (docs/ADR-video-live-ai-layer.md §4). Each entry references an aiAgents agent deployed in the owning service; the in-session live worker joins it as a participant, feeds it addressed turns from the caption stream (or direct data-channel messages), relays its text reply on the room data channel, and — when voiceEnabled — speaks the reply through a published audio track. Only meaningful on interactive rooms on an AI_PIPELINE_BRANDS provider (native/livekit); mention/always turn policies require live transcription. |

## Constraints

Property rules:

- `roomBasics`, `roomSettings` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `roomRoles` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `meetingAgents` must have distinct names (`agentName`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `VIDEO_AI_PIPELINE_BRAND_UNSUPPORTED` | error | Provider "…" (brand "…") cannot feed the AI pipeline — the workers consume recording artifacts from the room's bucket via the recordingReady egress event, which only … deliver. |
| `VIDEO_AI_PROVIDER_NOT_FOUND` | error | AI provider "…" not found in projectSettings.aiProvidersSettings.… |
| `VIDEO_ANALYSIS_NEEDS_TRANSCRIPTION` | error | meetingAnalysis runs over the transcript — enable aiPipeline.transcription first. |
| `VIDEO_BROADCAST_DVR_WINDOW_IGNORED` | warning | broadcastSettings.dvrWindowMinutes is currently not implemented — no code generator reads it, so no DVR window is provisioned on any provider. |
| `VIDEO_BROADCAST_LATENCY_MODE_IGNORED` | warning | broadcastSettings.latencyMode "low" is currently not consumed by the "…" adapter — the stream runs at the provider's default latency. |
| `VIDEO_BROADCAST_LATENCY_MODE_OVERRIDDEN` | warning | broadcastSettings.latencyMode "…" is overridden on awsIvs — the generated adapter always provisions the IVS channel with LOW latency. |
| `VIDEO_BROADCAST_MAX_VIEWERS_IGNORED` | warning | broadcastSettings.maxViewers is currently not enforced — no code generator reads it, so viewer counts are unlimited (subject only to provider limits). |
| `VIDEO_BROADCAST_SETTINGS_KIND_MISMATCH` | error | broadcastSettings is only meaningful for webinar and broadcast room kinds (got "…"). |
| `VIDEO_EVENTS_REQUIRED_FOR_AI_PIPELINE` | error | publishLifecycleEvents: false silences the room's lifecycle event spine (roomStarted/roomEnded/recordingReady/transcriptReady), but this room declares ……… whose workers are driven entirely by those events — the AI … |
| `VIDEO_GUARDRAIL_MAX_PUBLISHERS_IGNORED` | warning | guardrails.maxPublishers is currently not enforced — no code generator reads it. |
| `VIDEO_LIVE_TRANSLATION_NEEDS_LIVE_TRANSCRIPTION` | error | liveTranslation translates LIVE captions — enable transcription with mode "live" or "both". |
| `VIDEO_LIVE_TRANSLATION_NO_LANGUAGES` | error | liveTranslation requires at least one target language. |
| `VIDEO_MEDIA_ROUTING_NOT_IMPLEMENTED` | error | mediaRouting "…" is not implemented yet — the generated runtime always uses SFU routing, so this setting would be silently ignored. |
| `VIDEO_MEETING_AGENT_BRAND_UNSUPPORTED` | error | Provider "…" (brand "…") cannot host meeting agents — the live AI layer joins the room as a participant on the SFU we control, which only … expose. |
| `VIDEO_MEETING_AGENT_KIND_UNSUPPORTED` | error | meetingAgents require an interactive room kind (oneToOne/groupMeeting/webinar) — a broadcast room has no participant session for an agent to join (got "…"). |
| `VIDEO_MEETING_AGENT_NEEDS_LIVE_TRANSCRIPTION` | error | Meeting agent "…" uses respondTo "…", which reads the live caption stream — enable aiPipeline.transcription with mode "live" or "both" (or use respondTo "directMessage"). |
| `VIDEO_MEETING_AGENT_NOT_FOUND` | error | Meeting agent "…" does not resolve to an aiAgents agent deployed in this service.… |
| `VIDEO_MEETING_AGENT_SURFACE_NOT_DECLARED` | error | Meeting agent "…" declares endpointSettings.surfaces […] without 'videoRoom' — this room references a surface the agent's declaration excludes. |
| `VIDEO_MEETING_AGENT_VOICE_NO_PROVIDER` | error | Meeting agent "…" is voiceEnabled but no aiProvider is declared in projectSettings.aiProvidersSettings to synthesize speech (TTS). |
| `VIDEO_MEETING_AGENT_VOICE_NO_TTS_PROVIDER` | error | Meeting agent "…" is voiceEnabled but this room resolves no TTS provider — agent speech rides the room's aiPipeline.transcription (or aiPipeline.liveTranslation) providerName, and neither is enabled with a provider here. |
| `VIDEO_P2P_EXCLUDES_AI_PIPELINE` | error | mediaRouting "p2p" disables the AI pipeline (including meetingAgents) — media never touches a server. |
| `VIDEO_P2P_EXCLUDES_RECORDING` | error | mediaRouting "p2p" disables recording — media never touches a server. |
| `VIDEO_P2P_ONLY_ONE_TO_ONE` | error |  |
| `VIDEO_PROVIDER_KIND_MISMATCH` | error | Provider "…" (brand "…") is broadcast-only and cannot host the interactive room kind "…". |
| `VIDEO_PROVIDER_NOT_FOUND` | error | Video provider "…" not found in projectSettings.videoProvidersSettings.… |
| `VIDEO_RECORDING_BRAND_UNSUPPORTED` | error | Provider "…" (brand "…") has no server-side recording control — the generated adapter cannot start/stop a recording. |
| `VIDEO_RECORDING_MODE_INDIVIDUAL_UNSUPPORTED` | warning | recordingSettings.mode "individual" is currently not implemented — the generated adapters only start composite (or audioOnly) egress, so the session is recorded as a single composite file. |
| `VIDEO_RECORDING_RETENTION_DAYS_IGNORED` | warning | recordingSettings.retentionDays is currently not enforced — no code generator reads it, so recorded artifacts are never expired or pruned. |
| `VIDEO_ROOM_BUCKET_NOT_FOUND` | error | Recording bucket "…" must match a remoteBuckets[] or nativeBuckets[] entry declared in this service.… |
| `VIDEO_ROOM_DATA_OBJECT_CONFLICT` | error | Data object "…" conflicts with an existing data object in this service. |
| `VIDEO_ROOM_ROLE_NOT_FOUND` | error | roomRole "…" is not declared in this video room's roomRoles.… |
| `VIDEO_SEARCH_NEEDS_TRANSCRIPTION` | error | smartSearch indexes transcripts — enable aiPipeline.transcription (or set indexTranscripts false). |
| `VIDEO_SIMULCAST_BRAND_UNSUPPORTED` | error | Provider "…" (brand "…") cannot push RTMP simulcast outputs — the generated adapter has no startBroadcast egress. |
| `VIDEO_SMART_SEARCH_EMBEDDING_PROVIDER_IGNORED` | warning | smartSearch.embeddingProviderName is currently not used at runtime — smartSearch runs a plain Elasticsearch text query over the transcript/insight indices and never calls an embedding provider. |
| `VIDEO_TRANSCRIPTION_DIARIZATION_IGNORED` | warning | aiPipeline.transcription.diarization is currently not consumed — the transcription workers call speechToText without a diarization parameter, so transcripts are not speaker-separated. |
| `VIDEO_TRANSCRIPTION_NEEDS_RECORDING` | error | Transcription mode "…" consumes the session recording artifact — enable recordingSettings for this room (or use mode "live"). |
