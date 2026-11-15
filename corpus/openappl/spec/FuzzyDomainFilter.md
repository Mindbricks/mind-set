# FuzzyDomainFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [FuzzyDomainFilter in Part 1](../ontology/FuzzyDomainFilter.md)

**Name:** an instance is named by `name`.

Narrows a list API by a judgement no column holds, by classifying the DISTINCT VALUES of one column with a decision provider, never the rows (ADR binding point A). Example: 'people whose profession requires a university education'. Each distinct value is decided ONCE as a noul against `criterion` and cached; the values whose probability reaches `confidenceThreshold` are merged into the where clause as `targetProperty IN (...)`. The cost is independent of the row count: a cold cache asks at most one decision per distinct value (batched, id-addressed, several hundred per request), a warm cache asks none. The cache is the AUTHORITY (no TTL by default): the provider's probability drifts across identical requests while its decision holds, so a value decided once stays decided until the criterion, the model or the provider changes. A value whose probability lands within the brand's dead band of the threshold (half of `probabilityDriftBand` each side: 0.1 for typesafe, 0 for mock) is EXCLUDED and logged as FuzzyDomainNearThreshold rather than silently classified either way. The filter fails CLOSED: a provider outage is an error (or the empty set under `matchNothing`), never the unfiltered set. Responses it narrowed carry `fuzzyDomainFilters` attribution (filter, property, provider, model, criterionHash, threshold). Never an authorization surface (DECISION_ON_AUTHZ_SURFACE). List APIs only, implemented for nodejs, java and dotnet.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A code-safe name for the filter, unique within the Business API. It names the filter in the response attribution and in logs. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript gating whether the filter applies to this request (like ExtendedClause.condition). Null = always applied. A condition that reads the caller's roles, permissions or memberships turns the classifier into a visibility gate and is refused (DECISION_ON_AUTHZ_SURFACE). |
| `targetProperty` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The property whose distinct values are classified: a scalar property of the API's data object (in `whereClause.fuzzyDomainFilters`) or of the joined data object (in `ListJointFilter.fuzzyDomainFilters`). An Enum property's domain is its declared options and is checked against `maxDomainSize` at design time; any other property's domain is read from the store at request time and checked there. Never an authorization-bearing column (id, the tenant column, a session-bound or owner column): DECISION_ON_AUTHZ_SURFACE. |
| `criterion` | `Text` | yes |  |  |  | The statement judged about ONE value, as a noul: the probability it holds of that value. Write it about the item, e.g. 'names a profession that normally requires a completed university degree to practise'. It is part of the cache key, so editing it re-classifies the whole domain on the next request - which is the point: a corrected criterion must change the answer. |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry that classifies the values. A dangling name fails validation (DECISION_PROVIDER_NOT_FOUND). |
| `model` | `String` | no |  |  |  | The PINNED model version, overriding the provider entry's own; a floating tag is refused (DECISION_MODEL_NOT_PINNED). Null = inherit the provider entry's pin, which must then exist. The version is part of the cache key, so a model upgrade re-classifies the domain. The override reaches ordinary and joint filters; model changes classify into separate cache keys. |
| `confidenceThreshold` | `Double` | no | `0.8` |  |  | Probability at or above which a value qualifies. Default 0.8. Must sit outside the provider's `probabilityDriftBand` of 0.5 (DECISION_THRESHOLD_IN_DRIFT_BAND): for typesafe a threshold in (0.3, 0.7) is refused. Values within half the band of the threshold are excluded as near-threshold rather than flipped in and out. |
| `maxDomainSize` | `Integer` | no | `1000` |  |  | Ceiling on the distinct values this filter classifies. Default 1000, framework ceiling 5000 - set by what a designer can review and re-derive when the criterion changes, and by cost; NOT by request rate (the vendor's published request-rate limit was measured unenforced and is not a budget). Checked at design time for an Enum property (FUZZY_DOMAIN_CARDINALITY_EXCEEDED, naming the property and its cardinality) and at request time for any other, where an over-ceiling domain fails CLOSED with the same code. |
| `onProviderError` | `FuzzyDomainFailureMode` | no | `"failClosed"` | `failClosed`, `matchNothing` |  | What happens when the provider cannot answer. `failClosed` (default): the request fails with FUZZY_DOMAIN_PROVIDER_FAILED. `matchNothing`: the filter resolves to the empty set and its attribution is marked degraded. There is no fail-open: this filter narrows, and an outage that returned the unfiltered set would be a data leak (ADR rule 4). |
| `cache` | [`DecisionCacheSettings`](./DecisionCacheSettings.md) | no |  |  |  | The decision cache settings (DecisionCacheSettings). The cache is ALWAYS on for a fuzzy filter - it is what keeps the IN set from moving between requests - so `enabled: false` is refused (FUZZY_DOMAIN_CACHE_REQUIRED). `ttlSeconds` defaults to no expiry; a TTL makes every value re-derive at expiry and is warned about (FUZZY_DOMAIN_CACHE_TTL_REDERIVES). `keyExtra` adds a key dimension the framework cannot see. |

## Constraints

Property rules:

- `name`, `targetProperty`, `criterion`, `providerName` must be present. (`REQUIRED_FIELD_MISSING`)
- `onProviderError` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name`, `targetProperty`, `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DECISION_CACHE_TTL_INVALID` | error | cache.ttlSeconds must be positive or absent; … declared. |
| `DECISION_MODEL_NOT_PINNED` | error | Decision model "…" is not pinned. |
| `DECISION_NARROWING_FILTER_FAILS_OPEN` | error | A fuzzy domain filter NARROWS a list, so failing open on a provider outage returns the unfiltered set - a data leak wearing the costume of a degraded mode. |
| `DECISION_ON_AUTHZ_SURFACE` | error | The condition reads "…", so whether a caller sees the classified rows depends on who they are: the classifier becomes an authorization gate. |
| `DECISION_PROVIDER_NOT_FOUND` | error | Unknown decision provider "…". |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | error | Decision provider "…" (…) does not advertise noul questions, and a fuzzy domain filter asks one noul per value. |
| `DECISION_THRESHOLD_IN_DRIFT_BAND` | error | confidenceThreshold … sits within the … probability drift band of the 0.5 decision boundary for provider "…". |
| `DECISION_THRESHOLD_OUT_OF_RANGE` | error | confidenceThreshold must be between 0 and 1; … declared. |
| `FUZZY_DOMAIN_CACHE_REQUIRED` | error | A fuzzy domain filter cannot run uncached: the cache is the authority that keeps a value decided once decided. |
| `FUZZY_DOMAIN_CACHE_TTL_REDERIVES` | warning | cache.ttlSeconds … makes every value of the domain re-derive when its entry expires, and a value near the threshold can then land on the other side: the same list answers different rows after the expiry. |
| `FUZZY_DOMAIN_CARDINALITY_EXCEEDED` | error | maxDomainSize … is over the framework ceiling of … distinct values per fuzzy filter. |
| `FUZZY_DOMAIN_DATAVIEW_UNSUPPORTED` | error | fuzzyDomainFilters read the distinct values from the data object store; a DataView read ("…") answers from Elasticsearch and is not supported. |
| `FUZZY_DOMAIN_FILTER_NAME_DUPLICATE` | error | Duplicate fuzzy filter name "…": the name keys the response attribution. |
| `FUZZY_DOMAIN_LANGUAGE_UNSUPPORTED` | error | fuzzyDomainFilters are implemented for nodejs, java, dotnet and rust services only; this service generates …, whose builder would ignore them and return the unfiltered list. |
| `FUZZY_DOMAIN_MAX_DOMAIN_INVALID` | error | maxDomainSize must be a positive integer; … declared. |
| `FUZZY_DOMAIN_MISSING_PROVIDER` | error | FuzzyDomainFilter has no providerName. |
| `FUZZY_DOMAIN_NOT_ON_LIST` | error | fuzzyDomainFilters narrow a LIST; this api is "…". |
| `FUZZY_DOMAIN_TARGET_NOT_FOUND` | error | Property "…" does not exist on "…". |
| `FUZZY_DOMAIN_TARGET_UNSUPPORTED` | error | "…" is a framework column of "…"; a fuzzy filter classifies the values of an authored scalar property. |
