# VideoRoomRecordingSettings

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomRecordingSettings in Part 1](../ontology/VideoRoomRecordingSettings.md)

Recording configuration for the room. Recording runs on the provider's egress (never through the service) and artifacts land in the configured service bucket; the storage keys are written to the {name}RoomSession record and a recordingReady event is published. Recording artifacts are the input of the postSession AI transcription.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Master toggle for recording capability on this room. When false, recording controls and the recording section are inert. Default: false. |
| `autoRecord` | `Boolean` | no | `false` |  |  | When true, every room session records automatically from start to end. When false, recording is started/stopped by roles with canRecord (or a VideoRoomControlAction). Default: false. |
| `mode` | `VideoRecordingMode` | no | `"composite"` | `composite`, `individual`, `audioOnly` |  | What the egress records. 'composite' = one mixed grid video of the whole session (default); 'individual' = one file per participant track (best transcription diarization quality); 'audioOnly' = composite audio track only (cheapest, sufficient for the AI pipeline). |
| `bucketName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the service bucket (a remoteBuckets[] or nativeBuckets[] entry in the SAME service) recording artifacts are uploaded to. The bucket's storage credentials are handed to the provider egress at start-recording time. |
| `retentionDays` | `Integer` | no |  |  |  | Reserved retention window in days. Currently not enforced: recording artifacts are never expired or pruned by this setting. A numeric value raises the design-time VIDEO_RECORDING_RETENTION_DAYS_IGNORED warning. |

## Constraints

Property rules:

- `bucketName` must be present. (`REQUIRED_FIELD_MISSING`)
- `mode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `bucketName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
