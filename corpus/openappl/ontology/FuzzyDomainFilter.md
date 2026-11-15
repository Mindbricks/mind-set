# FuzzyDomainFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [FuzzyDomainFilter in Part 2](../spec/FuzzyDomainFilter.md)

Narrows a list API by a judgement no column holds, by classifying the DISTINCT VALUES of one column with a decision provider, never the rows (ADR binding point A). Example: 'people whose profession requires a university education'. Each distinct value is decided ONCE as a noul against `criterion` and cached; the values whose probability reaches `confidenceThreshold` are merged into the where clause as `targetProperty IN (...)`. The cost is independent of the row count: a cold cache asks at most one decision per distinct value (batched, id-addressed, several hundred per request), a warm cache asks none. The cache is the AUTHORITY (no TTL by default): the provider's probability drifts across identical requests while its decision holds, so a value decided once stays decided until the criterion, the model or the provider changes. A value whose probability lands within the brand's dead band of the threshold (half of `probabilityDriftBand` each side: 0.1 for typesafe, 0 for mock) is EXCLUDED and logged as FuzzyDomainNearThreshold rather than silently classified either way. The filter fails CLOSED: a provider outage is an error (or the empty set under `matchNothing`), never the unfiltered set. Responses it narrowed carry `fuzzyDomainFilters` attribution (filter, property, provider, model, criterionHash, threshold). Never an authorization surface (DECISION_ON_AUTHZ_SURFACE). List APIs only, implemented for nodejs, java and dotnet.

## Contained in

- [ListJointFilter](./ListJointFilter.md) as `fuzzyDomainFilters` (a list)
- [WhereClauseSettings](./WhereClauseSettings.md) as `fuzzyDomainFilters` (a list)

## Contains

- `cache`: [DecisionCacheSettings](./DecisionCacheSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
