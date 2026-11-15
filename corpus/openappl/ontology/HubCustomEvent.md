# HubCustomEvent

**Level:** `subsection` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubCustomEvent in Part 2](../spec/HubCustomEvent.md)

Declares an app-specific event that clients emit within the hub, for signals like game actions, cursor positions or custom notifications. A client sends `hub:event` `{ roomId, event: '<name>', data }` and room members receive `hub:<name>` `{ roomId, userId, ...data }`. The declaration is informational: the runtime relays undeclared event names the same way, does not validate the payload, and never persists custom events. There is no server-side emitter for custom events; server traffic reaches rooms through hubLogic server messages, kafkaEvents or the auto-bridge.

## Contained in

- [HubEventSettings](./HubEventSettings.md) as `customEvents` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
