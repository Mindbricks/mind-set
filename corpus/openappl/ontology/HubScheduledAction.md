# HubScheduledAction

**Level:** `subsection` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubScheduledAction in Part 2](../spec/HubScheduledAction.md)

A recurring action that runs on an interval for each active room. The script is called every intervalMs milliseconds and can return serverMessages to broadcast. The interval starts when the first user joins the room and stops when the last user disconnects, unless keepAlive is true. Use for game world ticks, NPC movement, countdown timers, or periodic state sync.

## Contained in

- [HubLogic](./HubLogic.md) as `scheduledActions` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
