# PropertyDecisionSource

**Level:** `section` · **Family:** [DataProperty](../ontology/families.md#dataproperty) (domain `DataObject`)

**Ontology:** [PropertyDecisionSource in Part 1](../ontology/PropertyDecisionSource.md)

Write-time classification of one DataProperty by a decision provider. The decision is taken once, when the row is written, and stored as a derived column plus three companion columns (`<prop>DecisionConfidence`, `<prop>DecidedBy`, `<prop>DecidedAt`), so reads never consult the model. A stored judgement without its model version cannot be audited or re-derived when the criterion changes, which is why the companions are not optional. Lifecycle: a create decides (unless the caller supplied the value, which pins it as a manual override); an update re-decides only when it writes a `recomputeOn` property (or releases the override by writing `<prop>DecisionOverridden: false`); an update that writes the property itself pins it (`<prop>DecisionOverridden: true`, `<prop>DecidedBy: manual`) and later recompute triggers leave it alone. An answer whose confidence is below `confidenceThreshold` (and a noul whose probability sits inside the provider's drift band of 0.5) is NOT stored as a value: the column stays null while the confidence, model and time are recorded, so a boundary case is never silently classified (ADR rule 8). A provider failure never fails the write: the column and its companions are left unset and the backfill retries the row. The backfill is an in-process sweep of the service (the invoice-status poll precedent) that asks about a token-sized batch of rows (at most `backfillBatchSize`) in ONE request, addressing each row by its id, paced at `backfillRequestsPerMinute`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry that decides this property. Credentials are read from DECISION_PROVIDER_<NAME>_* at runtime. A dangling name fails validation (DECISION_PROVIDER_NOT_FOUND). |
| `model` | `String` | no |  |  |  | The PINNED model version this property's decisions must come from, overriding the provider entry's own pin. A floating tag (`jev-latest`, a bare family name) is refused with DECISION_MODEL_NOT_PINNED. Leave null to inherit the provider entry's pin; one of the two must pin. `<prop>DecidedBy` records the version that actually answered, and the backfill's `stale` mode re-decides rows decided by any other version. The override is applied to create/update decisions and both unset and stale backfill. Questions with different model pins do not share a request. |
| `state` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | ONE MScript expression producing the state the question is asked about, evaluated against the ROW: `this.<column>` reads the written row's column values (on an update, the full row after the update). The same expression feeds the backfill, so it must not read request or session context. Example: `{ "js": "({ title: this.title, description: this.description })" }`. Keep it to the columns the judgement needs: they are also the default `recomputeOn` set. |
| `question` | [`DecisionQuestion`](./DecisionQuestion.md) | yes |  |  |  | The ONE typed question whose answer becomes this property's value (a DecisionQuestion; `defaultAnswer` is not used here). noul -> a Boolean column (the probability thresholded at 0.5), choice -> an Enum column whose options include every criteria key (or a String column), score -> a Double / Float / Integer column holding the level position (rounded for Integer). A choice needs an escape option (DECISION_CHOICE_NO_ESCAPE_OPTION); it is also the value a row that fits nothing ends up with, instead of a forced wrong option. |
| `confidenceThreshold` | `Double` | no |  |  |  | Confidence at or above which an answer is stored as the value. Below it the value column stays null and only the companions (confidence, model, time) are written, so a borderline row is visible as undecided rather than silently classified. Must sit outside the provider's `capabilities.probabilityDriftBand` of the 0.5 boundary (DECISION_THRESHOLD_IN_DRIFT_BAND). Null = store every answer, except that a noul whose probability lies inside the drift band of 0.5 is always withheld (ADR rule 8). |
| `recomputeOn` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) | The properties whose write re-triggers the decision on an update. Presence in the update patch is the trigger (the after-update seam's rule); an update that writes none of them never calls the provider. Null = the row columns the `state` expression reads (`this.<column>`). An overridden value is never recomputed until the override is released. |
| `timeoutMs` | `Integer` | no |  |  |  | Per-request timeout for the write-time decision. A timeout counts as a provider failure: the write still succeeds and the row is left for the backfill. Null uses the decisionSource default of 5000 ms. An isolated call measured 250-400 ms, so a value under ~1000 ms will cut healthy calls. |
| `backfillBatchSize` | `Integer` | no | `256` |  | min 1, max 1000 | The most rows asked about in ONE backfill request. Each row becomes one subject of the request's state, addressed by its id, with one question per row naming that id. Measured with explicit item ids: per-item accuracy 1.00 at every size from 1 to 1,150 subjects at ~54 tokens per subject, and a 1,250-subject request was refused whole at the 64k context (`400 max_tokens_exceeded`) - the limit is TOKENS, not accuracy. So this is a cap: the engine sizes every request from its own subjects, filling at most half of the provider's `contextTokenCeiling` by a pessimistic token estimate, so long subjects get smaller batches automatically. A one-row request pays a fixed ~260-token overhead, which is why batching matters. Default 256; at most 1000. |
| `backfillRequestsPerMinute` | `Integer` | no | `30` |  | min 1 | Pacing of the backfill: at most this many provider requests per minute, one at a time. Set it from MEASURED throughput for your account, not from a published ceiling - the vendor's published request rate was not enforced in measurement, so it is neither a limit you will hit nor a guarantee. A rate-limit or overload answer (429 / 529) ends the pass early; the next pass resumes from the data, because a decided row no longer matches the backfill's predicate. |
| `backfillIntervalSeconds` | `Integer` | no | `300` |  | min 0 | How often the in-process backfill sweep runs, in seconds. Each pass walks the rows whose `<prop>DecidedAt` is null (never decided, or a write whose decision failed) in keyset order. 0 disables the periodic sweep; the generated `runDecisionSourceBackfill()` can still be called directly (e.g. from a cron Business API) and also offers the `stale` mode. |

## Constraints

Property rules:

- `providerName`, `state`, `question` must be present. (`REQUIRED_FIELD_MISSING`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `backfillBatchSize` must be between 1 and 1000. (`VALUE_OUT_OF_RANGE`)
- `backfillRequestsPerMinute` must be at least 1. (`VALUE_OUT_OF_RANGE`)
- `backfillIntervalSeconds` must be at least 0. (`VALUE_OUT_OF_RANGE`)
- `recomputeOn` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DECISION_CHOICE_CRITERIA_MISSING` | error | A choice question needs at least two options plus an escape option. |
| `DECISION_CHOICE_NO_ESCAPE_OPTION` | error | A choice question needs an ESCAPE option (e.g. |
| `DECISION_CHOICE_OVER_CEILING` | error | A choice question declares … options, over the … that provider "…" advertises. |
| `DECISION_MODEL_NOT_PINNED` | error | decisionSource model "…" on … is not pinned. |
| `DECISION_ON_AUTHZ_SURFACE` | error | decisionSource on …: the property is read by an authorization predicate (…). |
| `DECISION_PROVIDER_NOT_FOUND` | error | Unknown decision provider "…" on …. |
| `DECISION_QUESTION_INSTRUCTIONS_MISSING` | error | A decision question needs instructions: the statement the provider judges about the state. |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | error | Decision provider "…" (…) does not advertise support for "…" questions. |
| `DECISION_SCORE_LEVELS_OUT_OF_RANGE` | error | A score question needs 2 to 10 ordered levels, lowest first; … declared. |
| `DECISION_SOURCE_COMPANION_COLUMN_TAKEN` | error | … already declares a property named "…", the companion column decisionSource on … writes. |
| `DECISION_SOURCE_ENUM_OPTIONS_MISMATCH` | error | decisionSource on …: the choice options … are not enumOptions of the Enum column, so a decision for them could not be stored. |
| `DECISION_SOURCE_LANGUAGE_UNSUPPORTED` | error | decisionSource on … cannot be generated for …: the decision engine and its write seams are implemented by … so far, so a … service would carry the companion columns and never write them. |
| `DECISION_SOURCE_MISSING_PROVIDER` | error | decisionSource on … has no providerName. |
| `DECISION_SOURCE_NEVER_RECOMPUTED` | warning | decisionSource on … has no recomputeOn and its state reads no column of … as this.<column>, so no update ever re-decides it: only creates and the backfill do. |
| `DECISION_SOURCE_ON_SYSTEM_OBJECT` | error | decisionSource cannot be declared on the framework object …. |
| `DECISION_SOURCE_PROPERTY_CONFLICT` | error | decisionSource on … conflicts with: …. |
| `DECISION_SOURCE_QUESTION_FIELD_IGNORED` | warning | question.… … not used by a decisionSource: the property itself is the binding, and a decision that fails or is not confident leaves the column unset instead of taking a default. |
| `DECISION_SOURCE_QUESTION_MISSING` | error | decisionSource on … asks no question. |
| `DECISION_SOURCE_RECOMPUTE_SELF` | error | recomputeOn names "…", which is …: writing it is a manual override (or the engine's own write-back), never a recompute trigger. |
| `DECISION_SOURCE_RECOMPUTE_UNKNOWN_PROPERTY` | error | recomputeOn names "…", which is not a property of …: no update patch could ever touch it, so the decision would never be recomputed. |
| `DECISION_SOURCE_TYPE_MISMATCH` | error | decisionSource on …: a … answer cannot be stored in a … column (it needs …). |
| `DECISION_STATE_MISSING` | error | decisionSource on … has no state expression: the question needs something to be asked about. |
| `DECISION_THRESHOLD_IN_DRIFT_BAND` | error | confidenceThreshold … sits within the … probability drift band of the 0.5 decision boundary for provider "…". |
| `DECISION_THRESHOLD_OUT_OF_RANGE` | error | confidenceThreshold must be between 0 and 1; … declared. |
