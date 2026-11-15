# HubLogic

**Level:** `section` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubLogic in Part 2](../spec/HubLogic.md)

Server-side logic hooks for the hub. Allows intercepting custom message types with MScript before broadcast, fetching room state on join or on demand, and running scheduled actions on an interval. MScript hooks can call service library functions, Redis, DB, Business APIs, or external services -- the hub just provides the hook points and acts on the return values. Intercepted messages are queued per-room to prevent race conditions.

## Contained in

- [RealtimeHub](./RealtimeHub.md) as `hubLogic`

Blueprint paths:

- `services.realtimeHubs.hubLogic`

## Contains

- `messageHandlers`: [HubMessageHandler](./HubMessageHandler.md), a list
- `scheduledActions`: [HubScheduledAction](./HubScheduledAction.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
