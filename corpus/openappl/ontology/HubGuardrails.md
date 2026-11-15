# HubGuardrails

**Level:** `section` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubGuardrails in Part 2](../spec/HubGuardrails.md)

Safety limits, rate controls, moderation settings, and caching for the hub. Prevents resource exhaustion, abuse, and oversized payloads. All values have sensible defaults but should be tuned for production use cases. Not every field is enforced on every runtime: see maxUsersPerRoom and connectionTimeout.

## Contained in

- [RealtimeHub](./RealtimeHub.md) as `guardrails`

Blueprint paths:

- `services.realtimeHubs.guardrails`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
