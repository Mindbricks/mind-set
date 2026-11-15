# LoadShieldExemptions

**Level:** `section` · **Family:** [LoadShield](./families.md#loadshield) (domain `Service`)

**Specification:** [LoadShieldExemptions in Part 2](../spec/LoadShieldExemptions.md)

Names APIs that bypass the load shield entirely. The shield's escape hatch (section): `apis[]` names routes that bypass the shield ENTIRELY — never queued, never shed, not even counted against a tier — for the rare route that cannot be expressed as tier 0 (e.g. a third-party webhook whose caller retries destructively). Prefer an explicit tier over an exemption: an exempted route gives the adaptive controller nothing to work with. Each name must resolve to a declared BusinessApi or edge controller (LOADSHIELD_TARGET_UNKNOWN otherwise).

## Contained in

- [LoadShield](./LoadShield.md) as `exemptions`

Blueprint paths:

- `services.loadShield.exemptions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
