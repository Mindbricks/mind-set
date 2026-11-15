# HubLogic

**Level:** `section` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubLogic in Part 1](../ontology/HubLogic.md)

Server-side logic hooks for the hub. Allows intercepting custom message types with MScript before broadcast, fetching room state on join or on demand, and running scheduled actions on an interval. MScript hooks can call service library functions, Redis, DB, Business APIs, or external services -- the hub just provides the hook points and acts on the return values. Intercepted messages are queued per-room to prevent race conditions.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `stateScript` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript called when a user joins a room or emits 'hub:requestState'. Must return the current room state (any shape). The return value is sent to the requesting client only via 'hub:state' event. Context: 'session' (user session), 'roomId', 'room' (room DataObject record), 'lib' (service library). Example: `{ "js": "lib.chess.getState(roomId)" }`. Leave empty if the hub doesn't need state management. |
| `messageHandlers` | [`HubMessageHandler`](./HubMessageHandler.md)[] | no |  |  |  | Array of message type interceptors. When a client sends a custom message type that matches a handler, the message is NOT broadcast immediately. Instead, the handler's script is called and the return value determines accept/reject, broadcast behavior, and server-generated messages. Unmatched message types follow the standard flow (immediate broadcast + persist). Handlers are processed sequentially per room (no race conditions). |
| `scheduledActions` | [`HubScheduledAction`](./HubScheduledAction.md)[] | no |  |  |  | Array of interval-based actions that run while a room has connected users (or always if keepAlive is true). Each action calls its script on the configured interval. The script can return serverMessages to broadcast to the room. Use for game ticks, world updates, auction countdowns, or periodic state broadcasts. |

## Constraints

Property rules:

- The items of `messageHandlers` must have distinct names (`messageType`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `scheduledActions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
