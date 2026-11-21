# VideoRoomGuardrails

**Level:** `section` · **Family:** [VideoRoom](../ontology/families.md#videoroom) (domain `Service`)

**Ontology:** [VideoRoomGuardrails in Part 1](../ontology/VideoRoomGuardrails.md)

Safety limits for the room. All values have sensible defaults; tune per room kind (an oneToOne room is effectively capped at 2 participants regardless of maxParticipants).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `maxParticipants` | `Integer` | no | `50` |  |  | Maximum concurrent SFU participants in a room session. Broadcast HLS viewers do not count toward this limit. Generated Node.js services do not enforce broadcastSettings.maxViewers. Default: 50. |
| `maxPublishers` | `Integer` | no |  |  |  | Reserved on nodejs: intended maximum concurrent publishing participants. Null/absent permits every participant whose room role allows publishing. Numeric values emit VIDEO_GUARDRAIL_MAX_PUBLISHERS_IGNORED; the runtime currently applies role capabilities but has no atomic publisher-count admission gate. Leave null until provider admission or publish-grant lifecycle semantics are implemented. |
| `maxDurationMinutes` | `Integer` | no | `240` |  |  | Maximum room session duration in minutes; the session is force-ended when exceeded. Default: 240. |
| `emptyTimeoutSeconds` | `Integer` | no | `300` |  |  | Seconds an empty room (no connected participants) is kept alive before the session auto-ends. Default: 300. |
| `joinTokenTTLSeconds` | `Integer` | no | `600` |  |  | Validity window of a minted join token in seconds. Default: 600. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
