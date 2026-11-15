# DecisionPageJudgement

**Level:** `subsection` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [DecisionPageJudgement in Part 1](../ontology/DecisionPageJudgement.md)

Reranks or filters one bounded page of a read surface with a decision provider, in one provider request per page. Each item reaches the provider only as its declared state projection (`stateFields`), addressed by its stable id (`idField`), and the judged page is always a subset (filter) or a reordering (rerank) of the page the surface would have answered unjudged: a judgement can never add an item. A `filter` asks one noul per item and keeps the items whose probability reaches `confidenceThreshold`; a `rerank` asks one score per item against the ordered `criteria` and sorts by it, ties keeping the original order. The failure rule: a filter fails closed (the request fails, or answers the empty page under `matchNothing`) and never answers the unfiltered page; a rerank may keep the original order (`keepOrder`, its default). A page is never split into several requests, never retried and never truncated: a page over `pageCap` (framework hard maximum 256 items) or over the provider's token budget is not judged and takes the failure rule. The response carries a `judgement` attribution (mode, provider, model, judged, degraded) so a degraded page is never served as judged. Never an authorization surface (DECISION_ON_AUTHZ_SURFACE). Bound today to an `EventStreamReadSurface` of type `latestN`, implemented for nodejs, rust, java and dotnet.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mode` | `DecisionPageMode` | yes |  | `rerank`, `filter` |  | Required. `filter` narrows the page to the items the statement in `instructions` holds for (one noul per item); `rerank` orders the page by a score against the ordered `criteria` (one score per item). The two modes never mix on one block. |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry that judges the page. A dangling name fails validation (DECISION_PROVIDER_NOT_FOUND). The provider must advertise noul questions for a filter and score questions for a rerank (DECISION_QUESTION_TYPE_UNSUPPORTED). |
| `model` | `String` | no |  |  |  | The PINNED model version, overriding the provider entry's own; a floating tag is refused (DECISION_MODEL_NOT_PINNED). Null = inherit the provider entry's pin, which must then exist. |
| `instructions` | `Text` | yes |  |  |  | What is judged about ONE item, in plain language. For a filter it is the statement that holds for an item that STAYS on the page; for a rerank it is what the score measures. The framework addresses each item by its id around this text, so never refer to an item by its position. |
| `criteria` | [`DataMapSimpleItem`](./DataMapSimpleItem.md)[] | no |  |  |  | [rerank] The ordered score levels, lowest first: each entry's `name` is a level and its `value` describes it, and entry ORDER is the scale. 2 to 10 levels (DECISION_PAGE_CRITERIA_INVALID). Not allowed on a filter (DECISION_PAGE_FIELD_NOT_FOR_MODE). |
| `stateFields` | `String`[] | no |  |  |  | Required, non-empty. The explicit per-item state projection: the eventSchema fields of an item that reach the provider, and nothing else. The name `id` is reserved for the item address (DECISION_PAGE_STATE_FIELD_RESERVED). A filter may not project an identity stamp field (the ingestion `actorField`, `sessionField` or `tenantField`): it would decide visibility by who wrote the row (DECISION_ON_AUTHZ_SURFACE). |
| `idField` | `String` | yes |  |  |  | Required. The eventSchema field whose value is the stable id of an item: it addresses the item in the request and in the answers. Pick a field that is unique per row (the clustering key or the ingestion idempotency key); any other field is warned about (DECISION_PAGE_ID_FIELD_NOT_UNIQUE), and a page with two items of one id is not judged. |
| `confidenceThreshold` | `Double` | no |  |  |  | [filter] Probability at or above which an item stays. Default 0.8. Must sit outside the provider's `probabilityDriftBand` of 0.5 (DECISION_THRESHOLD_IN_DRIFT_BAND); an item within half the band of the threshold is dropped as near-threshold. Not allowed on a rerank (DECISION_PAGE_FIELD_NOT_FOR_MODE). |
| `pageCap` | `Integer` | no |  |  |  | Most items one judged page carries. Default = the surface's `defaultLimit`; framework hard maximum 256 (DECISION_PAGE_CAP_EXCEEDS_HARD_MAX), and never above the surface's `maxLimit`. The surface clamps the request limit to the cap, and the cap times the static size of one item must fit one request of the provider's context (DECISION_PAGE_CAP_OVER_TOKEN_BUDGET). |
| `onProviderError` | `DecisionPageFailureMode` | no |  | `failClosed`, `matchNothing`, `keepOrder` |  | What happens when the page cannot be judged (a provider failure, a malformed answer, a page over the cap or the token budget). filter: `failClosed` (the default: the request fails with 503) or `matchNothing` (an empty page marked degraded); a filter never fails open (DECISION_NARROWING_FILTER_FAILS_OPEN). rerank: `keepOrder` (the default: the original order, marked not judged) or `failClosed`. |

## Constraints

Property rules:

- `mode`, `providerName`, `instructions`, `idField` must be present. (`REQUIRED_FIELD_MISSING`)
- `mode`, `onProviderError` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `criteria` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DECISION_MODEL_NOT_PINNED` | error | Decision model "…" is not pinned. |
| `DECISION_NARROWING_FILTER_FAILS_OPEN` | error | A judged filter NARROWS a page, so "…" on a page that cannot be judged would answer the unfiltered page: a data leak wearing the costume of a degraded mode. |
| `DECISION_PAGE_CAP_EXCEEDS_HARD_MAX` | error | pageCap … is over the framework hard maximum of … items per judged page. |
| `DECISION_PAGE_CAP_INVALID` | error | pageCap must be a positive integer; … declared. |
| `DECISION_PAGE_CRITERIA_INVALID` | error | A rerank needs … to … ordered score levels in criteria, lowest first, each with its own non-blank name; … usable of … declared. |
| `DECISION_PAGE_FAILURE_MODE_INVALID` | error | onProviderError "…" is not a failure mode of a …; use … (default …). |
| `DECISION_PAGE_FIELD_NOT_FOR_MODE` | error | criteria are the ordered score levels of a rerank; a filter judges one noul statement per item (instructions) and keeps the items it holds for. |
| `DECISION_PAGE_MISSING_PROVIDER` | error | A judged page has no providerName. |
| `DECISION_PAGE_STATE_FIELD_RESERVED` | error | "…" is reserved for the item address the framework writes into every projected item; a projected field of that name would collide with it. |
| `DECISION_PAGE_STATE_PROJECTION_EMPTY` | error | A judged page needs an explicit state projection: name in stateFields the fields of an item that reach the provider. |
| `DECISION_PROVIDER_NOT_FOUND` | error | Unknown decision provider "…". |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | error | Decision provider "…" (…) does not advertise … questions, and a … asks one … per item. |
| `DECISION_THRESHOLD_IN_DRIFT_BAND` | error | confidenceThreshold … sits within the … probability drift band of the 0.5 decision boundary for provider "…". |
| `DECISION_THRESHOLD_OUT_OF_RANGE` | error | confidenceThreshold must be between 0 and 1; … declared. |
