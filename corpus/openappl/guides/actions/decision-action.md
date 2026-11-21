---
title: DecisionAction
---

# DecisionAction

Asks a calibrated decision provider typed questions about one piece of state and writes the typed
answers onto the workflow context. Use it when a later action **branches** on the answer: classify,
route, score, gate. For prose (a reply, a summary, a rewrite) use
[`AiCallAction`](./ai-call-action.md); for multi-step work with tools use
[`AgentCallAction`](./agent-call-action.md).

A decision provider is not a language model: it takes no prompt, writes no text, and an isolated call
returns in roughly 250-400 ms. Its answer is always one of the values you declared, which is not the
same as always being right, and it cannot explain itself. See [Limits](#limits).

> Family guide: [The decision layer](../capabilities/decision-layer.md), which covers the provider
> setup, the other decision patterns and the measured behaviour this page refers to.

## When to use it

- Route a request: which team, which queue, which handler.
- Detect an intent a field does not carry: "is this a refund request", "is this a complaint".
- Grade something on a scale you define: urgency, severity, sentiment.
- Gate a risky operation on a judgement, with `checkType: "liveCheck"`.
- Classify in bulk: `state` takes an array and answers many subjects in one request.
- **Not** for authorization. A decision may never make a permission call; see [Limits](#limits).

Before authoring one, check whether a built-in pattern already covers the job: a stored judgement per
row is a [`decisionSource`](../capabilities/decision-layer.md#decisionsource-write-time-columns), a list
narrowed by a judgement about a column is a
[`FuzzyDomainFilter`](../capabilities/decision-layer.md#fuzzy-domain-filters-query-time), a check on an
agent's tool calls is a [`decisionGate`](../capabilities/decision-layer.md#decisiongate-agent-tool-calls),
and "moderate what users write to this object" is
[`objectModeration`](../capabilities/object-moderation.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md). Declared in
the API's `actions.decisionActions[]` and referenced by name from a workflow milestone.

| Property | Type | Req | Description |
|---|---|---|---|
| `providerName` | `String` | yes | A `projectSettings.decisionProvidersSettings.decisionProviders[].name`. The provider's credentials are supplied to the running service by the hosting platform. |
| `model` | `String` | no | A pinned version (`DECISION_MODEL_NOT_PINNED` refuses a floating tag). Leave it unset to inherit the provider entry's pin; one of the two must pin. The override is forwarded on cached and uncached requests; cache identity includes the selected model. The deterministic mock retains its own model identity. |
| `state` | `MScript` | yes | ONE expression producing the state every question is judged against: an object, text, or an **array** of subjects. |
| `questions` | `DecisionQuestion[]` | yes | The question bundle. All questions are judged in parallel against the same state, in one request. |
| `checkType` | `ApiCheckType` | no | `storedCheck` (default) writes the context and continues; `liveCheck` throws `DecisionUnavailable` when a question came back unanswered or undecided. Same split as [`ValidationAction`](./validation-action.md). |
| `confidenceThreshold` | `Double` | no | At or above this **confidence**, act on the answer directly. Must sit outside the provider's drift band around 0.5: for `typesafe`, not strictly between 0.3 and 0.7 (`DECISION_THRESHOLD_IN_DRIFT_BAND`). Unset = every answer is acted on. |
| `onLowConfidence` | enum | no | `passThrough`, `escalate`, `reject`, `defaultAnswer`. Default `escalate` when `escalateTo` is set, otherwise `passThrough`. An undecided answer always takes it; a low-confidence one only when `confidenceThreshold` is set. |
| `escalateTo` | `String` | no | An `aiCallActions[]` or `agentCallActions[]` entry of this API that answers what this action was not confident about. |
| `onProviderError` | enum | no | `failClosed` (default), `failOpen`, `defaultAnswer`. A `liveCheck` action may not use `failOpen`. |
| `timeoutMs` | `Integer` | no | Positive per-request adapter deadline, including retries and response-body reads. HTTP is aborted on expiry and DecisionTransportError follows onProviderError. Null means no adapter deadline. State MScript and Redis access are outside this deadline. |
| `cache` | `DecisionCacheSettings` | no | `enabled: true` sends the bundle through the decision layer's one cache (Redis). See [The cache](#the-cache). |

### Question types

Each entry of `questions` is a [`DecisionQuestion`](../../spec/DecisionQuestion.md): `name` (the
context key), `type`, `instructions`, `criteria` and, for the `defaultAnswer` postures,
`defaultAnswer`.

| `type` | The context `value` | `confidence` | `criteria` |
|---|---|---|---|
| `noul` | a **boolean**: true when the provider's probability is 0.5 or more | `max(p, 1 - p)`, the distance from the boundary | not used (a warning if present) |
| `choice` | one of your option keys | the provider's confidence in it | the option map; at least two options and an **escape option**; at most the entry's `maxChoiceOptions` (255 for `typesafe`) |
| `score` | a (possibly fractional) **1-based** position on your levels: 1 is the first, n the last | the provider's confidence | 2-10 levels, lowest first; entry order IS the scale |

A `noul`'s `instructions` is a **statement**, not a question: "The customer is asking for a refund",
not "Is the customer asking for a refund?".

> **The `typesafe` API speaks a different `score` shape** (an ordered level list, a 0-based answer).
> The adapter translates both ways, so the value you read is the same 1-based position the
> mock answers, and `probabilities` is keyed by your level names.

`defaultAnswer` is a string: `"true"` / `"false"` for a `noul`, an option key for a `choice`, a
number for a `score`.

DecisionQuestion.bindTo has been removed because it never performed a write. Remove it from existing question definitions. Map workflow results explicitly from `this.decisions.<actionName>.<questionName>.value` through the existing result/data-clause mapping. For write-time materialization use DataProperty.decisionSource, which stores decision, confidence and model.

## The context shape

```
this.decisions.<actionName>.<questionName> = {
  value,          // the DECISION: boolean | option key | number (null when unanswered or undecided)
  confidence,     // 0..1 (0 when undecided)
  probabilities,  // the distribution, when the provider returns one
  model,          // the model version that answered
  undecided,      // true when no model made this decision; false otherwise
  undecidedReason // credentialMissing | mockDirective when undecided, else null
}
this.decisions.<actionName>._meta = {
  model, decidedBy, lowConfidence[], unanswered[], undecided[], providerFailed,
  escalatedTo?, escalationResult?,
  cache?          // { hits[], asked[], stored } when cache.enabled
}
```

Branch on `value`. **Never branch on, or test against, `probabilities` or a raw `confidence`
number**: the decision is reproducible across identical requests but the probability and the
confidence drift by up to 0.10, so anything keyed on the number is a flake with a schedule.

`decidedBy` is `provider`, `mock` (the declared mock brand) or `mock-fallback`: a credentialed entry
whose key is missing is answered by a stand-in that decides nothing, so every question comes back
undecided (see
[Every question can come back undecided](../capabilities/decision-layer.md#every-question-can-come-back-undecided)).
Persist `decidedBy` next to `model` whenever you store a decision: a stored judgement without both
cannot be re-derived when the criterion changes.

**Test `undecided` before acting on `value`.** An undecided question's `value` is null, never a
`false` or a `0`, so a check like `value === false` does not fire on it; a workflow that treats "not
true" as "no" should read `undecided` first.

## Example

```json
{
  "name": "triage",
  "providerName": "mainJev",
  "state": { "js": "({ subject: this.subject, body: this.body })" },
  "questions": [
    { "name": "isRefundRequest", "type": "noul",
      "instructions": "The customer is asking for money back." },
    { "name": "team", "type": "choice",
      "instructions": "Which team should handle this",
      "criteria": [
        { "name": "billing",   "value": "Payments, invoices, refunds" },
        { "name": "technical", "value": "Bugs, outages, errors" },
        { "name": "other",     "value": "Anything the other options do not cover" }
      ] }
  ],
  "confidenceThreshold": 0.85,
  "onLowConfidence": "escalate",
  "escalateTo": "explainTicket",
  "onProviderError": "failClosed"
}
```

A later action then reads:

```json
{ "js": "this.decisions.triage.team.value === 'billing'" }
```

A complete create API built around this action, with the escalation target and the data clause that
stores the result, is in
[the family guide](../capabilities/decision-layer.md#example-route-a-support-ticket-with-an-escalation-path).

## Behaviour

**One request.** However many questions the bundle holds, the action issues exactly one provider
request. The state is what you pay for, so asking more questions about the same state is nearly
free.

**Low confidence** (a confidence below `confidenceThreshold`) and an **undecided** answer (no model
judged the question; with or without a threshold) follow `onLowConfidence`. An undecided question is
also listed in `_meta.undecided`:

- `passThrough`: keep the answer (an undecided one stays null) and record the question in
  `_meta.lowConfidence`
- `escalate`: run `escalateTo` once and record `_meta.escalatedTo` and `_meta.escalationResult` (the
  escalation action's return value, such as an `AiCallAction`'s parsed JSON)
- `reject`: throw `DecisionNotConfident` (422)
- `defaultAnswer`: substitute each low-confidence question's `defaultAnswer`

The escalation target is called by this action, so **do not also list it in the workflow**, or it
runs on every request. Validation counts it as scheduled whenever this action is, so it raises no
`WORKFLOW_ACTION_UNSCHEDULED` of its own. It must be an `aiCallActions[]` or `agentCallActions[]`
entry of the **same Business API**: the escalation calls that API's own copy of the action, so a
same-named action in another API of the service is refused with
`DECISION_ESCALATE_TARGET_OTHER_API`.

**A provider failure** follows `onProviderError`:

- `failClosed` (default): rethrow the provider error, so the request fails and no decision is left
  behind
- `failOpen`: continue with null values and `_meta.providerFailed: true`
- `defaultAnswer`: substitute each question's `defaultAnswer`, with confidence 0

**`liveCheck`** additionally throws `DecisionUnavailable` (422) when any question came back
unanswered or undecided, whatever `onLowConfidence` did with it. `storedCheck` records them in
`_meta.unanswered` / `_meta.undecided` and continues.

The provider failure and the escalation are logged as `DecisionActionProviderFailure` and
`DecisionActionEscalated`.

### The cache

With `cache.enabled: true` the bundle goes through the decision layer's
[one cache](../capabilities/decision-layer.md#the-decision-cache), in the service's Redis:

- one entry per **question**, keyed on the provider, the pinned model, the question type, the
  instructions, the criteria, the state and the optional `cache.keyExtra` MScript;
- a fully cached bundle makes no provider request, and a partly cached one asks only its missing
  questions, still in one request;
- the cached **decision** is the authority: the first stored answer is served until the key changes or
  `ttlSeconds` (unset = no expiry) runs out;
- `_meta.cache` records which questions were hits (`hits`), which were asked (`asked`) and whether the
  new answers were stored (`stored`).

A Redis outage turns every lookup into a miss; it never fails the action. A negative `ttlSeconds` is
`DECISION_CACHE_TTL_INVALID`.

## Limits

**It cannot make an authorization decision.** A calibrated probability has no rationale: it cannot
be audited or explained, and it has no stable answer to "why was this denied". A `permissionCheck`,
`membershipCheck` or `objectPermissionCheck` that reads `this.decisions.*` fails validation with
`DECISION_ON_AUTHZ_SURFACE`. Use the permission system for permission.

**It cannot tell you why.** When you need the reason, to show a user or to log for review, pair it
with `escalateTo` and let a language model produce the explanation.

**It answers only inside your options, and can still pick the wrong one.** That is why a `choice`
needs an escape option, so a state that fits none of your options has somewhere to go, and why the
threshold and escalation exist.

**A compiler refuses it for a service language that does not implement it.** Validation reports
`DECISION_ACTION_LANGUAGE_UNSUPPORTED` rather than letting the workflow run without its decision.

## Validation codes

Errors unless marked (W).

| Code | Meaning |
|---|---|
| `DECISION_ACTION_MISSING_PROVIDER` / `DECISION_PROVIDER_NOT_FOUND` | no `providerName`, or it resolves to nothing |
| `DECISION_ACTION_LANGUAGE_UNSUPPORTED` | the service's language does not implement the action |
| `DECISION_MODEL_NOT_PINNED` | a floating model tag, or neither action nor provider pins one |
| `DECISION_STATE_MISSING` / `DECISION_NO_QUESTIONS` | nothing to decide on, or nothing asked |
| `DECISION_QUESTION_NAME_DUPLICATE` | two questions share a context key |
| `DECISION_QUESTION_INSTRUCTIONS_MISSING` | a question without instructions |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | the provider entry does not advertise that type |
| `DECISION_CHOICE_NO_ESCAPE_OPTION` / `DECISION_CHOICE_CRITERIA_MISSING` / `DECISION_CHOICE_OVER_CEILING` | `choice` shape |
| `DECISION_SCORE_LEVELS_OUT_OF_RANGE` | a `score` outside 2-10 levels |
| `DECISION_NOUL_CRITERIA_IGNORED` (W) | `criteria` on a `noul` |
| `DECISION_THRESHOLD_IN_DRIFT_BAND` / `DECISION_THRESHOLD_OUT_OF_RANGE` | the threshold |
| `DECISION_ESCALATE_TARGET_MISSING` / `DECISION_ESCALATE_TARGET_NOT_FOUND` | the escalation seam |
| `DECISION_ESCALATE_TARGET_OTHER_API` | `escalateTo` names an action of another Business API; the target must be in the same API |
| `DECISION_ESCALATE_TARGET_UNREACHABLE` (W) | `escalateTo` set but `onLowConfidence` is not `escalate` |
| `DECISION_LOW_CONFIDENCE_WITHOUT_THRESHOLD` (W) | `onLowConfidence` set but no `confidenceThreshold`: only an undecided answer takes it |
| `DECISION_DEFAULT_ANSWER_MISSING` / `DECISION_DEFAULT_ANSWER_NOT_AN_OPTION` | defaults |
| `DECISION_NARROWING_FILTER_FAILS_OPEN` | `liveCheck` with `failOpen` |
| `DECISION_ON_AUTHZ_SURFACE` | an authorization surface reads this decision |
| `DECISION_CACHE_TTL_INVALID` | a negative `cache.ttlSeconds` |

## See also

- [The decision layer](../capabilities/decision-layer.md): the family guide, provider setup, failure
  postures and measured behaviour
- [`DecisionProvider`](../../spec/DecisionProvider.md) · [`DecisionQuestion`](../../spec/DecisionQuestion.md) ·
  [`DecisionCacheSettings`](../../spec/DecisionCacheSettings.md)
- [Object content moderation](../capabilities/object-moderation.md): the language's own decision on writes
  to a data object, and how its `onProviderError` vocabulary maps to this action's
- [`AiCallAction`](./ai-call-action.md) · [`AgentCallAction`](./agent-call-action.md) · [`ValidationAction`](./validation-action.md)
