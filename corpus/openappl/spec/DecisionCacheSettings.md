# DecisionCacheSettings

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [DecisionCacheSettings in Part 1](../ontology/DecisionCacheSettings.md)

Caching for a DecisionAction or a FuzzyDomainFilter - both use the ONE decision cache of the decision layer, stored in the service's Redis. Here caching is not only an optimisation: the provider's probability is not reproducible across identical requests, so a stored decision is what keeps a boundary case from moving between runs.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | yes |  |  |  | When true, an identical (provider, pinned model, instructions, criteria, state) tuple reuses a stored DECISION instead of re-asking. Caching is what makes the query-time form (A) affordable and it is also a CORRECTNESS mechanism here: the probability drifts across identical requests, so re-deriving a boundary case answers differently on different days. Default false. |
| `ttlSeconds` | `Integer` | no |  |  |  | Lifetime of a cached decision in seconds. Null = no expiry (invalidate by key change only). |
| `keyExtra` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript appended to the cache key for a dimension the framework cannot see (tenant, locale, a policy version). The key ALWAYS includes the pinned model version, the instructions text and the criteria: omit any of those and a designer corrects a criterion, re-runs, sees the old answer and concludes the criterion did not matter (DECISION_CACHE_KEY_INCOMPLETE guards the framework-built half). |

## Constraints

Property rules:

- `enabled` must be present. (`REQUIRED_FIELD_MISSING`)
