# LoadShieldTiers

**Level:** `section` · **Family:** [LoadShield](./families.md#loadshield) (domain `Service`)

**Specification:** [LoadShieldTiers in Part 2](../spec/LoadShieldTiers.md)

The shield's per-API/action shed-priority policy (section): the `assignments` list of `LoadShieldTierAssignment` entries. Lives ON the shield so the whole priority policy is reviewable in one place — the ARCHITECT'S OVERRIDE VIEW. An API may ALSO state its own importance locally (`basics.apiOptions.loadShedTier` on a BusinessApi, `edgeControllerOptions.loadShedTier` on an edge controller — the eventStream `loadSheddingPriority` idiom). PRECEDENCE, most specific wins: central action-narrowed assignment > central api-level assignment > per-API `loadShedTier` > derived default by action nature (ADR D2). Empty/absent assignments = per-API values and derived defaults apply; a service WITHOUT a shield ignores every tier surface entirely.

## Contained in

- [LoadShield](./LoadShield.md) as `tiers`

Blueprint paths:

- `services.loadShield.tiers`

## Contains

- `assignments`: [LoadShieldTierAssignment](./LoadShieldTierAssignment.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
