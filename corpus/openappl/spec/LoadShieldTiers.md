# LoadShieldTiers

**Level:** `section` · **Family:** [LoadShield](../ontology/families.md#loadshield) (domain `Service`)

**Ontology:** [LoadShieldTiers in Part 1](../ontology/LoadShieldTiers.md)

The shield's per-API/action shed-priority policy (section): the `assignments` list of `LoadShieldTierAssignment` entries. Lives ON the shield so the whole priority policy is reviewable in one place — the ARCHITECT'S OVERRIDE VIEW. An API may ALSO state its own importance locally (`basics.apiOptions.loadShedTier` on a BusinessApi, `edgeControllerOptions.loadShedTier` on an edge controller — the eventStream `loadSheddingPriority` idiom). PRECEDENCE, most specific wins: central action-narrowed assignment > central api-level assignment > per-API `loadShedTier` > derived default by action nature (ADR D2). Empty/absent assignments = per-API values and derived defaults apply; a service WITHOUT a shield ignores every tier surface entirely.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `assignments` | [`LoadShieldTierAssignment`](./LoadShieldTierAssignment.md)[] | no |  |  |  | The explicit tier assignments (LoadShieldTierAssignment[]). Each entry pins one API — or one action of one API — to an integer tier 0-5. Routes with no entry fall back to the API's own `loadShedTier` (apiOptions / edgeControllerOptions) when declared, then to the derived default tier (health 0, auth 1, core-object writes 2, single reads 3, lists/search/reports 4). A central assignment always wins over both (action-narrowed beats api-level); the same api+action pair may only be assigned once. |

## Constraints

Property rules:

- The items of `assignments` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
