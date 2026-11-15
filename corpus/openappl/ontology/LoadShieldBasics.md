# LoadShieldBasics

**Level:** `section` · **Family:** [LoadShield](./families.md#loadshield) (domain `Service`)

**Specification:** [LoadShieldBasics in Part 2](../spec/LoadShieldBasics.md)

Defines a load shield's identity, enabled flag and target queue latency. The load shield's scalar identity + global policy (section): name/codeName/description, the `enabled` on/off flag (default true) and the ONLY tunable — the CoDel-style `targetQueueLatencyMs` queue-wait setpoint. Everything else about the shedder (PID gains, cohort count and rotation, queue capacity, CoDel interval, Retry-After clamps, the concurrency cap) is an internal platform constant, deliberately NOT blueprint surface (ADR D6 — the Cinnamon zero-config property).

## Contained in

- [LoadShield](./LoadShield.md) as `shieldBasics`

Blueprint paths:

- `services.loadShield.shieldBasics`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
