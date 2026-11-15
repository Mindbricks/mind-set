---
title: "The decision layer: the decision pattern family"
---

# The decision layer: the decision pattern family

**Also searchable as:** System One, System 1, systemOne, decision provider, decision model,
calibrated decision, zero-shot classifier, DecisionAction, decisionSource,
FuzzyDomainFilter, fuzzy filter, decisionGate, tool-call gate, objectModeration,
contentModeration, classify, judged column, judged page, DecisionPageJudgement, rerank,
read surface judgement.

A **System One model** (the name comes from Kahneman's fast, intuitive *System 1*
thinking) answers typed questions about a piece of state and attaches a calibrated
probability to each answer. It is not a language model: it writes no sentences, takes no
prompt and gives no reasons. Its answer is always one of the values you declared (a yes/no
probability, one of your options, a level on your scale), and an isolated call returns in
roughly 250-400 ms.

OpenAPPL expresses this as the **decision layer**: one provider family you configure once
at project level, and a family of patterns that bind a decision to a specific place in a
generated service. A workflow step, a list API filter, a stored column, an agent's tool
calls, a data object's writes, a realtime hub's messages, an outbound notification's
content and an event stream's cleaning pipeline can each take a decision. This page is the
guide to the whole family: what each pattern is for, how to choose between them, how to
configure them, how they fail, and what the provider has been measured to do.

The first supported provider brand is `typesafe`, a remote zero-shot service. The surface
is provider-neutral, and a `mock` brand answers deterministically with no credential, so
you can build and test without a key. Every question can also come back **undecided**, and
every pattern is built to handle that: see
[Every question can come back undecided](#every-question-can-come-back-undecided).

> **Reference:** [`DecisionProvider`](../../spec/DecisionProvider.md) ·
> [`DecisionProviderConfig`](../../spec/DecisionProviderConfig.md) ·
> [`DecisionCapabilities`](../../spec/DecisionCapabilities.md) ·
> [`DecisionQuestion`](../../spec/DecisionQuestion.md) ·
> [`DecisionAction`](../../spec/DecisionAction.md) ·
> [`DecisionCacheSettings`](../../spec/DecisionCacheSettings.md) ·
> [`FuzzyDomainFilter`](../../spec/FuzzyDomainFilter.md) ·
> [`PropertyDecisionSource`](../../spec/PropertyDecisionSource.md) ·
> [`AgentDecisionGate`](../../spec/AgentDecisionGate.md) ·
> [`ObjectModeration`](../../spec/ObjectModeration.md) ·
> [`ContentModeration`](../../spec/ContentModeration.md) ·
> [`CleaningClassifySettings`](../../spec/CleaningClassifySettings.md)

---

## The family at a glance

| Pattern | Where it attaches | What it asks | What it produces | Status |
|---|---|---|---|---|
| [`DecisionProvider`](../../spec/DecisionProvider.md) | `projectSettings.decisionProvidersSettings.decisionProviders[]` | nothing by itself | a named, credentialed provider every other pattern references by `providerName` | shipped |
| [`DecisionQuestion`](../../spec/DecisionQuestion.md) | inside the patterns below | one typed question: `noul`, `choice` or `score` | one typed answer | shipped |
| [`DecisionAction`](../../spec/DecisionAction.md) | a business API's `actions.decisionActions[]` | your question bundle about a `state` you compute | `this.decisions.<action>.<question>` on the workflow context | shipped |
| [`DecisionCacheSettings`](../../spec/DecisionCacheSettings.md) | `DecisionAction.cache`, `FuzzyDomainFilter.cache`; always on for `classify` rules | (no question) | one shared Redis cache of stored decisions | shipped |
| [`FuzzyDomainFilter`](../../spec/FuzzyDomainFilter.md) | a list API's `whereClause.fuzzyDomainFilters[]`, or a joint filter's `fuzzyDomainFilters[]` | one `noul` per **distinct value** of a column | `column IN (<qualifying values>)` merged into the query | shipped |
| [`PropertyDecisionSource`](../../spec/PropertyDecisionSource.md) | a property's `decisionSource` block | one question about the **row** | the property's value plus confidence, model and time columns | shipped |
| [`AgentDecisionGate`](../../spec/AgentDecisionGate.md) | an AI agent's `guardrails.decisionGate` | your `noul` questions about each **tool call** | allow, deny, hold for approval, or warn, before the tool runs | shipped |
| [`ObjectModeration`](../../spec/ObjectModeration.md) | a data object's `objectSettings.objectModeration` | one framework-owned `verdict` choice about each **write** | accept, reject or hold for human review | shipped |
| `classify` cleaning rule ([`CleaningClassifySettings`](../../spec/CleaningClassifySettings.md)) | an event stream's `cleaningPipeline.rules[]` (`op: "classify"`) | one question per **distinct value** of a stream column | a judged column plus confidence and model, groupable by an analytics rollup | shipped (enumerable columns) |
| `judgement` block ([`DecisionPageJudgement`](../../spec/EventStreamReadSurface.md)) | an event stream's `readSurfaces[]` entry of type `latestN` | one `noul` (filter) or one `score` (rerank) per **record** of a bounded page, in one request | the page narrowed to the records that qualify, or reordered by score, with an attribution | shipped (nodejs, rust) |
| [`ContentModeration`](../../spec/ContentModeration.md) | a realtime hub's `contentModeration`, an event notification's `contentModeration` | the same framework-owned `verdict` about each **user message** or **rendered notification** | deliver, reject, or hold for human review (an accept delivers it) | shipped |

The family is implemented for **nodejs and java services**, including the provider
registry, DecisionAction, agent decision gates, property decisionSource, main and joint
fuzzy filtering, enumerable cleaning `classify`, and data-object, hub, notification and
staged content-model editorial moderation. The content and item writers and reviewer
replay support PostgreSQL and MongoDB. Validation refuses unsupported surfaces with a
`*_LANGUAGE_UNSUPPORTED` error (`DECISION_ACTION_`, `AGENT_DECISION_GATE_`,
`DECISION_SOURCE_`, `FUZZY_DOMAIN_`, `OBJECT_MODERATION_`, `CLEANING_CLASSIFY_`,
`DECISION_PAGE_`), so none of them is ever dropped silently. The judged read-surface page
(`judgement`) is nodejs and rust only.

---

## What a decision provider is, and when to use one

A business API can express any rule you can write as an MScript boolean (see
[MScript](../mscript/overview.md)). It cannot express a **judgement**:

- is this profession one that normally requires a university degree?
- is this support message about billing, about a bug, or neither?
- does this shell command destroy data irreversibly?
- is this comment attacking a person, or just frustrated about the product?

Before the decision layer those rules had two homes. One was an
[`AiCallAction`](../../spec/AiCallAction.md): a real model call, billed per output token,
answering in text that has to be parsed back into a decision. The other was nowhere at all,
and most projects simply dropped the rules that did not fit MScript.

| | MScript | Decision provider | `AiCallAction` | `AgentCallAction` |
|---|---|---|---|---|
| Answers | whatever your expression computes | a typed value + confidence | text (optionally JSON) | text, after a tool loop |
| Output space | yours | **declared by you** | whatever the model writes | whatever the model writes |
| Typical latency | in-process | 250-400 ms per isolated call | seconds | seconds to minutes |
| Output tokens | none | free | billed | billed |
| Explains itself | it is the explanation | **no** | yes | yes |
| Use for | rules you can write down | classify, route, score, gate on a judgement | generate, rewrite, summarise, explain | multi-step work with tools |

Rules of thumb:

- **If you can write the rule, write it in MScript.** It is exact, free and auditable.
- **If a later step branches on the answer, use a decision.** The dividing line is not
  cost, it is whether you need prose. A decision gives you a value to branch on; a language
  model gives you text to read.
- **If a human reads the answer, or you need the reason, use a language model.** A decision
  provider gives you a number and never a reason. When you need both, combine them: the
  decision takes the confident majority and an `escalateTo` language model takes the rest
  (see [`DecisionAction`](#decisionaction-a-decision-inside-a-workflow)).
- **If you already have a trained classifier, the
  [compute layer's `ai-inference` archetype](compute-layer.md) runs it locally.** A decision
  provider is the remote, zero-shot alternative for when you have no trained model and no
  training data.

The answer is always one of your declared values, which is not the same as always being
right. Inside your options the provider can still pick the wrong one, which is what the
confidence threshold, the escape option and the human paths in each pattern are for.

---

## Choosing a binding

A decision runs **per subject**, not per row set. It can never sit inside a WHERE clause
evaluated over a table: 300 ms times a million rows is not a query. So the design question
is always *where* the decision is taken, and the family gives each answer its own pattern.

| You want to | Use | Binding |
|---|---|---|
| branch a business API's workflow on a judgement (route, triage, score, gate) | [`DecisionAction`](#decisionaction-a-decision-inside-a-workflow) | in-workflow |
| filter a list by a judgement about a **low-cardinality** column ("professions that need a degree") | [`FuzzyDomainFilter`](#fuzzy-domain-filters-query-time) | query time, cached per value |
| store a judgement about each **row** so later queries are plain indexed predicates | [`decisionSource`](#decisionsource-write-time-columns) | write time |
| stop an AI agent's tool call that is about to do damage | [`decisionGate`](#decisiongate-agent-tool-calls) | agent tool loop |
| hold what users write to a data object until it is accepted | [`objectModeration`](#objectmoderation-moderated-writes) | write time, staged |
| judge a field of a high-volume event stream into an analytics dimension | [`classify` rule](#big-load-classify-judged-event-stream-columns) | batch, in the cleaning pipeline |
| keep only the records of a bounded event-stream page a statement holds for, or put the most relevant first | [`judgement` on a `latestN` read surface](#judged-read-surface-filter-or-rerank-one-page) | read time, one request per page |
| moderate realtime hub messages or outbound notification content | [`contentModeration`](#contentmoderation-hub-messages-and-notifications) | before delivery, held |

The three classic binding points, in the terms the patterns use:

- **A. Classify the values, not the rows** (`FuzzyDomainFilter`, and the `classify`
  cleaning rule for event streams). For *"people whose profession requires a university
  education"*, do not classify people. Classify the few hundred **distinct professions**,
  cache each decision, and the query becomes `profession IN (...)`. Ten million rows and ten
  thousand cost the same few hundred decisions.
- **B. Decide at write time** (`decisionSource`, `objectModeration`; `contentModeration` is
  the same idea applied before delivery rather than before a write). Store the decision
  when the record is created or updated, with its confidence and the **pinned model
  version**. Every later query is an ordinary indexed predicate with no model in the path.
  This is also the only honest form when the thing judged is free text, whose values cannot
  be enumerated.
- **C. Filter or re-rank a bounded page** after it is fetched. Bounded by construction, so
  it needs no cache. Built in for an event stream's `latestN` read surface
  ([the `judgement` block](#judged-read-surface-filter-or-rerank-one-page), nodejs and
  rust). The list APIs have no built-in form yet: there you implement it as a workflow
  design with a `DecisionAction` whose `state` is the page.

If the column has more distinct values than a fuzzy filter allows (1,000 by default),
classify at write time instead.

---

## Setting up a provider

Declare one entry per provider you want available, under `projectSettings`:

```json
{
  "projectSettings": {
    "decisionProvidersSettings": {
      "decisionProviders": [
        {
          "name": "mainJev",
          "provider": "typesafe",
          "configuration": { "apiKey": "<API key>", "model": "jev-1.13.0" }
        },
        {
          "name": "localDecisions",
          "provider": "mock",
          "configuration": { "model": "mock-1", "seed": "dev" }
        }
      ]
    }
  }
}
```

The `name` is the key every decision pattern uses in `providerName`, and the prefix of the
environment variables the generated service reads. Names must be unique
(`UNIQUE_DECISION_PROVIDER_NAME`). `configuration` is an **object**, not the
`[{name, value}]` list other provider families use; a list is converted with a warning
(`DECISION_CONFIG_LIST_CANONICALIZED`).

### Brands

| `provider` | Required | Optional | Notes |
|---|---|---|---|
| `typesafe` | `apiKey` (secret), `model` (pinned) | `baseUrl` | A remote System One API (`/v1/systemone`). `baseUrl` overrides the default endpoint for proxies and test harnesses; leave it empty in production. |
| `custom` | `baseUrl` | `apiKey` (secret), `apiFormat`, `model`, `extraHeaders` | Your own endpoint. `apiFormat: systemone` (default) speaks the `typesafe` contract verbatim; `openai` / `anthropic` emulate the decision interface over that vendor's structured-output call. `extraHeaders` values are **not** masked: secrets go in `apiKey`. |
| `mock` | none | `seed` | A real transport that answers deterministically from (seed, state, question) and never reaches the network. See [Developing without a key](#developing-without-a-key). |

A missing required key is `DECISION_PROVIDER_MISSING_CONFIG`.

### Environment variables

Each configuration key is read by the generated service from
`DECISION_PROVIDER_<NAME>_<KEY>`, where `<NAME>` is the entry name upper-cased with every
character outside `A-Z`, `0-9` and `_` replaced by `_`, and `<KEY>` is the key in upper
snake case. For `mainJev`:

| Key | Variable |
|---|---|
| `apiKey` | `DECISION_PROVIDER_MAINJEV_API_KEY` |
| `model` | `DECISION_PROVIDER_MAINJEV_MODEL` |
| `baseUrl` | `DECISION_PROVIDER_MAINJEV_BASE_URL` |
| `apiFormat` | `DECISION_PROVIDER_MAINJEV_API_FORMAT` |
| `extraHeaders` | `DECISION_PROVIDER_MAINJEV_EXTRA_HEADERS` |
| `seed` | `DECISION_PROVIDER_MAINJEV_SEED` |

`apiKey` is a secret: masked in API responses, and never written to a log line or an error
body.

**A missing credential does not block the build, and it never produces a decision.** When a
`typesafe` entry has no usable `API_KEY` or `MODEL` (or a `custom` entry has no
`BASE_URL`), the service constructs a stand-in under that entry's name and logs one warning
naming the missing variables. The stand-in answers **every** question
[undecided](#every-question-can-come-back-undecided) with the reason `credentialMissing`
and `decidedBy: "mock-fallback"`: it never hashes an answer and never honours a test
directive. Each pattern then does what it does with doubt (a low-confidence path, review,
exclusion, an unset column), so a keyless deployment degrades visibly instead of acting on
invented decisions. `GET /v1/decisions/mock-status` lists the providers running on the
stand-in.

### The pinned model

`model` must name **one immutable release**, such as `jev-1.13.0`. A floating tag
(`latest`, `jev-latest`, a bare `jev` with no version) is refused with
`DECISION_MODEL_NOT_PINNED`. The test is simple: the tag must contain a digit and must not
be `latest` or end in `-latest` or `:latest`. An unpinned model means the same blueprint
answers differently on two consecutive days: tests redden with no attributable cause, and
every cache keyed on the version is poisoned.

Every consumer pattern also needs a pin to inherit. On a `mock` entry, set
`configuration.model` to a pinned-looking tag (`mock-1` above) so the consumers' pin check
passes. The mock answers under its own model string (`mock-decision-1.0.0`) whatever you
write there.

DecisionAction, FuzzyDomainFilter (ordinary and joint), decisionSource (writes and
backfills), AgentDecisionGate and classify forward their per-pattern model pins. Null
inherits the provider entry. Cached decisions are separated by selected model;
stored and audited decisions retain the actual answering model.

### Capabilities

Each entry advertises a [`DecisionCapabilities`](../../spec/DecisionCapabilities.md) block.
Leave it out: its defaults come from the brand.

| Capability | `typesafe` | `custom` | `mock` |
|---|---|---|---|
| `supportsNoul` / `supportsChoice` / `supportsScore` | true / true / true | true / true / true | true / true / true |
| `maxChoiceOptions` | 255 | 255 | 255 |
| `contextTokenCeiling` (state + all questions) | 65,536 | 65,536 | 65,536 |
| `singleQuestionTokenCeiling` (state + longest question) | 32,768 | 32,768 | 32,768 |
| `probabilityDriftBand` | **0.2** | 0.2 | 0 |

A declared block may only **narrow** a brand: switch a question type off on an entry meant
only for yes/no gating, or lower a ceiling. Advertising more than the adapter supports is
`DECISION_CAPABILITY_EXCEEDS_BRAND`. A pattern that asks a question type the entry does not
support is refused at design time (`DECISION_QUESTION_TYPE_UNSUPPORTED`), and the runtime
refuses the same shape before any request is sent.

`probabilityDriftBand` is the measured width of the provider's probability noise. A
confidence threshold inside the band either side of 0.5 is refused, because the same
request could land on either side of it on different days. For `typesafe` that means any
threshold strictly between 0.3 and 0.7. The `custom` brand inherits the `typesafe` band
because its endpoint is unmeasured. The mock is deterministic, so its band is 0. See
[The decision is reproducible; the probability is not](#the-decision-is-reproducible-the-probability-is-not).

---

## Questions and answers

Every pattern speaks in [`DecisionQuestion`](../../spec/DecisionQuestion.md)s.

| Field | Meaning |
|---|---|
| `name` | the question's key; the answer comes back under it |
| `type` | `noul`, `choice` or `score` |
| `instructions` | the statement or instruction judged about the state, in plain language |
| `criteria` | `choice`: the option map; `score`: the ordered levels. Each entry is `{ "name": <key>, "value": <description> }` |
| `defaultAnswer` | `DecisionAction` only: the answer substituted under the `defaultAnswer` postures |

### The three question types

| `type` | The provider answers | The value a pattern acts on | `criteria` |
|---|---|---|---|
| `noul` | the probability 0..1 that the statement holds | a **boolean**: true at a probability of 0.5 or more. Its confidence is `max(p, 1 - p)` | not used (`DECISION_NOUL_CRITERIA_IGNORED` warns) |
| `choice` | one of your option keys, with the distribution over all of them | the option key | at least two options plus an **escape option**; at most the entry's `maxChoiceOptions` |
| `score` | a fractional position on your ordered levels | the position, **1-based**: 1 is the first level, n the last, 2.6 sits between the second and third | 2 to 10 levels, lowest first: entry **order** is the scale |

**Write a `noul` as a statement, not a question.** "The customer is asking for money
back", not "Is the customer asking for money back?". There is no prompt and no system
message: role play, examples and output-format instructions belong nowhere in
`instructions`.

**Write instructions for your project.** In one measurement, `git stash` was answered as
*not* destructive, which is defensible because a stash is recoverable. In another
repository a bare `git stash` is banned, because it once destroyed uncommitted work in a
shared worktree. Both readings are right for different projects, so a copied generic
bundle is wrong for most of them.

**A `choice` needs an escape option** (`DECISION_CHOICE_NO_ESCAPE_OPTION`): somewhere for a
state that fits none of your real options to go. An option counts as the escape when its
key is one of `other`, `none`, `unknown`, `unclear`, `unsure`, `else`, `na`, `n/a`,
`notApplicable`, `noneOfThese`, `noneOfTheAbove`, `cannotDetermine` or `undetermined`
(case, spaces, `_` and `-` ignored), or when its description says so ("none of these",
"anything else", "do not cover", "does not fit", "cannot be determined").

**A `score` is read on a 1-based scale.** The `typesafe` API itself takes the levels as an
ordered list and answers a 0-based position (the expected level index under its
distribution); the adapter sends your levels in entry order as `"<name>: <description>"`
and shifts the answer, so every pattern, the mock included, sees the same 1..n scale and a
`probabilities` map keyed by your level names. An `Integer` column rounds the position to
the nearest level.

### One state, many questions

**Every question in one request is judged in parallel against the same state.** Asking a
dozen questions costs barely more than asking one, because the state is what you pay for.
So a pattern always sends one state with a **bundle** of questions, never one request per
question. Ask everything the workflow needs about a state in one action.

### Many subjects, one request

`state` can also be an **array** of subjects, with each question naming the subject it is
about by an explicit id (`"The item with id t-42 ..."`). Ordinal phrasing ("the first
item") does not scale; id addressing does. The fuzzy filter and the `decisionSource`
backfill batch this way on their own. In your own `DecisionAction`, use it for bulk work (a
backfill, a batch re-check) rather than looping an action over rows.

The ceiling is the provider's 64k-token context, not accuracy: per-item accuracy held at
1.00 from 1 to 1,150 subjects at about 54 tokens a subject, and a 1,250-subject request was
refused whole (`400 max_tokens_exceeded`) rather than answered badly. Size a batch from the
token count of your own subjects, with headroom: a longer subject than the measured
one-line profession moves the ceiling down.

### Every question can come back undecided

**Undecided is an answer, not an error.** It means no model judged the question. An
undecided answer has `value: null`, `confidence: 0`, `undecided: true` and an
`undecidedReason`:

| `undecidedReason` | When |
|---|---|
| `credentialMissing` | the provider entry has no usable credentials, so the stand-in answered (see [Environment variables](#environment-variables)) |
| `mockDirective` | a declared `mock` was told to by `[[mock-decision <question>=undecided]]` (see [Developing without a key](#developing-without-a-key)) |

A real `false`, `0` or option key always carries `undecided` unset, so the two cannot be
confused. Every pattern routes an undecided answer through the posture it already has for
doubt, never acting on it as a decision, and an undecided answer is never written to the
[decision cache](#the-decision-cache), so the next call asks again:

| Pattern | An undecided answer |
|---|---|
| `DecisionAction` | `value` stays null with `undecided: true`; the question takes the `onLowConfidence` path even without a threshold; a `liveCheck` refuses with `DecisionUnavailable` |
| `FuzzyDomainFilter` | the value is excluded (the filter narrows); the attribution is `degraded` with `undecided` and `undecidedReason` |
| `decisionSource` | the value and its companions stay null, so the row stays on the backfill's work list |
| `decisionGate` | follows `onGateFail`, and the audit trail names the reason |
| `objectModeration`, `contentModeration` | `review`, with `transportFailure: "undecided:<reason>"` |
| `classify` rule | the label stays null and the value is asked again next run |

If you write your own code against a decision provider, check `answer.undecided` before
reading `value`.

---

## The decision cache

The family has **one** decision cache, shared by `DecisionAction` (opt-in,
`cache.enabled: true`), `FuzzyDomainFilter` (always on) and the `classify` cleaning rule
(always on).

- **What it stores:** the **decision** (a `noul`'s boolean, a `choice`'s key, a `score`'s
  position) with its confidence, the model that answered, who answered (`provider` or
  `mock`) and when. Never a bare probability as the thing to act on.
- **The key** is built by the service from the provider name, the pinned model, the
  question type, the instructions, the criteria (in order), the state and your optional
  `keyExtra`. You cannot leave any of those out, so correcting a criterion always takes
  effect: the next request misses and asks again. `keyExtra` is an MScript for a key
  dimension the service cannot see (tenant, locale, a policy version).
- **The first answer wins.** When two requests decide the same thing at the same moment,
  the first stored answer is kept and both use it. The stored decision is the authority: it
  is served until its key changes or its `ttlSeconds` expires, and nothing re-derives it.
  This is a correctness mechanism, not only a saving: the provider's probability moves
  between identical requests while its decision holds, so re-asking a boundary case could
  flip it.
- **The store** is the service's Redis, the same one the entity and list query caches use.
  There is no in-memory fallback, because two replicas holding two in-process copies would
  be two authorities. A Redis outage degrades to "every lookup is a miss" (logged once as
  `DecisionCacheDegraded`); it never fails a decision.
- **A mock answer is never served as the real model's.** An answer that comes back under a
  different model from the one the key was built for is used but not stored.

`DecisionAction` keys one entry per **question**, so a partly cached bundle asks only its
missing questions (still in one request) and a fully cached bundle makes no provider
request at all. A fuzzy filter and a `classify` rule key one entry per **value** of the
column (the owning object or stream is part of the key, so two owners never share an
entry). A negative `ttlSeconds` is `DECISION_CACHE_TTL_INVALID`.

---

## The patterns

### `DecisionAction`: a decision inside a workflow

A [`DecisionAction`](../../spec/DecisionAction.md) is a business API action that asks your
question bundle about one `state` MScript expression and writes the answers to the
context:

```
this.decisions.<actionName>.<questionName> = { value, confidence, probabilities, model,
                                               undecided, undecidedReason }
this.decisions.<actionName>._meta = { model, decidedBy, lowConfidence[], unanswered[], undecided[],
                                      providerFailed, escalatedTo?, escalationResult?, cache? }
```

Branch on `value`, never on `probabilities` or a raw confidence number. When `undecided` is
true, `value` is null (or the declared default under `onLowConfidence: defaultAnswer`): no
model made the decision.

The shape to reach for by default is the **fast path / slow path**:

```
                      +-- confidence >= threshold --> act on the decision
  state --> decision -+
                      +-- below threshold ----------> escalateTo: an AiCallAction or
                                                      AgentCallAction that explains
                                                      or re-decides
```

The calibrated model takes the confident majority, a language model takes the ambiguous
minority, and the run records which path answered (`_meta.escalatedTo`). The escalation
target is an `aiCallActions[]` or `agentCallActions[]` entry of the same business API: the
decision action calls that API's own action method, so a target in another API of the
service is refused (`DECISION_ESCALATE_TARGET_OTHER_API`). Do not also list it in the
workflow, or it runs on every request. A full example is
[below](#example-route-a-support-ticket-with-an-escalation-path).

Every field, the low-confidence and provider-failure postures and the full list of codes
are on the [`DecisionAction` pattern page](../../spec/DecisionAction.md).

### Fuzzy domain filters: query time

A [`FuzzyDomainFilter`](../../spec/FuzzyDomainFilter.md) is binding **A** as a declaration.
It narrows a **list** API by a judgement no column holds, from
`query.whereClause.fuzzyDomainFilters` (on the API's own object) or from a joint filter's
`fuzzyDomainFilters` (on the joined object).

On each request the generated list API:

1. reads the **distinct values** of `targetProperty`. An `Enum` property needs no read,
   because its declared options are the domain;
2. looks every value up in the decision cache;
3. asks the provider about the values it has not decided yet, as `noul` questions with
   `criterion` as the instructions. Up to 1,024 values go in one request, each addressed by
   an id, and the batch is sized from the token length of the values being sent;
4. merges `targetProperty IN (<values whose probability reaches confidenceThreshold>)` into
   the where clause.

A cold cache asks **at most one decision per distinct value**, a warm cache asks **none**,
and the row count never enters the arithmetic. A new value that appears in the column costs
one decision and moves nothing that was already decided.

| Field | Default | Notes |
|---|---|---|
| `name` | required | unique within the API; names the filter in the response attribution |
| `targetProperty` | required | a scalar `String`, `Text`, `Enum`, `Integer` or `Short` property; never `id`, the tenant column or a session/owner column |
| `criterion` | required | a statement about **one** value, true or false of it |
| `providerName` | required | a `decisionProviders[]` entry |
| `model` | inherit | a pinned model version overriding the provider entry's own (`DECISION_MODEL_NOT_PINNED` for a floating tag); null inherits the entry's pin, which must then exist. The version is part of the cache key |
| `condition` | always applied | MScript gating the filter per request; must not read roles, permissions or memberships |
| `confidenceThreshold` | `0.8` | the **probability** a value needs to qualify (not a confidence); outside (0.3, 0.7) for `typesafe` |
| `maxDomainSize` | `1000` | ceiling 5,000 |
| `onProviderError` | `failClosed` | or `matchNothing`; there is no fail-open |
| `cache` | always on, no TTL | `enabled: false` is refused; `ttlSeconds` is allowed with a warning; `keyExtra` adds a key dimension |

**The cache is the authority.** A fuzzy filter's cache has no expiry by default. A value is
classified again only when its key changes: the criterion text, the provider's pinned
model, the provider, or `cache.keyExtra`. Editing the criterion therefore re-classifies the
whole domain on the next request, so a corrected criterion takes effect immediately. A list
classified twice returns the same rows even though the provider's probability moves between
calls. A TTL is allowed but warned about (`FUZZY_DOMAIN_CACHE_TTL_REDERIVES`): every value
is asked again when its entry expires, and a value near the threshold can land on the other
side.

**Values near the threshold are left out.** A value whose probability lands within half the
provider's drift band of the threshold (±0.1 for `typesafe`, nothing for the mock) is
excluded and logged as `FuzzyDomainNearThreshold` when it is first decided. The cache then
keeps it out until the key changes. The filter narrows, so the safe side is out; and a
where clause cannot hand a case to a language model the way `DecisionAction.escalateTo`
can, so reporting the value is how this filter escalates.

**Ceiling.** `maxDomainSize` comes from how many values an author can review and re-derive
when the criterion changes, and from cost; request rate plays no part in it. For an `Enum`
property the size is checked at design time; for any other property it is checked on each
request, and an oversized domain is refused with `FUZZY_DOMAIN_CARDINALITY_EXCEEDED` before
any provider request is made.

**Failure.** With `failClosed` (the default) a provider outage fails the request with
`FUZZY_DOMAIN_PROVIDER_FAILED` (503). With `matchNothing` the filter resolves to the empty
set and its attribution is marked `degraded`. Neither returns the unfiltered rows, and
decisions that came back before the outage are kept in the cache.

**Undecided values are left out.** A value that comes back
[undecided](#every-question-can-come-back-undecided) is excluded, is not cached and is
asked again on the next request; the attribution is marked `degraded` with the count
(`undecided`) and the reason (`undecidedReason`), and `FuzzyDomainUndecided` is logged. A
provider with no credentials therefore narrows the list to nothing rather than to an
invented set.

**Attribution.** A response the filter narrowed carries a `fuzzyDomainFilters` member: per
filter, the name, property, provider, model, a hash of the criterion, the threshold, the
dead band and whether it was degraded (with `undecided` and `undecidedReason` when values
came back undecided). An exact list carries no such field.

Fuzzy filters are generated for **list** APIs of nodejs and java services that read the
database. A non-list API (`FUZZY_DOMAIN_NOT_ON_LIST`), a DataView-backed read
(`FUZZY_DOMAIN_DATAVIEW_UNSUPPORTED`) and another language
(`FUZZY_DOMAIN_LANGUAGE_UNSUPPORTED`, because its generated code would ignore the filter
and return the wider list) are refused. Example:
[a fuzzy filter on a list API](#example-a-fuzzy-domain-filter-on-a-list-api).

### `decisionSource`: write-time columns

A [`decisionSource`](../../spec/PropertyDecisionSource.md) on a `DataProperty` is binding
**B** built in. The property's value stops being something callers write: when a row is
created, and when an update changes one of the properties the judgement depends on, the
provider answers ONE typed question about the row and the service stores the **decision**
with companion columns.

| Column | What it holds |
|---|---|
| `<prop>` | the decision: a Boolean for `noul`, the option key for `choice`, the level for `score` |
| `<prop>DecisionConfidence` | the provider's confidence in it |
| `<prop>DecidedBy` | the exact model version that answered, or `manual` |
| `<prop>DecidedAt` | when; **null means not decided yet** |
| `<prop>DecisionOverridden` | `true` when a person set the value; a pinned value is never recomputed |

**The value type must fit the question:** `noul` → `Boolean`, `choice` → `Enum` (every
option key must be an enum option) or `String`, `score` → `Double`, `Float`, `Integer` or
`Short` (`DECISION_SOURCE_TYPE_MISMATCH`, `DECISION_SOURCE_ENUM_OPTIONS_MISMATCH`). The
property may not be required, defaulted, array-valued, hashed, or fed by a session or
static join: the decision is its only source (`DECISION_SOURCE_PROPERTY_CONFLICT`). The
object must not already declare a property named like a companion column
(`DECISION_SOURCE_COMPANION_COLUMN_TAKEN`).

**The state is about the row.** `this.<column>` reads the row as written (after an update,
the whole updated row), and the same expression feeds the backfill, so it may not read
request or session context.

**When it re-decides.** A create always decides. An update re-decides only when its patch
writes a `recomputeOn` property; leave `recomputeOn` null and it defaults to the columns
the state reads. An update that writes none of them never calls the provider. Two decided
properties of one object that share a provider and a state are asked in **one** request.

**Corrections stick.** Writing the property through an update API (or supplying it at
create) is a manual value: it is stored with `DecidedBy = manual` and
`DecisionOverridden = true`, and later recompute triggers leave it alone. Writing
`<prop>DecisionOverridden: false` releases it, and that update re-decides.

**A boundary case is not silently classified.** An answer below `confidenceThreshold`, a
`noul` whose probability sits inside the provider's drift band of 0.5 (for `typesafe`,
anywhere between 0.3 and 0.7), or a choice that is not one of your options is
**withheld**: the value stays null while the confidence, model and time are recorded. Query
for `<prop> IS NULL AND <prop>DecidedAt IS NOT NULL` to find the rows a person should look
at.

**An outage never fails the write.** If the provider fails, times out or is not
configured, the row is written, the value and its companions stay null, and the
**backfill** decides it later. A classification is an enrichment, not a precondition. An
[undecided](#every-question-can-come-back-undecided) answer is treated the same way:
nothing in the row looks decided (`<prop>DecidedAt` stays null) and `DecisionSourceUndecided`
is logged.

**The backfill.** Every service with a `decisionSource` runs a low-priority in-process
sweep every `backfillIntervalSeconds` (default 300; 0 turns it off). Each pass walks the
rows whose `<prop>DecidedAt` is null (rows that predate the column, and writes whose
decision failed) and asks about many rows in **one request**, each addressed by its id. The
batch is sized from tokens: it fills at most half of the provider's context by a
pessimistic estimate and never takes more than `backfillBatchSize` rows (default 256, at
most 1,000), so long subjects get smaller batches on their own. Requests go one at a time,
at most `backfillRequestsPerMinute` (default 30): set it from the throughput you have
measured for your account, not from a published limit. A rate-limit or overload answer ends
the pass early; the next pass resumes from the data, because a decided row no longer
matches. A batch that comes back entirely undecided for `credentialMissing` stops that
property's walk for the pass (`halted: "undecided"`, logged as
`DecisionSourceBackfillUndecided`), so a keyless provider costs one paced request per pass
instead of a walk of the whole table. The backfill can also be run on demand by the
generated service, and its `mode: 'stale'` re-decides rows that another model version
decided, after you re-pin.

**It never decides access.** A `decisionSource` on a property an authorization predicate
reads (the owner field, a membership configuration, an ABAC `whereClause`, a
parent-ownership check, or a permission, membership or object-permission check action)
fails validation with `DECISION_ON_AUTHZ_SURFACE`. A `decisionSource` on a framework
`sys_` object is `DECISION_SOURCE_ON_SYSTEM_OBJECT`, and a service in another language is
`DECISION_SOURCE_LANGUAGE_UNSUPPORTED`. Example:
[a decided column](#example-a-decided-priority-column).

### `decisionGate`: agent tool calls

An [`AgentDecisionGate`](../../spec/AgentDecisionGate.md) on an AI agent's
`guardrails.decisionGate` asks the provider about each tool call **before the tool runs**.
It answers the question an MScript `guardrails.inputValidation` cannot: is this particular
call about to do damage.

- **The state is fixed by the pattern:** `{ tool: <tool name>, arguments: <the call's arguments> }`.
  The gate judges exactly what is about to execute.
- **Every question must be a `noul`** (`AGENT_DECISION_GATE_QUESTION_NOT_NOUL`): a
  statement about the call, such as "this call deletes data the user did not ask to
  delete". A call is **flagged** when any question's probability is 0.5 or more. State each
  concern as its own `noul`; they all ride one request.
- **Unsure is not safe.** When a question's confidence is below `confidenceThreshold`, or a
  question comes back unanswered or [undecided](#every-question-can-come-back-undecided),
  the call follows `onGateFail` exactly as a flagged call does. An undecided answer is
  audited with its reason ("the decision gate got no decision (undecided:
  credentialMissing) on: ...").
- **`onGateFail`** and **`onProviderError`** each take `deny` (the default for both),
  `requireApproval` or `warn`. `deny` returns a typed refusal to the model loop rather than
  aborting the run, and the refusal counts toward `guardrails.maxToolCalls`, so a model that
  keeps retrying hits the ceiling. `requireApproval` pauses the run through the same
  approval seam as `toolSettings.approvalRequiredTools`. `warn` records the verdict in the
  audit trail and lets the call run: that is how a policy is trialled against real
  traffic. Both set to `warn` enforce nothing, and validation says so
  (`AGENT_DECISION_GATE_ENFORCES_NOTHING`).
- **Scope:** `appliesToTools` (empty = every tool, the safe default) and `exemptTools`
  (applied after it, for read-only tools the agent calls constantly). A tool in both is
  `AGENT_DECISION_GATE_SCOPE_CONTRADICTION`.
- **Order in the tool loop:** the gate runs after the static `approvalRequiredTools` check,
  so a call that pauses anyway costs no provider request. A call a human has already
  approved is **not re-judged**: the gate exists to route doubt to a human, and a second
  verdict must never overrule the human's answer.
- **The gate's cost is audited on every judged call.** Each call the gate judges writes a
  `decisionGate:<action>` audit entry, `decisionGate:allow` included, carrying the run id,
  the gate's own `durationMs` and the verdict; an allowed call's tool then writes its own
  entry with the tool's duration. Calls out of the gate's scope, already approved by a
  human, or refused by the tool's own guards are not judged and write no gate entry. A
  provider failure's text has the exact api key the adapter sent (the
  `Authorization: Bearer` or `x-api-key` value) replaced with `[REDACTED]` before it
  becomes an error, a refusal or an audit entry, even when the provider echoes the bare
  key.

The gate judges the **action**, never the caller's right to act. Authorization stays with
the tool's own guards, and the gate judges only a call those guards let through: a guest's
call to a non-public tool, a role-gated tool the session lacks the role for, or an unknown
tool name gets the registry's refusal with no provider request, so its arguments never
leave the service. Example: [an agent decision gate](#example-an-agent-decision-gate).

### `objectModeration`: moderated writes

[`objectModeration`](object-moderation.md) is the family's ready-made application to "may
this write be published". Enable it on any data object and its create and update APIs ask
the provider one framework-owned `verdict` question (`accept` / `reject` / `review`) with
your `policy` as the instructions. A below-threshold verdict, an
[undecided](#every-question-can-come-back-undecided) verdict (recorded as
`transportFailure: "undecided:<reason>"`) and a provider failure all go to `review`; held
submissions queue on a generated `sys_<X>ModerationReview` object with the decision stored
(never re-derived), and `reviewerRoles` accept or reject them. An optional agent writes
reasons.

It calls the provider directly rather than through `DecisionAction`, because its question
bundle is fixed by the pattern and not chosen by the author. If what you need is "moderate
what users write to this object", it is the pattern to use: you do not need a
`DecisionAction` for it. The full guide, including the `staged` and `onPlace` modes, the
review queue and its validation codes, is [Object content moderation](object-moderation.md).

**Content models** are covered by the same pattern: `contentModeration` on a `ContentModel`
is an `objectModeration` block applied to the `{name}Content` (and `{name}Item`) objects
the model synthesizes, so the generated editorial create and update APIs are held,
reviewed and replayed like any other moderated write (staged mode only). Publishing (the
draft-to-live transition) is deliberately not moderated again: it changes visibility, not
content. See
[Object content moderation, content models](object-moderation.md#content-models).

### `contentModeration`: hub messages and notifications

[`contentModeration`](../../spec/ContentModeration.md) is `objectModeration` applied to two
surfaces that are not data-object writes: a **realtime hub**
(`realtimeHubs[].contentModeration`) and an **event notification**
(`notificationService.eventNotifications[].contentModeration`). It is the same mechanism,
not a second one: the same `verdict` question with `policy` as instructions, the same
threshold (default 0.8, below it `review`), the same `onProviderError` (`failToReview` /
`failToReject`), the same reasons agent and the same review-row columns and reviewer APIs.
What differs is that held content is not written anywhere, and a reviewer's accept
**delivers** it.

- **Hub messages.** Every message a user sends (socket `hub:send` and the REST send alike)
  is judged after the hub's own checks and before it is stored or broadcast, one provider
  request per message. An accept is delivered as usual; a `review` tells the sender
  `hub:messageHeld` (REST: `202`) and the room gets nothing; a `reject` answers the socket
  sender `MESSAGE_MODERATION_REJECTED` (REST: `202` with status `rejected`). `messageTypes`
  narrows the judged types and `exemptRoles` skips trusted senders. Messages the hub
  authors itself, and types a HubLogic handler processes, are not judged (listing such a
  type is `CONTENT_MODERATION_HANDLED_MESSAGE_TYPE`). The provider's round trip is added to
  every judged message's delivery.
- **Notification content.** The **rendered** content is judged right before the first send,
  on every channel, once per distinct rendered text however many recipients it fans out to.
  A `review` holds it (nothing is sent; one `sys_NotificationModerationReview` row records
  the content and its recipients) until a reviewer's accept sends it; a `reject` is never
  sent. The direct `send*Action`s of a business API are not covered.

The details, the response shapes and the three surface-only validation codes are in
[Object content moderation, hub messages and outbound notifications](object-moderation.md#hub-messages-and-outbound-notifications).

### Big-load `classify`: judged event-stream columns

A `classify` rule in an `eventStream`'s `cleaningPipeline.rules[]` is binding **A** inside
the big-load family. It judges one column of a high-volume stream and writes a **judged
column** plus `<column>Confidence` and `<column>DecidedBy` (the model version), so a
merchant descriptor becomes a merchant type and an analytics rollup can group by it.

- **It never classifies rows.** For an enumerable column (`sourceKind: "enumerable"`, the
  default) the batch stage collects the column's DISTINCT values, the service classifies
  that set once through the shared decision cache, and the value-to-label map is broadcast
  and joined. The decision count follows the distinct values, never the row count, and a
  warm run asks nothing.
- **The label follows the `decisionSource` rules:** the decision, never the probability;
  null below `confidenceThreshold`, for a `noul` inside the drift band, or for a choice
  outside its options. `score` questions are refused: a fractional level is not a stable
  label to group by.
- **A provider outage does not stop the run:** decided values are labelled, the rest stay
  null and the next run asks for exactly those. An
  [undecided](#every-question-can-come-back-undecided) value is handled the same way and is
  never cached. A column with more than `maxDistinctValues` distinct values (default 1,000,
  ceiling 5,000) stops the run before any decision is asked.
- **The judged column reaches analytics:** with an `analytics` binding, each run publishes
  the labels to the analytics store and the raw table fills the judged columns at insert
  time, so a rollup's `groupBy` can name the judged column or its `DecidedBy`.
- **Never on the ingest path** (`DECISION_ON_INGEST_PATH`): a classify outside
  `cleaningPipeline.rules[]`, or a classifying pipeline that sinks into the hot store, is
  refused.
- **Free text is not generated yet.** `sourceKind: "freeText"` is budget-checked at design
  time and then refused (`CLEANING_CLASSIFY_FREE_TEXT_NOT_IMPLEMENTED`). Judge free text
  with a `decisionSource` on a data object instead.

The full guide, with an example rule, the run diagram and every code, is
[Judged columns: the classify rule](big-data-and-async-flows.md#judged-columns-the-classify-rule).

### Judged read surface: filter or rerank one page

An `eventStreams[].readSurfaces[]` entry of type `latestN` answers the last N records of one
partition. Give it a `judgement` block and a decision provider **filters or reorders that
page** before it is answered: this is binding **C**, built in. The page is small and
already bounded, so there is no cache, and the whole page goes to the provider in **one
request**.

**When to use which mode**

- **`filter`** when the page should only contain the records a statement holds for ("an
  incident a fleet operator needs to act on"). The provider answers one `noul` per record;
  a record stays when its probability reaches `confidenceThreshold`. A filter may shorten
  the page, even to nothing.
- **`rerank`** when every record should still be there but the most relevant should come
  first ("most urgent first"). The provider answers one `score` per record against your
  ordered `criteria`, and the page is sorted by score, highest first; equal scores keep the
  original order.
- **Do not use it** to hide or reveal records by who may see them: the judged page can only
  narrow or reorder what the caller would receive anyway, and a filter that projects an
  identity stamp field is refused (see the security notes at the end of this section). Do
  not use it on a page that must be large: a page is capped at 256 records. Do not use it
  for a column with a few distinct values that a
  [`classify` rule](#big-load-classify-judged-event-stream-columns) can label once. And do
  not put it on a high-traffic open endpoint: every request spends provider budget and
  nothing is cached.

**Blueprint**

```json
{
  "eventStreams": [
    {
      "streamBasics": {
        "name": "vehicleIncident",
        "topic": "fleet.vehicleIncident",
        "partitionKey": "vehicleId",
        "clusteringKey": "ts",
        "eventSchema": [
          { "name": "vehicleId", "type": "String", "required": true },
          { "name": "ts", "type": "Date", "required": true },
          { "name": "severity", "type": "String" },
          { "name": "message", "type": "Text" },
          { "name": "odometerKm", "type": "Double" }
        ]
      },
      "hotStore": { "provider": "fleetHot" },
      "readSurfaces": [
        {
          "name": "actionableIncidents",
          "type": "latestN",
          "partitionParam": "vehicleId",
          "defaultLimit": 50,
          "maxLimit": 200,
          "loginRequired": true,
          "judgement": {
            "mode": "filter",
            "providerName": "mainJev",
            "instructions": "The incident needs a fleet operator to act on it, not just to know about it.",
            "stateFields": ["severity", "message"],
            "idField": "ts",
            "confidenceThreshold": 0.85,
            "pageCap": 100,
            "onProviderError": "failClosed"
          }
        },
        {
          "name": "mostUrgentFirst",
          "type": "latestN",
          "partitionParam": "vehicleId",
          "defaultLimit": 25,
          "maxLimit": 100,
          "loginRequired": true,
          "judgement": {
            "mode": "rerank",
            "providerName": "mainJev",
            "instructions": "How urgently a fleet operator must deal with the incident.",
            "criteria": [
              { "name": "informational", "value": "Nothing to do; for the record." },
              { "name": "routine", "value": "Handle during the next scheduled service." },
              { "name": "soon", "value": "Handle within the working day." },
              { "name": "immediate", "value": "Handle now; the vehicle is at risk or unsafe." }
            ],
            "stateFields": ["severity", "message", "odometerKm"],
            "idField": "ts",
            "onProviderError": "keepOrder"
          }
        }
      ]
    }
  ]
}
```

The first surface is a filter: a record stays on the page at probability 0.85 or higher
(0.85 is outside the provider's drift band around 0.5, as every threshold must be), at most
100 records per page and fail-closed. The second is a rerank: its `criteria` list is the
scale, **lowest level first**, each entry a level `name` and a `value` that describes it;
it has no `pageCap`, so its cap is its `defaultLimit` of 25, and it keeps the original order
if the provider fails. Both assume the `mainJev` provider entry from
[Setting up a provider](#setting-up-a-provider), which pins a model, and a store named
`fleetHot` under `projectSettings.bigLoadProvidersSettings.bigLoadStores`. `idField` is the
stream's clustering key here; the ingestion idempotency key works too.

**Fields of `judgement`** ([`DecisionPageJudgement`](../../spec/EventStreamReadSurface.md)
on the read surface)

| Field | Type | Default | Rule |
|---|---|---|---|
| `mode` | `rerank` or `filter` | required | Two separate modes; never both on one block |
| `providerName` | String | required | A `decisionProviders[].name`; must advertise `noul` for a filter and `score` for a rerank |
| `model` | String | the provider entry's pinned model | An exact release; a floating tag is refused |
| `instructions` | Text | required | What is judged about ONE item. Filter: the statement that holds for a record that STAYS. Rerank: what the score measures. Never refer to a record by its position |
| `criteria` | list of `{ name, value }` | none | Rerank only: 2 to 10 ordered score levels, lowest first. Not allowed on a filter |
| `stateFields` | list of String | required, non-empty | The explicit projection: the `eventSchema` fields of a record that reach the provider, and nothing else. `id` is reserved |
| `idField` | String | required | The `eventSchema` field that is the stable id of a record: it addresses the record in the request and in the answers. Use the clustering key or the ingestion idempotency key |
| `confidenceThreshold` | Double | 0.8 | Filter only: the probability at or above which a record stays. Must sit outside the provider's drift band around 0.5; records within half the band of it are dropped and counted as `nearThreshold`. Not allowed on a rerank |
| `pageCap` | Integer | the surface's `defaultLimit` | Most records one judged page carries. Hard maximum 256; never above the surface's `maxLimit` |
| `onProviderError` | enum | filter `failClosed`; rerank `keepOrder` | Filter: `failClosed` or `matchNothing`. Rerank: `keepOrder` or `failClosed` |

There is no `cache` and no `timeoutMs`: the provider entry's own deadline applies.

**Limits**

- **The cap.** The default cap is the surface's `defaultLimit`; `pageCap` sets it
  explicitly. The hard maximum is **256 records per page**. The request `limit` is clamped
  to the smaller of the surface's `maxLimit` and the cap, so a page is never larger than
  the cap. A `defaultLimit` above the cap, or a `pageCap` above `maxLimit`, is refused at
  design time.
- **One request.** A page is one provider request: never split, never retried by this
  feature and never truncated. A page that does not fit one request is not judged at all
  and takes the failure rule below.
- **The token budget.** One request may fill half of the provider's context after a fixed
  request envelope. At design time, the part of one record that is known up front (your
  instructions, the criteria and the projected field names) times the cap must fit that
  budget (`DECISION_PAGE_CAP_OVER_TOKEN_BUDGET`; the message names the largest cap that
  fits). At run time the fit is computed from the records actually sent, so a page of long
  values can still be too big (`overBudget`).
- **Anonymous callers.** A judged surface with `loginRequired: false` is allowed with a
  warning, because any client then spends the provider budget.

**What happens when a page cannot be judged**

A filter narrows, so it never answers the unfiltered page. A rerank only orders, so it may
keep the original order.

| Situation | filter | rerank |
|---|---|---|
| the provider fails (network, gate error, timeout) | `failClosed`: `503`. `matchNothing`: an empty page, `degraded` | `keepOrder`: the original order, `judged: false`, `degraded`. `failClosed`: `503` |
| an answer is missing, of the wrong type or out of its range: a probability outside 0 to 1, a score off its level scale (`malformedAnswer`) | as a provider failure | as a provider failure |
| the page is over the cap (`overCap`) | as a provider failure, no request | as a provider failure, no request |
| the page does not fit one request (`overBudget`) | as a provider failure, no request | as a provider failure, no request |
| a record has no id, or two share one (`unaddressable`) | as a provider failure, no request | as a provider failure, no request |
| no pinned model resolves at run time (`modelNotPinned`) | as a provider failure, no request | as a provider failure, no request |
| a record comes back [undecided](#every-question-can-come-back-undecided) | that record is dropped; the page is `degraded` | the whole page keeps its original order; `judged: false`, reason `undecided`; never `503` |

A filter that fails closed answers `503` with the error code
`DECISION_PAGE_JUDGEMENT_FAILED`. The response is generic: no provider detail and no record
content reaches the client.

**The response**

A judged surface answers the usual envelope plus a `judgement` attribution, so a degraded
page is never served as if it had been judged. `considered` is the records that came in,
`returned` the records that are on the page. A filter that judged a page:

```json
{
  "status": "OK",
  "stream": "vehicleIncident",
  "count": 1,
  "items": [
    { "vehicleId": "v-17", "ts": "2026-11-09T08:14:03.000Z", "severity": "high", "message": "Brake pressure low", "odometerKm": 48210.5 }
  ],
  "judgement": {
    "mode": "filter",
    "provider": "mainJev",
    "model": "jev-1.13.0",
    "judged": true,
    "degraded": false,
    "considered": 4,
    "returned": 1,
    "nearThreshold": 2
  }
}
```

A rerank whose provider failed under `keepOrder` answers the page in its original order and
says so:

```json
{
  "status": "OK",
  "stream": "vehicleIncident",
  "count": 5,
  "items": [ "...the five records, in the order the surface fetched them..." ],
  "judgement": {
    "mode": "rerank",
    "provider": "mainJev",
    "model": "jev-1.13.0",
    "judged": false,
    "degraded": true,
    "reason": "providerError",
    "considered": 5,
    "returned": 5
  }
}
```

`reason` is one of `providerError`, `malformedAnswer`, `overCap`, `overBudget`,
`unaddressable`, `modelNotPinned` or `undecided`. A filter that dropped records because they
came back undecided also carries `undecided` (the count) and `undecidedReason`. A client
that depends on the order or on the narrowing should check `judged` before it trusts the
page.

**Validation codes.** Errors unless marked (W).

| Code | When |
|---|---|
| `DECISION_PAGE_LANGUAGE_UNSUPPORTED` | the service is neither nodejs nor rust: its generator would ignore the block and serve the unjudged page |
| `DECISION_PAGE_SURFACE_UNSUPPORTED` | the surface is not a `latestN` |
| `DECISION_PAGE_MISSING_PROVIDER` / `DECISION_PROVIDER_NOT_FOUND` / `DECISION_MODEL_NOT_PINNED` | provider and model |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | the provider does not advertise `noul` (filter) or `score` (rerank) |
| `DECISION_PAGE_STATE_PROJECTION_EMPTY` | `stateFields` is empty |
| `DECISION_PAGE_STATE_FIELD_UNKNOWN` | a `stateFields` name is not an `eventSchema` field |
| `DECISION_PAGE_STATE_FIELD_RESERVED` | `stateFields` names `id`, which carries the record's address |
| `DECISION_PAGE_ID_FIELD_UNKNOWN` | `idField` is not an `eventSchema` field |
| `DECISION_PAGE_ID_FIELD_NOT_UNIQUE` (W) | `idField` is neither the clustering key nor the ingestion idempotency key, so nothing makes it unique; a page with two records of one id is not judged |
| `DECISION_ON_AUTHZ_SURFACE` | a filter projects an identity stamp field (the ingestion `actorField`, `sessionField` or `tenantField`) |
| `DECISION_NARROWING_FILTER_FAILS_OPEN` | a filter with `keepOrder` or `failOpen` |
| `DECISION_PAGE_FAILURE_MODE_INVALID` | `onProviderError` is not a failure mode of the mode (a rerank with `matchNothing`, or an unknown value) |
| `DECISION_PAGE_FIELD_NOT_FOR_MODE` | `criteria` on a filter, or `confidenceThreshold` on a rerank |
| `DECISION_PAGE_CRITERIA_INVALID` | a rerank without 2 to 10 ordered, named levels |
| `DECISION_THRESHOLD_OUT_OF_RANGE` / `DECISION_THRESHOLD_IN_DRIFT_BAND` | the threshold |
| `DECISION_PAGE_CAP_INVALID` | `pageCap` is not a positive integer |
| `DECISION_PAGE_CAP_EXCEEDS_HARD_MAX` | the effective cap (`pageCap`, else `defaultLimit`) is above 256 |
| `DECISION_PAGE_CAP_EXCEEDS_SURFACE_MAX` | `pageCap` is above the surface's `maxLimit` |
| `DECISION_PAGE_DEFAULT_LIMIT_OVER_CAP` | the surface's `defaultLimit` is above the cap |
| `DECISION_PAGE_CAP_OVER_TOKEN_BUDGET` | the static part of one record times the cap does not fit one request |
| `DECISION_PAGE_SURFACE_ANONYMOUS` (W) | a judged surface with `loginRequired: false` |

**Security notes**

- **Never an authorization surface.** A probability has no rationale (rule 1 below). The
  judged page is always a subset (filter) or a reordering (rerank) of the page the surface
  would have answered unjudged: the answer is selected from the records already fetched and
  can never add one.
- **The judgement runs last.** It runs after the login check, the tenant scope and the
  tenant row filter, so only records the caller would have received unjudged are projected
  and sent, and only those can come back. It does not widen the tenant scope of
  event-stream reads.
- **Only the projection leaves the service.** The provider sees the fields in `stateFields`
  and an opaque address per record, never the whole row. The address is derived from
  `idField` but is not the raw value (a short safe token, or a hash of it), so an id is
  never data on the wire. Keep personal data out of `stateFields`.
- **Record content can try to steer its own judgement.** Text a producer wrote is sent to
  the provider. Because every record on the page is one the caller could already see, the
  worst outcome is a record kept or dropped wrongly, never a record the caller was not
  entitled to.
- **An anonymous judged surface spends provider budget.** Prefer `loginRequired: true`.

**Language support.** nodejs and rust for now. Every other service language refuses the
block at design time with `DECISION_PAGE_LANGUAGE_UNSUPPORTED`, so a judgement is never
silently ignored.

The list APIs (`ListRuntimeFilterSettings`, `ListSearchFilter`) and the `currentState` and
`analyticsRollup` surfaces do not take a judgement yet.

---

## Failure postures, side by side

Every pattern takes a position on three questions: what happens when the provider cannot
answer, what happens when it answers without enough confidence, and what happens when the
answer is [undecided](#every-question-can-come-back-undecided). The family's common rule is
that **a failure never widens what a caller sees and never publishes anything on its own**,
and an undecided answer is never acted on as a decision.

| Pattern | The provider fails or times out | The answer is below the threshold | The answer is undecided | Default threshold |
|---|---|---|---|---|
| `DecisionAction` | `onProviderError`: `failClosed` (default: the request fails), `failOpen` (null values, `_meta.providerFailed`), `defaultAnswer`. A `liveCheck` action may not `failOpen` | `onLowConfidence`: `passThrough` (default without `escalateTo`), `escalate` (default with it), `reject` (422), `defaultAnswer` | the `onLowConfidence` path, with or without a threshold; `value` null and `undecided: true`; a `liveCheck` refuses (422) | none: every answer is acted on |
| `FuzzyDomainFilter` | `failClosed` (default: 503 `FUZZY_DOMAIN_PROVIDER_FAILED`) or `matchNothing` (empty list). No fail-open | the value does not qualify; within the dead band it is excluded and logged | the value is excluded, not cached; the attribution is `degraded` | 0.8 (a probability) |
| `decisionSource` | the write succeeds, the value stays null, the backfill retries | the value is withheld (null) and the confidence, model and time are stored | the value and every companion stay null; the backfill retries | none (a `noul` inside the drift band is always withheld) |
| `decisionGate` | `onProviderError`: `deny` (default), `requireApproval`, `warn` | follows `onGateFail` (default `deny`), like a flagged call | follows `onGateFail`, audited with the reason | none |
| `objectModeration` | `failToReview` (default) or `failToReject`; never publishes | always `review`: a human decides | always `review`, even under `failToReject` | 0.8 |
| `contentModeration` | `failToReview` (default) or `failToReject`; never delivers | always `review`: a human decides | always `review`, even under `failToReject` | 0.8 |
| `judgement` on a read surface | filter: `failClosed` (default: 503 `DECISION_PAGE_JUDGEMENT_FAILED`) or `matchNothing` (empty page, `degraded`); no fail-open. Rerank: `keepOrder` (default: original order, `judged: false`) or `failClosed` | the record does not stay; within the dead band it is dropped and counted `nearThreshold`. A rerank has no threshold | a filter drops the record (`degraded`); a rerank keeps the original order | 0.8 (a probability), filter only |
| `classify` rule | the run continues; undecided values keep a null label and are asked again next run | the label is null, confidence and model kept | the label is null, not cached, asked again next run | none |

Note what each threshold compares. `FuzzyDomainFilter.confidenceThreshold` is compared with
the `noul` **probability** of each value. Every other pattern compares its threshold with
the answer's **confidence**, which for a `noul` is `max(p, 1 - p)`.

---

## The four rules, and why each exists

Each is enforced at design time, as an error, and each is here because the failure it
prevents is quiet.

### 1. A decision never makes an authorization call

`DECISION_ON_AUTHZ_SURFACE`. A calibrated probability has **no rationale**. It cannot be
audited, cannot be explained to a regulator, and has no stable answer to "why was this
denied". So the family refuses every route by which a decision could decide access:

- a `permissionCheck`, `membershipCheck` or `objectPermissionCheck` action that reads
  `this.decisions.*`;
- a fuzzy filter whose target is `id`, the tenant column or a session/owner column, or
  whose `condition` reads roles, permissions or memberships;
- a `decisionSource` on a property an authorization predicate reads;
- a judged read-surface filter whose `stateFields` project an identity stamp field of the
  stream (the ingestion `actorField`, `sessionField` or `tenantField`).

Use a decision for content and routing, and the permission system for permission.
*Flagging* a transaction for human review is fine; *denying* one is not.

### 2. The model version is pinned

`DECISION_MODEL_NOT_PINNED`. A floating tag like `latest` is refused on the provider entry
and on every pattern's `model`. An unpinned model means the same blueprint answers
differently on two consecutive days.

### 3. A choice needs an escape option

`DECISION_CHOICE_NO_ESCAPE_OPTION`. Measured: given three options none of which fit, the
provider picked a wrong one **at confidence 0.51**; the same state with an `other` option
added answered `other` at **1.0**. So the model signals the mismatch rather than bluffing.
But without an escape option that signal is a confidence somebody has to remember to check,
and a silent mis-route is the default.

### 4. A narrowing decision must not fail open

`DECISION_NARROWING_FILTER_FAILS_OPEN`. A `liveCheck` `DecisionAction` may not set
`failOpen`, and a fuzzy filter has no fail-open value at all. A check that lets everything
through whenever the provider is unavailable is not a check, and a filter that returns the
unfiltered set on an outage is a data leak. A judged read-surface `filter` has no fail-open
value either (`keepOrder` and `failOpen` are `DECISION_NARROWING_FILTER_FAILS_OPEN`, and at
run time it never answers the unfiltered page). `failOpen` is legitimate only where the
worst case is a badly ordered page: a judged `rerank` may `keepOrder`.

Two further guards come from the measurements rather than from a rule of thumb: the
drift-band check (`DECISION_THRESHOLD_IN_DRIFT_BAND`, next section) and the fuzzy filter's
domain ceiling (`FUZZY_DOMAIN_CARDINALITY_EXCEEDED`).

---

## The decision is reproducible; the probability is not

Eighteen questions (six of each type) sent twelve times each at a pinned version returned
the **same decision every time**, while the numbers moved: a `noul` probability by up to
0.07, a `choice` confidence by up to 0.10, a `score` confidence by up to 0.07. An answer
near certainty barely moves; an answer in the middle of the range moves most, whatever its
type.

**Assert on the decision, never on the number.** A test may pin a `choice` or a thresholded
answer; pinning `0.72` is a flake with a schedule.

**Keep your threshold away from the decision boundary.** A threshold inside the drift band
can flip between two runs of the *same* request, so the same query would answer differently
on different days. The validator refuses it (`DECISION_THRESHOLD_IN_DRIFT_BAND`; for
`objectModeration` it is the warning `OBJECT_MODERATION_THRESHOLD_IN_DRIFT_BAND`) using the
band the provider entry advertises: for `typesafe` that is 0.2 either side of 0.5, so a
`confidenceThreshold` strictly between 0.3 and 0.7 is refused. The band is twice the worst
spread measured for any question type; one band covers all three types, because the
measured drift did not differ materially between them.

**Store the decision, not the number.** This is why `decisionSource`, the decision cache
and the moderation review row all keep the decided value with its model version, and never
re-derive it.

---

## Measured behaviour

Measured against a pinned `jev-1.13.0` on the `typesafe` brand, so you can size a design
rather than guess. Each figure is stated with its limit.

| | |
|---|---|
| Isolated call latency | 250-400 ms; p50 270 ms with concurrency bounded at 25 |
| Cost per subject inside a batch | ~54 input tokens; output tokens are free |
| Cost of a single-subject call | ~311 tokens: a ~260-token fixed overhead dominates it |
| Batch wall time | a 62-subject request takes about as long as a 1-subject request (~300 ms) |
| Accuracy vs batch size | 1.00 at every size measured from 1 to 1,150 subjects |
| Largest batch | 1,150 subjects fit; 1,250 was refused whole (`400 max_tokens_exceeded`, the 64k context) |
| Reproducibility | the decision held on every repeat; probability or confidence drifted up to 0.10 |
| Request rate | the published per-minute limit was **not enforced**: 1,500 requests ran at a sustained ~4,965/min with no `429` |
| Calibration | 44 of 45 hand-labelled cases correct, and every miss was a case marked arguable in advance |
| Large option sets | a `choice` over 121 options answered correctly at full confidence |

How to read it:

- **Batch when you can.** A lone subject spends about 84% of its tokens on the request
  envelope.
- **Do not budget capacity from the published rate limit.** It was not enforced in
  measurement, so it is neither a ceiling you will hit nor a guarantee. When a `429` or a
  `529` does arrive, it is a provider failure and follows the pattern's failure posture
  (the adapter retries a `429` with backoff first).
- **The calibration result rests on 45 cases.** That is enough to say the provider was not
  overconfident on the three shapes measured (degree-requiring professions, destructive
  tool calls, personal attacks), and no more: it is not a reliability curve, so a threshold
  is a policy choice, not a guaranteed error rate.
- **The 121-option result was an easy discrimination.** The distractors were plainly
  irrelevant. The untested risk is semantically **overlapping** labels, not their count.
- **Isolated-call latency above ~400 ms was never the provider.** Slower figures seen in
  early measurement runs were queueing in the measuring harness at unbounded concurrency.

---

## Validation codes

Errors unless marked (W) for a warning. Codes shared by several patterns are listed once,
under the first pattern that raises them.

**Provider entry** (`decisionProviders[]`)

| Code | When |
|---|---|
| `UNIQUE_DECISION_PROVIDER_NAME` | two entries share a `name` |
| `DECISION_PROVIDER_MISSING_CONFIG` | a required configuration key is missing for the brand |
| `DECISION_MODEL_NOT_PINNED` | `configuration.model` is a floating tag |
| `DECISION_CAPABILITY_EXCEEDS_BRAND` | `capabilities` advertises more than the brand supports |
| `DECISION_CONFIG_LIST_CANONICALIZED` (W) | `configuration` was a `[{name,value}]` list and was converted |

**`DecisionAction`** (see the [pattern page](../../spec/DecisionAction.md) for each)

| Code | When |
|---|---|
| `DECISION_ACTION_MISSING_PROVIDER` / `DECISION_PROVIDER_NOT_FOUND` | no `providerName`, or it names no entry |
| `DECISION_ACTION_LANGUAGE_UNSUPPORTED` | the service is neither nodejs nor java |
| `DECISION_MODEL_NOT_PINNED` | a floating `model`, or neither the action nor the entry pins one |
| `DECISION_STATE_MISSING` / `DECISION_NO_QUESTIONS` | nothing to decide on, or nothing asked |
| `DECISION_QUESTION_NAME_DUPLICATE` / `DECISION_QUESTION_INSTRUCTIONS_MISSING` | question names and instructions |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | the entry does not advertise the question type |
| `DECISION_CHOICE_CRITERIA_MISSING` / `DECISION_CHOICE_NO_ESCAPE_OPTION` / `DECISION_CHOICE_OVER_CEILING` | `choice` shape |
| `DECISION_SCORE_LEVELS_OUT_OF_RANGE` | a `score` outside 2-10 levels |
| `DECISION_NOUL_CRITERIA_IGNORED` (W) | `criteria` on a `noul` |
| `DECISION_THRESHOLD_OUT_OF_RANGE` / `DECISION_THRESHOLD_IN_DRIFT_BAND` | the threshold |
| `DECISION_ESCALATE_TARGET_MISSING` / `DECISION_ESCALATE_TARGET_NOT_FOUND` / `DECISION_ESCALATE_TARGET_OTHER_API` | the escalation seam; the target must be an action of the same business API |
| `DECISION_ESCALATE_TARGET_UNREACHABLE` (W) / `DECISION_LOW_CONFIDENCE_WITHOUT_THRESHOLD` (W) | a posture that can never trigger |
| `DECISION_DEFAULT_ANSWER_MISSING` / `DECISION_DEFAULT_ANSWER_NOT_AN_OPTION` | defaults |
| `DECISION_NARROWING_FILTER_FAILS_OPEN` | `liveCheck` with `failOpen` |
| `DECISION_ON_AUTHZ_SURFACE` | an authorization action reads this decision |
| `DECISION_CACHE_TTL_INVALID` | a negative `cache.ttlSeconds` |

**`FuzzyDomainFilter`**

| Code | When |
|---|---|
| `FUZZY_DOMAIN_MISSING_PROVIDER` / `DECISION_PROVIDER_NOT_FOUND` / `DECISION_MODEL_NOT_PINNED` | provider and model |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | the entry does not support `noul` |
| `DECISION_THRESHOLD_OUT_OF_RANGE` / `DECISION_THRESHOLD_IN_DRIFT_BAND` | the threshold |
| `FUZZY_DOMAIN_CARDINALITY_EXCEEDED` / `FUZZY_DOMAIN_MAX_DOMAIN_INVALID` | the ceiling |
| `FUZZY_DOMAIN_CACHE_REQUIRED` / `FUZZY_DOMAIN_CACHE_TTL_REDERIVES` (W) / `DECISION_CACHE_TTL_INVALID` | the cache |
| `DECISION_NARROWING_FILTER_FAILS_OPEN` | `onProviderError: "failOpen"` |
| `DECISION_ON_AUTHZ_SURFACE` | an authorization-bearing target, or a `condition` that reads roles, permissions or memberships |
| `FUZZY_DOMAIN_TARGET_NOT_FOUND` / `FUZZY_DOMAIN_TARGET_UNSUPPORTED` | the target is missing, an array, or not a String, Text, Enum, Integer or Short property |
| `FUZZY_DOMAIN_FILTER_NAME_DUPLICATE` | two filters of one API share a name |
| `FUZZY_DOMAIN_NOT_ON_LIST` / `FUZZY_DOMAIN_DATAVIEW_UNSUPPORTED` / `FUZZY_DOMAIN_LANGUAGE_UNSUPPORTED` | where it may not run |

**`decisionSource`**

| Code | When |
|---|---|
| `DECISION_SOURCE_MISSING_PROVIDER` / `DECISION_PROVIDER_NOT_FOUND` / `DECISION_MODEL_NOT_PINNED` | provider and model |
| `DECISION_STATE_MISSING` / `DECISION_SOURCE_QUESTION_MISSING` | nothing to decide on, or no question |
| the `DecisionAction` question codes | instructions, type support, escape option, ceiling, score levels |
| `DECISION_SOURCE_TYPE_MISMATCH` / `DECISION_SOURCE_ENUM_OPTIONS_MISMATCH` | the property cannot hold the answer |
| `DECISION_SOURCE_PROPERTY_CONFLICT` / `DECISION_SOURCE_COMPANION_COLUMN_TAKEN` | the property's shape, or a companion name already in use |
| `DECISION_THRESHOLD_OUT_OF_RANGE` / `DECISION_THRESHOLD_IN_DRIFT_BAND` | the threshold |
| `DECISION_SOURCE_RECOMPUTE_UNKNOWN_PROPERTY` / `DECISION_SOURCE_RECOMPUTE_SELF` | `recomputeOn` |
| `DECISION_SOURCE_NEVER_RECOMPUTED` (W) | no `recomputeOn` and the state reads no column |
| `DECISION_SOURCE_QUESTION_FIELD_IGNORED` (W) | `defaultAnswer` on the question |
| `DECISION_ON_AUTHZ_SURFACE` / `DECISION_SOURCE_ON_SYSTEM_OBJECT` / `DECISION_SOURCE_LANGUAGE_UNSUPPORTED` | where it may not be declared |

**`decisionGate`**

| Code | When |
|---|---|
| `AGENT_DECISION_GATE_MISSING_PROVIDER` / `DECISION_PROVIDER_NOT_FOUND` / `DECISION_MODEL_NOT_PINNED` | provider and model |
| `AGENT_DECISION_GATE_NO_QUESTIONS` | the gate asks nothing, so it can never refuse anything |
| `AGENT_DECISION_GATE_QUESTION_NOT_NOUL` | a `choice` or `score` gate question |
| `AGENT_DECISION_GATE_LANGUAGE_UNSUPPORTED` | the agent's service is neither nodejs nor java: its tool calls would run ungated |
| `DECISION_QUESTION_NAME_DUPLICATE` / `DECISION_QUESTION_INSTRUCTIONS_MISSING` / `DECISION_QUESTION_TYPE_UNSUPPORTED` / `DECISION_CHOICE_OVER_CEILING` | question shape |
| `DECISION_THRESHOLD_OUT_OF_RANGE` / `DECISION_THRESHOLD_IN_DRIFT_BAND` | the threshold, in (0, 1] |
| `AGENT_DECISION_GATE_SCOPE_CONTRADICTION` | a tool in both `appliesToTools` and `exemptTools` |
| `AGENT_DECISION_GATE_ENFORCES_NOTHING` (W) | `warn` on both postures |

**`classify` cleaning rule**: `DECISION_ON_INGEST_PATH`, the `CLEANING_CLASSIFY_*` family
(settings, target, source kind, cardinality, contiguity, column collisions, the free-text
budget and refusal, `score`, language) and `ANALYTICS_ROLLUP_GROUPBY_UNKNOWN` for a rollup
that groups by a name no rule produces, plus the shared provider, pin, threshold and
escape-option codes. See
[the classify rule's code table](big-data-and-async-flows.md#judged-columns-the-classify-rule).

**`objectModeration`**: see [Object content moderation](object-moderation.md#validation-codes).

**`contentModeration`** reuses the `OBJECT_MODERATION_*` codes with the same meaning, plus
three of its own:

| Code | When |
|---|---|
| `CONTENT_MODERATION_MESSAGE_TYPE_NOT_FOUND` | hub: a `messageTypes` entry is not a message type of the hub |
| `CONTENT_MODERATION_HANDLED_MESSAGE_TYPE` | hub: a `messageTypes` entry is processed by a HubLogic handler, which is never judged |
| `CONTENT_MODERATION_INERT_OPTION` (W) | notification: `exemptRoles` or `messageTypes` set, which a notification ignores |

### Runtime errors and log events

| Code or event | Raised by | Meaning |
|---|---|---|
| `DecisionNotConfident` (422) | `DecisionAction`, `onLowConfidence: reject` | a question answered below the threshold |
| `DecisionUnavailable` (422) | `DecisionAction`, `checkType: liveCheck` | a question came back unanswered or undecided |
| `DecisionActionProviderFailure` (log) | `DecisionAction` | the provider failed; the posture decides what follows |
| `DecisionActionEscalated` (log) | `DecisionAction` | low-confidence questions were handed to `escalateTo` |
| `FUZZY_DOMAIN_PROVIDER_FAILED` (503) | fuzzy filter, `failClosed` | the provider could not classify the missing values |
| `FUZZY_DOMAIN_CARDINALITY_EXCEEDED` | fuzzy filter | a non-Enum domain was larger than `maxDomainSize` at request time |
| `FUZZY_DOMAIN_MODEL_NOT_PINNED` | fuzzy filter | the provider entry resolves no model at runtime, so nothing can be cached |
| `DECISION_PAGE_JUDGEMENT_FAILED` (503) | judged read surface, a filter under `failClosed` (a rerank only under `failClosed`) | the page could not be judged and is not answered |
| `DecisionPageDegraded` (log) | judged read surface | a page was answered degraded, or failed closed; the log names the mode, provider, reason and counts, never a record |
| `FuzzyDomainNearThreshold` (log) | fuzzy filter | values excluded inside the dead band |
| `FuzzyDomainUndecided` (log) | fuzzy filter | values excluded because they came back undecided |
| `DecisionSourceDeferredToBackfill` (log) | `decisionSource` | a write's decision failed and was left to the backfill |
| `DecisionSourceUndecided` (log) | `decisionSource` | a write's decision came back undecided and was left to the backfill |
| `DecisionSourceBackfillUndecided` (log) | `decisionSource` | a whole backfill batch came back undecided for `credentialMissing`; that property's walk stopped for the pass |
| `DecisionSourceBackfillPass` (log) | `decisionSource` | one backfill pass and what it decided |
| `CLASSIFY_CARDINALITY_EXCEEDED` | `classify` rule | the column had more distinct values than `maxDistinctValues`; the run stopped before asking |
| `CLASSIFY_MODEL_NOT_PINNED` | `classify` rule | the provider entry resolves no pinned model at runtime, so nothing can be cached; the run stopped before asking |
| `DecisionCacheDegraded` (log) | the cache | Redis is unreachable; lookups are misses |
| `MESSAGE_MODERATION_REJECTED` | hub `contentModeration` | the sender's message was rejected and not delivered |
| `MESSAGE_MODERATION_UNAVAILABLE` (503 on REST) | hub `contentModeration` | no review row could be written; nothing was delivered, retry |
| `MODERATION_SELF_DECISION` (403) | moderation reviewer APIs | a reviewer tried to decide their own submission |
| `ModerationUndecidedHeld` (log) | moderation | a verdict came back undecided and the submission went to review |
| `MOCK_DECISION_DIRECTIVE_INVALID` | the mock | a test directive names a value the question cannot take |

---

## Worked examples

Each example is a fragment of a real blueprint; MScript is always written in the
`{ "js": ... }` form. They assume the `mainJev` provider entry from
[Setting up a provider](#setting-up-a-provider).

### Example: route a support ticket with an escalation path

A create API for `ticket` asks three questions about the incoming ticket in one request,
stores the team, urgency and refund flag, and hands only the tickets the provider is unsure
about to a language model, which re-decides the team and writes a one-line reason.

```json
{
  "basics": {
    "apiOptions": { "name": "createTicket", "crudType": "create", "dataObjectName": "ticket" },
    "authOptions": { "loginRequired": true }
  },
  "controllers": { "restSettings": { "hasRestController": true, "routePath": "/tickets" } },
  "parameters": {
    "requestParameters": [
      { "name": "subject", "type": "String", "httpLocation": "body", "required": true },
      { "name": "body",    "type": "Text",   "httpLocation": "body", "required": true }
    ]
  },
  "query": {
    "dataClauseItems": [
      { "name": "subject", "value": { "js": "this.subject" } },
      { "name": "body",    "value": { "js": "this.body" } },
      { "name": "team",    "value": { "js": "this.decisions.triage._meta.escalatedTo ? (this.decisions.triage._meta.escalationResult?.team ?? 'other') : this.decisions.triage.team.value" } },
      { "name": "urgency", "value": { "js": "this.decisions.triage.urgency.value" } },
      { "name": "isRefundRequest", "value": { "js": "this.decisions.triage.isRefundRequest.value === true" } },
      { "name": "routingNote", "value": { "js": "this.decisions.triage._meta.escalationResult?.reason ?? null" } }
    ]
  },
  "actions": {
    "decisionActions": [
      {
        "name": "triage",
        "providerName": "mainJev",
        "state": { "js": "({ subject: this.subject, body: this.body })" },
        "questions": [
          { "name": "isRefundRequest", "type": "noul",
            "instructions": "The customer is asking for money back.",
            "defaultAnswer": "false" },
          { "name": "team", "type": "choice",
            "instructions": "Which team should handle this ticket.",
            "defaultAnswer": "other",
            "criteria": [
              { "name": "billing",   "value": "Payments, invoices, refunds, plan changes" },
              { "name": "technical", "value": "Bugs, outages, error messages, integrations" },
              { "name": "account",   "value": "Login, password, profile and access problems" },
              { "name": "other",     "value": "Anything the other options do not cover" }
            ] },
          { "name": "urgency", "type": "choice",
            "instructions": "How urgent this is for the customer.",
            "defaultAnswer": "unclear",
            "criteria": [
              { "name": "whenever", "value": "No time pressure" },
              { "name": "soon",     "value": "Blocking something scheduled" },
              { "name": "now",      "value": "Blocking them right now" },
              { "name": "unclear",  "value": "The ticket does not say" }
            ] }
        ],
        "confidenceThreshold": 0.85,
        "onLowConfidence": "escalate",
        "escalateTo": "explainTicket",
        "onProviderError": "defaultAnswer",
        "cache": { "enabled": true, "ttlSeconds": 86400 }
      }
    ],
    "aiCallActions": [
      {
        "name": "explainTicket",
        "contextPropertyName": "ticketReview",
        "providerName": "mainOpenai",
        "model": "gpt-4o-mini",
        "responseFormat": "json",
        "responseSchema": "{\"type\":\"object\",\"properties\":{\"team\":{\"type\":\"string\",\"enum\":[\"billing\",\"technical\",\"account\",\"other\"]},\"reason\":{\"type\":\"string\"}},\"required\":[\"team\",\"reason\"],\"additionalProperties\":false}",
        "isArray": false,
        "promptTemplate": {
          "systemPrompt": "You route support tickets. Answer with JSON only: team is one of billing, technical, account, other; reason is one sentence a support agent will read.",
          "userPrompt": { "js": "`Subject: ${this.subject}\\n\\n${this.body}`" }
        }
      }
    ]
  },
  "workflow": {
    "create": { "afterCheckParameters": ["triage"] }
  }
}
```

What to notice:

- **Three questions, one request.** Splitting them into three actions would send the same
  ticket three times for nothing.
- **Urgency is a `choice`, not a `score`,** because "the ticket does not say" is a real
  answer and a scale has nowhere to put it. Without that escape, a `score` over `whenever` /
  `soon` / `now` works too (1-based: 1 = `whenever`).
- **`explainTicket` is not in the workflow.** The decision action calls it only when a
  question falls below 0.85, and its parsed answer is on `_meta.escalationResult`.
  Validation counts an escalation target as scheduled whenever its decision is, so it
  raises no `WORKFLOW_ACTION_UNSCHEDULED`.
- **`onProviderError: "defaultAnswer"`** files the ticket as unrouted (`other`, `unclear`,
  not a refund) when the provider is down, instead of failing the customer's request. It
  needs a `defaultAnswer` on every question (`DECISION_DEFAULT_ANSWER_MISSING`), and a
  `choice` default must be one of its option keys.
- **The cache** makes a resubmitted identical ticket free for a day. It keys on the whole
  state, so it only helps for genuinely repeated content.

### Example: a decided priority column

The same judgement as a stored column on `ticket`, so every later read is a plain indexed
query and operators can override it.

```json
{
  "basicSettings": { "name": "priority", "type": "Enum",
                     "enumOptions": ["urgent", "normal", "other"] },
  "decisionSource": {
    "providerName": "mainJev",
    "state": { "js": "({ subject: this.subject, body: this.body })" },
    "question": {
      "name": "priority",
      "type": "choice",
      "instructions": "How quickly this support ticket needs a human.",
      "criteria": [
        { "name": "urgent", "value": "something is broken for a customer right now" },
        { "name": "normal", "value": "a question or a request" },
        { "name": "other",  "value": "none of these" }
      ]
    },
    "confidenceThreshold": 0.8,
    "recomputeOn": ["subject", "body"],
    "backfillRequestsPerMinute": 30
  }
}
```

Every create decides; an update that rewrites `subject` or `body` re-decides; an update
that writes `priority` itself pins it as a manual correction. The rows a person should look
at are `priority IS NULL AND priorityDecidedAt IS NOT NULL`. When this property is added to
a table that already has rows, the backfill decides them in batches over the following
passes.

### Example: a fuzzy domain filter on a list API

A list of people that can be narrowed to "professions that need a degree" by a query
parameter. The classifier sees the few hundred distinct `profession` values, never the
people.

```json
{
  "basics": {
    "apiOptions": { "name": "listPeople", "crudType": "list", "dataObjectName": "person" },
    "authOptions": { "loginRequired": true }
  },
  "controllers": { "restSettings": { "hasRestController": true, "routePath": "/people" } },
  "parameters": {
    "requestParameters": [
      { "name": "graduateProfessionsOnly", "type": "Boolean", "httpLocation": "query", "required": false }
    ]
  },
  "query": {
    "whereClause": {
      "fuzzyDomainFilters": [
        {
          "name": "graduateProfessions",
          "condition": { "js": "this.graduateProfessionsOnly === true" },
          "targetProperty": "profession",
          "criterion": "names a profession that normally requires a completed university degree to practise",
          "providerName": "mainJev",
          "confidenceThreshold": 0.8,
          "maxDomainSize": 2000,
          "onProviderError": "failClosed",
          "cache": { "enabled": true, "keyExtra": { "js": "'criterion-v2'" } }
        }
      ]
    },
    "paginationOptions": { "defaultPageRowCount": 50 }
  }
}
```

`GET /people?graduateProfessionsOnly=true` answers people whose profession was decided at a
probability of 0.8 or more, with a `fuzzyDomainFilters` attribution in the response; without
the parameter the filter does not apply. Bumping `keyExtra` to `'criterion-v3'`
re-classifies the whole domain on the next request, the same as editing the criterion. To
narrow by a judgement about a **joined** object instead (for example orders whose product
category is perishable), put the same block in a joint filter's `fuzzyDomainFilters` with
`targetProperty` naming a property of the joined object.

### Example: an agent decision gate

An operations agent on the agent hub that can read and refund invoices. Every tool call
except the read is judged before it runs; a flagged or uncertain call pauses for a human
instead of executing.

```json
{
  "agentBasics": {
    "name": "billingOps",
    "description": "Answers billing questions and performs refunds on request.",
    "executionMode": "task",
    "modality": "text"
  },
  "modelSettings": {
    "providerName": "mainOpenai",
    "model": "gpt-4o-mini",
    "systemPrompt": "You help the billing team. Refund only when the user asks for a specific invoice to be refunded."
  },
  "toolSettings": {
    "apiTools": "listInvoices,refundInvoice,cancelSubscription"
  },
  "guardrails": {
    "maxToolCalls": 10,
    "inputValidation": { "js": "typeof this.request.body?.message === 'string' && this.request.body.message.length < 4000" },
    "decisionGate": {
      "providerName": "mainJev",
      "questions": [
        { "name": "irreversible", "type": "noul",
          "instructions": "This call moves money or cancels a paid service in a way that cannot be undone." },
        { "name": "beyondRequest", "type": "noul",
          "instructions": "This call affects more invoices, customers or money than the user explicitly asked for." }
      ],
      "confidenceThreshold": 0.8,
      "onGateFail": "requireApproval",
      "onProviderError": "deny",
      "exemptTools": "listInvoices"
    }
  }
}
```

Both questions ride one provider request per tool call. A refund the gate flags, or is
less than 0.8 confident about, pauses the run for approval through the agent hub's approval
API; once a person approves it, the call runs without being judged again. A provider outage
denies the call, and the model is told it was refused. While trialling the questions, set
`onGateFail` to `warn` and read the verdicts in the audit trail before enforcing.

### Example: moderating what users write

To hold user content until it is accepted, no `DecisionAction` is needed: enable the block
on the object and every create and update API of that object is moderated.

```json
{
  "objectSettings": {
    "basicSettings": { "name": "listing" },
    "objectModeration": {
      "enabled": true,
      "providerName": "mainJev",
      "policy": "Listings must describe a real item for sale; no contact details, no offensive language.",
      "moderatedProperties": ["title", "description"],
      "reviewerRoles": ["moderator"]
    }
  }
}
```

The complete blueprint, with the reason-writing agent, the review APIs and the `onPlace`
mode, is in
[Object content moderation](object-moderation.md#the-whole-blueprint-end-to-end). The same
block, named `contentModeration`, on a realtime hub judges every message a user sends
before the room sees it:

```json
{
  "hubBasics": { "name": "chat" },
  "messageSettings": { "messageTypes": ["text", "image"] },
  "contentModeration": {
    "enabled": true,
    "providerName": "mainJev",
    "policy": "No insults, no spam, no contact details.",
    "messageTypes": ["text"],
    "exemptRoles": ["moderator"],
    "reviewerRoles": ["moderator"]
  }
}
```

---

## Developing without a key

Declare a provider with `"provider": "mock"` (see
[Setting up a provider](#setting-up-a-provider)). The mock is a real transport that answers
all three question types **deterministically** from the seed, the state and the question,
needs no credential and never reaches the network. A generated test can assert on a
decision, and a build never blocks on a missing key. Its drift band is 0, so any threshold
passes the drift-band check.

A credentialed entry whose key is missing does **not** behave like this mock. It falls back
to a stand-in that answers every question
[undecided](#every-question-can-come-back-undecided) (`credentialMissing`), so a deployment
with no key keeps running, takes every pattern's undecided path, and never acts on an
invented decision. To test real decision branches without a key, declare the `mock` brand.

**Steering the mock in a test.** A hash cannot be told to answer `reject`, so the mock
honours a directive written into any string of the state:

```text
[[mock-decision team=billing]]
[[mock-decision team=billing@0.6]]      a confidence below the threshold, to drive escalate or review
[[mock-decision *=no]]                  every question of the request
[[mock-decision team=undecided]]        an undecided answer (reason mockDirective), any question type
```

The value must be one the question can take: an option key for a `choice`, a level on the
1..n scale for a `score`, a probability or `yes` / `no` for a `noul`, or `undecided` for
any type (which takes no `@confidence`; a `choice` option literally named `undecided`
cannot be dictated). Anything else is refused with `MOCK_DECISION_DIRECTIVE_INVALID` rather
than silently replaced by the hash. Directives are honoured only in a non-production
deployment, and never by a real provider or the missing-credential stand-in, so content
cannot steer its own decision in production.

---

A `DecisionQuestion` has no `bindTo` field: it never performed a write, so remove it from
existing question definitions. Map workflow results explicitly from
`this.decisions.<actionName>.<questionName>.value` through the existing result and
data-clause mapping. For write-time materialization use `DataProperty.decisionSource`,
which stores the decision, confidence and model.

## Limits: what is not here yet

- **Other languages and unported surfaces.** Java supports the decision-family surfaces
  listed above, including staged content-model editorial moderation. Other unported
  languages retain their `*_LANGUAGE_UNSUPPORTED` gates. Free-text and score classify
  questions remain refused in both nodejs and Java.
- **Binding C beyond the event-stream read surface.** A judged page is built in only for a
  `latestN` read surface of an event stream, on nodejs and rust. The list APIs, the
  `currentState` and `analyticsRollup` surfaces and the other languages have no judged
  page: on a list API, implement a re-rank with a `DecisionAction` whose `state` is the
  page.
- `DecisionAction` and moderation use a cancellable adapter deadline. State MScript and
  Redis access are outside that adapter deadline. `decisionSource` retains its existing
  5000 ms source budget when `timeoutMs` is absent.
- **The direct `send*Action`s** of a business API are not moderated (content-model writes
  are, through `contentModeration`, staged mode only).
- **Free-text `classify`** in an event stream is specified but not generated.

---

## See also

- [`DecisionAction`](../../spec/DecisionAction.md): the action reference, with every
  validation code
- [Object content moderation](object-moderation.md): the framework's own decision on writes
  to a data object, and (`contentModeration`) on hub messages and notification content
- [List API](../business-apis/list-api.md#fuzzy-domain-filters): where fuzzy filters sit
  among the where-clause features
- [Agent hub](../system-services/agent-hub.md#decision-gate-over-tool-calls): the tool loop
  the decision gate sits in
- [Property types](../data-modeling/property-types.md): the columns a `decisionSource` can
  fill
- [`AiCallAction`](../../spec/AiCallAction.md) and
  [`AgentCallAction`](../../spec/AgentCallAction.md): when you need prose, or the reason
  behind a verdict
- [Compute layer](compute-layer.md): `ai-inference` runs a **local trained** classifier; the
  decision layer is the remote, zero-shot alternative when you have no trained model
