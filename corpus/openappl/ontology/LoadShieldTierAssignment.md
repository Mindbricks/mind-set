# LoadShieldTierAssignment

**Level:** `subsection` · **Family:** [LoadShield](./families.md#loadshield) (domain `Service`)

**Specification:** [LoadShieldTierAssignment in Part 2](../spec/LoadShieldTierAssignment.md)

One explicit shed-priority assignment: `{name?, api, action?, tier}`. `name` is the assignment's asset identity (derived from `api`/`action` when absent); `api` references a `businessLogic[]` BusinessApi (by `basics.apiOptions.name`) or an edge controller (by `edgeControllerOptions.functionName`) declared in THIS service; `action` optionally narrows the assignment to one action/operation of that API; `tier` is an integer 0-5 (0 = never shed — bypasses the queue entirely; 5 = first to shed under congestion). Under saturation the runtime sheds tier 5 first, then 4, and so on — tier 0 is structurally unsheddable.

## Contained in

- [LoadShieldTiers](./LoadShieldTiers.md) as `assignments` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
