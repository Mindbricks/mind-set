# DecisionCacheSettings

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [DecisionCacheSettings in Part 2](../spec/DecisionCacheSettings.md)

Caching for a DecisionAction or a FuzzyDomainFilter - both use the ONE decision cache of the decision layer, stored in the service's Redis. Here caching is not only an optimisation: the provider's probability is not reproducible across identical requests, so a stored decision is what keeps a boundary case from moving between runs.

## Contained in

- [DecisionAction](./DecisionAction.md) as `cache`
- [FuzzyDomainFilter](./FuzzyDomainFilter.md) as `cache`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
