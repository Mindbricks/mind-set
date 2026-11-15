# ContentModeration

**Level:** `section` · **Family:** [EventNotification](../ontology/families.md#eventnotification) (domain `NotificationService`)

**Ontology:** [ContentModeration in Part 1](../ontology/ContentModeration.md)

**Activation:** the pattern is switched on by `enabled`.

Decision moderation of content that is not a DataObject write: objectModeration applied to RealtimeHub messages and outbound notification content. It is the SAME mechanism as ObjectModeration, not a second one: ONE framework-owned `choice` question, `verdict`, over { accept, reject, review } with `policy` as its instructions, the same `confidenceThreshold` (below it a verdict goes to review), the same `onProviderError` posture, the same two-tier reasons (`wantReason` + `escalateTo`) and the same review row shape (`sys_<X>ModerationReview`, decided through the same injected reviewer Business APIs). What differs is the surface: a held message or notification is not written anywhere until a reviewer accepts it, and the accept DELIVERS it (the room receives the message, the recipients the notification). A ContentModel uses its own `contentModeration` block, an ObjectModeration the framework applies to the content objects it synthesizes. Hub and notification moderation is implemented for nodejs, java, dotnet and rust; other unported languages retain OBJECT_MODERATION_LANGUAGE_UNSUPPORTED.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | yes |  |  |  | Turns moderation on for this surface. False (the default) leaves the block inert: no review object, no injected api, no interception, and the hub or notification is generated exactly as without the block. The other fields are only checked while this is true. |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry that judges this surface's content. Its credentials come from DECISION_PROVIDER_<NAME>_* at runtime. Required when enabled (OBJECT_MODERATION_PROVIDER_NOT_FOUND, the objectModeration code). |
| `model` | `String` | no |  |  |  | Optional PINNED model version for this surface's decisions, overriding the provider entry's configured model. A floating tag is refused with DECISION_MODEL_NOT_PINNED. Leave null to use the entry's model. |
| `policy` | `Text` | yes |  |  |  | The moderation guideline in plain language - the instructions of the `verdict` question, judged against the content (a hub message's type and content; a notification's rendered subject and body). Required when enabled (OBJECT_MODERATION_POLICY_MISSING). |
| `confidenceThreshold` | `Double` | no | `0.8` |  |  | Confidence at or above which an `accept` or `reject` verdict is acted on directly; below it the content goes to `review` for a human. Must lie in (0, 1] (OBJECT_MODERATION_THRESHOLD_RANGE). Default 0.8, applied when omitted. |
| `messageTypes` | `String`[] | no |  |  |  | RealtimeHub only: the message types that are judged. Null or empty = every message type of the hub that no HubLogic handler processes. Each entry must be a message type of the hub (CONTENT_MODERATION_MESSAGE_TYPE_NOT_FOUND), and a type a HubLogic handler processes is refused (CONTENT_MODERATION_HANDLED_MESSAGE_TYPE). Ignored with a warning on a notification. |
| `exemptRoles` | `String`[] | no | `[]` |  |  | RealtimeHub only: roles whose messages bypass moderation and are delivered directly. Default [] (nobody is exempt). Each entry must be a declared role (OBJECT_MODERATION_UNKNOWN_ROLE). A notification has no sender session, so the list is ignored there with a warning. |
| `reviewerRoles` | `String`[] | no |  |  |  | Roles that see the review queue and accept or reject held content. Null or empty = the platform operator (admin). A reviewer can never decide a hub message they sent (MODERATION_SELF_DECISION, 403). Each entry must be a declared role (OBJECT_MODERATION_UNKNOWN_ROLE). |
| `wantReason` | `Boolean` | yes |  |  |  | When true, a `reject` or `review` verdict is escalated to the `escalateTo` agent for a written analysis, after the sender is answered and bounded in time; stored on the review row for reviewers only. Requires `escalateTo` (OBJECT_MODERATION_REASON_WITHOUT_ESCALATION). |
| `escalateTo` | `String` | no |  |  |  | Name of the AI agent that writes the reason for a `reject` or `review` verdict: an AI agent of the service or one the agent hub serves (OBJECT_MODERATION_ESCALATION_TARGET_NOT_FOUND). It receives { snapshot, verdict, policy }. |
| `userMessageMode` | `ObjectModerationUserMessageMode` | no | `"generic"` | `generic`, `llm` |  | What the sender of a held or rejected hub message is told (ObjectModerationUserMessageMode): `generic` (the default) shows `genericMessage`; `llm` shows the agent's `userMessage` on the review row and requires `wantReason` (OBJECT_MODERATION_LLM_MESSAGE_WITHOUT_REASON). |
| `genericMessage` | `Text` | no | `"Your submission is being reviewed."` |  |  | The message the sender of a held or rejected hub message sees when no agent-written message applies. |
| `onProviderError` | `ObjectModerationProviderErrorPolicy` | no | `"failToReview"` | `failToReview`, `failToReject` |  | What happens when the decision provider fails instead of answering (ObjectModerationProviderErrorPolicy): `failToReview` (the default) holds the content for a human, `failToReject` rejects it. Either way the content is never delivered on a failure and the review row names it. |
| `timeoutMs` | `Integer` | no | `5000` |  |  | Timeout of one provider decision in milliseconds, enforced by the framework; a timeout is a transport failure and follows `onProviderError`. An isolated call measured 250-400 ms, and on a hub that time is added to every moderated message. Default 5000. |

## Constraints

Property rules:

- `enabled`, `providerName`, `policy`, `wantReason` must be present. Enforced only while `enabled` is on. (`REQUIRED_FIELD_MISSING`)
- `userMessageMode`, `onProviderError` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CONTENT_MODERATION_HANDLED_MESSAGE_TYPE` | error | … moderates message type "…", which a HubLogic messageHandler processes: its script decides what is broadcast (and may rewrite it), so the send door never judges it. |
| `CONTENT_MODERATION_MESSAGE_TYPE_NOT_FOUND` | error | … moderates message type "…", which the hub does not accept: nothing of that type can be sent, so the type you meant goes unjudged. |
| `OBJECT_MODERATION_LANGUAGE_UNSUPPORTED` | error | … cannot be enabled: service "…" generates for …, and the moderation engine is implemented by … so far. |
