# LoadShieldExemptions

**Level:** `section` · **Family:** [LoadShield](../ontology/families.md#loadshield) (domain `Service`)

**Ontology:** [LoadShieldExemptions in Part 1](../ontology/LoadShieldExemptions.md)

Names APIs that bypass the load shield entirely. The shield's escape hatch (section): `apis[]` names routes that bypass the shield ENTIRELY — never queued, never shed, not even counted against a tier — for the rare route that cannot be expressed as tier 0 (e.g. a third-party webhook whose caller retries destructively). Prefer an explicit tier over an exemption: an exempted route gives the adaptive controller nothing to work with. Each name must resolve to a declared BusinessApi or edge controller (LOADSHIELD_TARGET_UNKNOWN otherwise).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `apis` | `String`[] | no |  |  |  | Names of the APIs that bypass the shield entirely — each a `businessLogic[].basics.apiOptions.name` BusinessApi or an `edgeControllers[].edgeControllerOptions.functionName` edge controller declared in THIS service. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
