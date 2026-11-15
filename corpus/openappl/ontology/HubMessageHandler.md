# HubMessageHandler

**Level:** `subsection` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubMessageHandler in Part 2](../spec/HubMessageHandler.md)

Intercepts a specific custom message type and routes it through an MScript before broadcast. The script receives the message, sender session, room record, and service library, and returns an object controlling accept/reject, broadcast targets, message modifications, persistence, and server-generated messages. Use for game moves, bids, collaborative edits, or any message that needs server-side validation or state management.

## Contained in

- [HubLogic](./HubLogic.md) as `messageHandlers` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
