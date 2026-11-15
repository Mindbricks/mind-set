# ObjectModeration

**Level:** `section` · **Family:** [ContentModel](../ontology/families.md#contentmodel) (domain `Service`)

**Ontology:** [ObjectModeration in Part 1](../ontology/ObjectModeration.md)

**Activation:** the pattern is switched on by `enabled`.

Decision-moderated writes on a data object. When `enabled`, the create and update Business APIs of this object ask the decision provider named by `providerName` ONE framework-owned `choice` question, `verdict`, over { accept, reject, review }, with `policy` as its instructions and the written values (restricted to `moderatedProperties`) as its state. `review` is the escape option - a human should decide - and it is always offered, because a forced choice with no way out answers wrong with high confidence; a verdict whose confidence is below `confidenceThreshold` is routed to `review` too. The decision is synchronous, inside the request: an isolated provider call measured 250-400 ms. On `accept` the write continues in the same request with every hook, event and response of a direct write. In `staged` mode a `reject` or `review` answers 202 with { moderation: { id, status, message } } and NOTHING is written to the object; in `onPlace` mode the write lands whatever the verdict and the answer carries `moderation` beside the record. Over gRPC the response message of a moderated create / update declares the same outcome as a `moderation` field (tag 1000): a hold answers OK with only that field set and the `x-moderation-status` / `x-moderation-id` metadata. Every submission is a row of the framework-generated `sys_<X>ModerationReview` object, which STORES the decision (value, confidence, probabilities, pinned model, decidedBy: provider | mock | human); it is never re-derived later, because the decision is reproducible across identical requests and the probability is not. One submission is pending per target row: a newer update supersedes the older one visibly, it is not deleted. `reviewerRoles` accept or reject held rows through injected Business APIs, never their own; an accept replays the author's original write through the api's own path, so its events and post-write workflow fire as on a direct write. WHO IS MODERATED: every caller except trusted system transports (cron, internal calls) and `exemptRoles`. This is CONTENT moderation, not authorization - `absoluteRoles` do NOT bypass it, and the verdict never feeds a permission check. An update that touches none of the `moderatedProperties` writes straight through, so a counter bumped by a sale never queues. Refused on auth-service objects and framework `sys_` objects. Both modes, the onPlace read gate and what it does not cover, the reviewer apis, the review row and every validation code are in the docs-site guide [Object content moderation](../guides/capabilities/object-moderation.md). Data-object moderation is implemented for nodejs and java, and for dotnet in mode staged (onPlace is refused on dotnet, and a dotnet gRPC answer does not carry the `moderation` field yet). ContentModel staged editorial moderation has a separate qualified nodejs/java/dotnet/rust support gate; onPlace remains refused.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | yes |  |  |  | Turns moderation on for this object. False (the default) leaves the block inert: no review object, no injected api, no interception, and the object is generated exactly as without the block. The other fields are only checked while this is true. |
| `mode` | `ObjectModerationMode` | no | `"staged"` | `staged`, `onPlace` |  | Where a moderated write lands while it waits (ObjectModerationMode). `staged` (the default) holds it on the review row until accept, so the real object never shows unapproved data. `onPlace` writes the real row at once behind a framework-managed `moderationStatus` visibility gate, for parents whose children need the real row id mid-flow. |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry that judges this object's writes. Its credentials come from DECISION_PROVIDER_<NAME>_* at runtime. Required when enabled; a name that matches no entry fails validation (OBJECT_MODERATION_PROVIDER_NOT_FOUND). |
| `model` | `String` | no |  |  |  | Optional PINNED model version for this object's decisions, overriding the provider entry's configured model. A floating tag (`jev-latest`, a bare family name) is refused with DECISION_MODEL_NOT_PINNED: an unpinned model can answer the same submission differently on two days, and the review row records the model a decision came from. Leave null to use the entry's model. |
| `policy` | `Text` | yes |  |  |  | The moderation guideline in plain language - the instructions of the `verdict` question, judged against the submitted values. Write the rule, not a prompt: there is no system message and no few-shot slot (e.g. "Listings must describe a real item for sale; no contact details, no offensive language, no prohibited goods."). Required when enabled (OBJECT_MODERATION_POLICY_MISSING). |
| `confidenceThreshold` | `Double` | no | `0.8` |  |  | Confidence at or above which an `accept` or `reject` verdict is acted on directly; below it the submission goes to `review` for a human. Must lie in (0, 1] (OBJECT_MODERATION_THRESHOLD_RANGE). Default 0.8. |
| `moderatedProperties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | The properties whose values are judged, and whose change triggers moderation. Only these fields make up the decision state, and an update that touches none of them writes straight through - so a system- or action-driven field (a `soldCount` incremented by a sale) never sends approved content back to the queue. Null or empty = every user-writable property of the object. Each entry must be a property of this object (OBJECT_MODERATION_PROPERTY_NOT_FOUND). |
| `exemptRoles` | `String`[] | no | `[]` |  |  | Roles whose writes bypass moderation and land directly. Default [] (nobody is exempt). Moderation is content policy, not authorization, so `absoluteRoles` are NOT implicitly exempt: list a role here to exempt it. Each entry must be a declared role (OBJECT_MODERATION_UNKNOWN_ROLE). |
| `reviewerRoles` | `String`[] | no |  |  |  | Roles that see the review queue and accept or reject held submissions. Null or empty = the platform operator (admin and superAdmin; saasAdmin and superAdmin in a multi-tenant project). A reviewer can never decide a submission they authored (MODERATION_SELF_DECISION, 403). Each entry must be a declared role (OBJECT_MODERATION_UNKNOWN_ROLE). |
| `wantReason` | `Boolean` | yes |  |  |  | When true, a `reject` or `review` verdict is escalated to the `escalateTo` agent for a written analysis, after the response and bounded in time. The analysis is stored on the review row and is visible to reviewer roles only. Requires `escalateTo` (OBJECT_MODERATION_REASON_WITHOUT_ESCALATION). |
| `escalateTo` | `String` | no |  |  |  | Name of the AI agent that writes the reason for a `reject` or `review` verdict: an entry of this service's `aiAgents[]` or an agent the agent hub serves. It receives { snapshot, verdict, policy } and returns either the analysis text or { analysis, userMessage }. Required when `wantReason` is true; a name that resolves to no agent fails validation (OBJECT_MODERATION_ESCALATION_TARGET_NOT_FOUND). |
| `userMessageMode` | `ObjectModerationUserMessageMode` | no | `"generic"` | `generic`, `llm` |  | What the author of a held or rejected submission is told (ObjectModerationUserMessageMode): `generic` (the default) shows `genericMessage`; `llm` shows the agent's `userMessage`, and requires `wantReason` (OBJECT_MODERATION_LLM_MESSAGE_WITHOUT_REASON). |
| `genericMessage` | `Text` | no | `"Your submission is being reviewed."` |  |  | The message the author sees for a held or rejected submission when no agent-written message applies. |
| `onProviderError` | `ObjectModerationProviderErrorPolicy` | no | `"failToReview"` | `failToReview`, `failToReject` |  | What happens when the decision provider fails instead of answering (ObjectModerationProviderErrorPolicy): `failToReview` (the default) holds the submission for a human, `failToReject` rejects it. Either way the review row names the transport failure, and a failure never publishes the write. |
| `timeoutMs` | `Integer` | no | `5000` |  |  | Timeout of one provider decision in milliseconds, enforced by the framework (the provider adapters carry none); a timeout is a transport failure and follows `onProviderError`. An isolated call measured 250-400 ms, so a value under ~1000 cuts healthy calls. Default 5000. |

## Constraints

Property rules:

- `enabled`, `providerName`, `policy`, `wantReason` must be present. Enforced only while `enabled` is on. (`REQUIRED_FIELD_MISSING`)
- `mode`, `userMessageMode`, `onProviderError` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `moderatedProperties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DECISION_MODEL_NOT_PINNED` | error | … pins no model version: "…" is a floating tag. |
| `OBJECT_MODERATION_CONTENT_ON_PLACE` | error | … sets mode onPlace, which a content model does not support. |
| `OBJECT_MODERATION_ESCALATION_TARGET_NOT_FOUND` | error | … escalates to "…", which is not an AI agent of this service or of the agent hub. |
| `OBJECT_MODERATION_LANGUAGE_UNSUPPORTED` | error | … cannot be enabled: service "…" generates for …, and the content editorial moderation write seam is implemented by … so far. |
| `OBJECT_MODERATION_LLM_MESSAGE_WITHOUT_REASON` | error | … sets userMessageMode 'llm' without wantReason, so no agent ever runs to write that message. |
| `OBJECT_MODERATION_MANAGED_COLUMN_WRITTEN` | error | … binds a request parameter named "…" on the onPlace-moderated "…": that column is framework-managed and never caller-writable. |
| `OBJECT_MODERATION_NO_WRITE_API` | warning | … is inert: the model has no content to judge (no declared field, no body…), so no write is ever moderated. |
| `OBJECT_MODERATION_ON_SYSTEM_OBJECT` | error | objectModeration cannot be enabled on "…": … are written by the framework itself, and staging those writes would hold back the framework's own bookkeeping. |
| `OBJECT_MODERATION_POLICY_MISSING` | error | … has no policy. |
| `OBJECT_MODERATION_PROPERTY_NOT_FOUND` | error | … moderates "…", which is not content of the model: name a field of the model, body or seo, or a field of its child items. |
| `OBJECT_MODERATION_PROVIDER_NOT_FOUND` | error |  |
| `OBJECT_MODERATION_REASON_WITHOUT_ESCALATION` | error | … sets wantReason but no escalateTo. |
| `OBJECT_MODERATION_RESERVED_PROPERTY` | error | … cannot be enabled while the model declares a field named "…": a moderated create / update answers with a "…" member (the review row's id and status), which would overwrite that field in every write response. |
| `OBJECT_MODERATION_STATUS_COLUMN_TAKEN` | error | "…" declares a property named "…", but in onPlace mode the framework injects and manages that column itself (the moderation state of the row). |
| `OBJECT_MODERATION_THRESHOLD_IN_DRIFT_BAND` | warning | … has confidenceThreshold …, within the … probability drift band of the 0.5 boundary for decision provider "…". |
| `OBJECT_MODERATION_THRESHOLD_RANGE` | error | … has confidenceThreshold …; it must lie in (0, 1]. |
| `OBJECT_MODERATION_UNCERTAIN_GLOBAL_AGGREGATION` | warning | "…" is moderated onPlace and a previously static global aggregation at … may survive an opaque spread or computed key. |
| `OBJECT_MODERATION_UNGATEABLE_GLOBAL_AGGREGATION` | error | "…" is moderated onPlace but a fetchFromElasticAction body at … contains a global aggregation. |
| `OBJECT_MODERATION_UNGATEABLE_PROJECTION` | error | "…" is moderated onPlace but declares … at …. |
| `OBJECT_MODERATION_UNGATEABLE_VIEW_STAT` | error | "…" is moderated onPlace, and DataView "…" aggregates a stat ("…") over it. |
| `OBJECT_MODERATION_UNGATED_READ_PATH` | warning | "…" is moderated onPlace, so its unapproved rows are hidden by a read gate on every generated read the framework controls (its own apis, select joins, /geo routes, joint / membership filters, designer read actions, … |
| `OBJECT_MODERATION_UNKNOWN_ROLE` | error | … lists role "…" in …, which is not a declared role. |
| `OBJECT_MODERATION_UNSTAGED_WRITE_PATH` | warning | … moderates "…", but … designer action(s) write it through dbLayer and bypass the moderation seam: …. |
