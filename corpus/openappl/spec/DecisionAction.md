# DecisionAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [DecisionAction in Part 1](../ontology/DecisionAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Asks a calibrated decision provider typed questions about a piece of state and writes the typed answers into the workflow context. They land under `this.decisions.<actionName>.<questionName>` as { value, confidence, probabilities, model }. Sits between ValidationAction (an MScript boolean) and AiCallAction (a full LLM call): it answers the judgements MScript cannot express without paying for text generation, at ~250-400 ms and free output tokens. It NEVER makes an authorization decision - a calibrated probability has no rationale and cannot be audited or explained, so DECISION_ON_AUTHZ_SURFACE refuses a decision standing in for permissionCheck, membershipCheck, objectPermissionCheck or an absoluteRoles bypass. See docs/ADR-decision-layer-system-one.md.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry this action asks. Credentials are read from DECISION_PROVIDER_<NAME>_* at runtime. A dangling name fails validation. |
| `model` | `String` | no |  |  |  | The PINNED provider model version for this action, overriding the provider entry's own. A floating tag (`jev-latest`, a bare family name) is refused with DECISION_MODEL_NOT_PINNED: an unpinned model answers differently on two consecutive days, reddens tests with no attributable cause, and poisons every cache whose key includes the version. Leave null to inherit the provider entry's pin. Nodejs forwards this model on cached and uncached provider requests. Cache identity includes the selected model. The deterministic mock retains its own model identity. |
| `state` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | ONE MScript expression producing the state the questions are asked about - an object, an array, or text. An ARRAY carries several independent subjects in one request: measured, per-item accuracy held at 1.00 from 1 to 256 subjects with explicit item ids, at ~54 tokens and ~1.9 ms per subject. Address array members by an explicit `id` field named in each question's instructions; ordinal phrasing ('the first item') does not scale. |
| `questions` | [`DecisionQuestion`](./DecisionQuestion.md)[] | no |  |  |  | The question bundle asked about this one state. EVERY question in a request is evaluated in PARALLEL against the same state, so a dozen questions cost barely more than one - which is why the unit of this pattern is a state plus a bundle and not a single question. Modelling one action per decision, the way AiCallAction is modelled, would send the same subject once per question and throw away the cheapest property of the model. |
| `checkType` | `ApiCheckType` | no | `"storedCheck"` | `storedCheck`, `liveCheck` |  | How a failing decision is handled, in ValidationAction's vocabulary. `liveCheck` throws immediately; `storedCheck` writes the answers to the context and continues, for deferred or compound logic. Default storedCheck: a decision is usually an input to later logic, not a gate. |
| `confidenceThreshold` | `Double` | no |  |  |  | Confidence at or above which an answer is acted on directly; below it `onLowConfidence` decides. Must sit outside the provider's `capabilities.probabilityDriftBand` of a decision boundary (DECISION_THRESHOLD_IN_DRIFT_BAND): the probability is not reproducible across identical requests, so a threshold inside the band makes the same request answer differently on different days. Null = act on every answer regardless of confidence. |
| `onLowConfidence` | `DecisionLowConfidenceAction` | no | `"passThrough"` | `escalate`, `reject`, `passThrough`, `defaultAnswer` |  | What happens below `confidenceThreshold`. Default escalate when `escalateTo` is set, else passThrough. An undecided answer always takes this policy; a low-confidence answer takes it only when confidenceThreshold is set. |
| `escalateTo` | `String` | no |  |  |  | Name of an `aiCallActions[]` or `agentCallActions[]` entry of the same Business API that answers the cases this action was not confident about. This field is what makes the pattern a decision LAYER: the cheap calibrated model takes the confident majority and an LLM takes the ambiguous minority, with the run recording which path answered. A dangling name, or one that lives in another API of the service, fails validation: the escalation calls this API's own action method. |
| `onProviderError` | `DecisionErrorAction` | no | `"failClosed"` | `failOpen`, `failClosed`, `defaultAnswer` |  | What happens when the provider fails rather than answers. Default failClosed. See DecisionErrorAction - a narrowing filter that fails open is a data leak, not a fallback. |
| `timeoutMs` | `Integer` | no |  |  |  | Positive per-request deadline in milliseconds for the decision adapter, including retries and response-body reads. The adapter aborts HTTP on timeout and routes DecisionTransportError through onProviderError. Null means no adapter deadline. This does not bound state MScript evaluation or Redis access. |
| `cache` | [`DecisionCacheSettings`](./DecisionCacheSettings.md) | no |  |  |  | Decision caching (DecisionCacheSettings): one cache entry per QUESTION, keyed on (provider, pinned model version, question type, instructions, criteria, state, keyExtra); a fully cached bundle makes no provider request and a partly cached one asks only the missing questions, still in one request. The entry stores the DECISION and is the authority: a concurrent first answer wins and is served until the key changes or the TTL runs out. Null or enabled=false = no caching, every execution asks the provider. |

## Constraints

Property rules:

- `providerName`, `state` must be present. (`REQUIRED_FIELD_MISSING`)
- `checkType`, `onLowConfidence`, `onProviderError` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `questions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DECISION_ACTION_LANGUAGE_UNSUPPORTED` | error | DecisionAction… cannot be generated for …: the decision layer is implemented by … so far, so a … service would drop the action silently and run its workflow without the decision. |
| `DECISION_ACTION_MISSING_PROVIDER` | error | DecisionAction has no providerName. |
| `DECISION_CACHE_TTL_INVALID` | error | cache.ttlSeconds must be positive or absent; … declared. |
| `DECISION_CHOICE_CRITERIA_MISSING` | error | A choice question needs at least two options plus an escape option. |
| `DECISION_CHOICE_NO_ESCAPE_OPTION` | error | A choice question needs an ESCAPE option (e.g. |
| `DECISION_CHOICE_OVER_CEILING` | error | A choice question declares … options, over the … that provider "…" advertises. |
| `DECISION_DEFAULT_ANSWER_MISSING` | error | defaultAnswer is selected for onLowConfidence or onProviderError, so every question needs its own defaultAnswer. |
| `DECISION_DEFAULT_ANSWER_NOT_AN_OPTION` | error | defaultAnswer "…" is not one of this question's option keys (…). |
| `DECISION_ESCALATE_TARGET_MISSING` | error | onLowConfidence is "escalate" but escalateTo names no action. |
| `DECISION_ESCALATE_TARGET_NOT_FOUND` | error | escalateTo "…" names no aiCallAction or agentCallAction of this Business API. |
| `DECISION_ESCALATE_TARGET_OTHER_API` | error | escalateTo "…" is an action of Business API …, not of the API that owns this decision. |
| `DECISION_ESCALATE_TARGET_UNREACHABLE` | warning | escalateTo is set but onLowConfidence is "…", so it never runs. |
| `DECISION_LOW_CONFIDENCE_WITHOUT_THRESHOLD` | warning | onLowConfidence is "…" but no confidenceThreshold is set, so only an UNDECIDED answer (no model judged the question, e.g. |
| `DECISION_MODEL_NOT_PINNED` | error | Decision model "…" is not pinned. |
| `DECISION_NARROWING_FILTER_FAILS_OPEN` | error | A liveCheck decision gates the operation, so onProviderError "failOpen" lets every request through whenever the provider is unavailable — a gate that fails open is not a gate. |
| `DECISION_NO_QUESTIONS` | error | DecisionAction asks no questions. |
| `DECISION_NOUL_CRITERIA_IGNORED` | warning | A noul question answers the probability that its instructions hold, so criteria are ignored. |
| `DECISION_ON_AUTHZ_SURFACE` | error | …[…] reads this decision's answers. |
| `DECISION_PROVIDER_NOT_FOUND` | error | Unknown decision provider "…". |
| `DECISION_QUESTION_INSTRUCTIONS_MISSING` | error | A decision question needs instructions: the statement the provider judges about the state. |
| `DECISION_QUESTION_NAME_DUPLICATE` | error | Duplicate question name "…". |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | error | Decision provider "…" (…) does not advertise support for "…" questions. |
| `DECISION_SCORE_LEVELS_OUT_OF_RANGE` | error | A score question needs 2 to 10 ordered levels, lowest first; … declared. |
| `DECISION_STATE_MISSING` | error | DecisionAction has no state expression. |
| `DECISION_THRESHOLD_IN_DRIFT_BAND` | error | confidenceThreshold … sits within the … probability drift band of the 0.5 decision boundary for provider "…". |
| `DECISION_THRESHOLD_OUT_OF_RANGE` | error | confidenceThreshold must be between 0 and 1; … declared. |
