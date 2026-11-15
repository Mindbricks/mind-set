# LoadShieldBasics

**Level:** `section` · **Family:** [LoadShield](../ontology/families.md#loadshield) (domain `Service`)

**Ontology:** [LoadShieldBasics in Part 1](../ontology/LoadShieldBasics.md)

Defines a load shield's identity, enabled flag and target queue latency. The load shield's scalar identity + global policy (section): name/codeName/description, the `enabled` on/off flag (default true) and the ONLY tunable — the CoDel-style `targetQueueLatencyMs` queue-wait setpoint. Everything else about the shedder (PID gains, cohort count and rotation, queue capacity, CoDel interval, Retry-After clamps, the concurrency cap) is an internal platform constant, deliberately NOT blueprint surface (ADR D6 — the Cinnamon zero-config property).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique load-shield identifier within the service (there is at most one shield per service, so this names the shield in validation messages, generated comments and observability output). Must be a valid codeName. |
| `codeName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Optional machine code name override. Defaults to `name` when absent. |
| `description` | `Text` | no |  |  |  | Optional human-readable description of what this shield protects and why its tier policy looks the way it does. |
| `enabled` | `Boolean` | no | `true` |  |  | Whether the shield is active (default true). When false the chapter stays declared (the tier policy remains reviewable) but the generated service dispatches exactly as an unshielded service. Distinct from the LOADSHIELD_DISABLED env kill-switch, which is an ops knob, not blueprint surface. |
| `targetQueueLatencyMs` | `Integer` | no | `5` |  |  | The CoDel-style queue-wait setpoint in milliseconds — the maximum time a request should sit in the shield's priority queue before the shield considers itself congested and starts shedding from the low-priority end. The ONLY latency tunable a designer may set (a latency-tolerance intent, not a controller gain). Defaults to an internal platform constant (~5ms) when absent — leave it absent unless you have a measured reason. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name`, `codeName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
