# HubScheduledAction

**Level:** `subsection` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubScheduledAction in Part 1](../ontology/HubScheduledAction.md)

**Name:** an instance is named by `name`.

A recurring action that runs on an interval for each active room. The script is called every intervalMs milliseconds and can return serverMessages to broadcast. The interval starts when the first user joins the room and stops when the last user disconnects, unless keepAlive is true. Use for game world ticks, NPC movement, countdown timers, or periodic state sync.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique identifier for this scheduled action. Used for logging and lifecycle management. |
| `intervalMs` | `Integer` | no | `1000` |  |  | Interval in milliseconds between script invocations. Example: 1000 for a 1-second game tick, 60000 for a 1-minute cycle. Minimum recommended: 100ms. |
| `keepAlive` | `Boolean` | no | `false` |  |  | When true, the scheduled action keeps running even when no users are connected to the room. Use for game worlds that need to evolve independently of player presence. When false (default), the action starts on the first join and stops on the last disconnect. |
| `script` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript called on each interval tick. Context: 'roomId', 'room' (room DataObject record), 'lib' (service library). Must return an object: { serverMessages?: [{ type: String, content: Object, to: 'all'\|String[], persist?: Boolean }] }. Example: `{ "js": "lib.world.tick(roomId)" }`. |

## Constraints

Property rules:

- `name`, `script` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

## Example

Use to run a recurring server-side tick per active realtime room — game world updates, countdown timers, NPC movement, periodic state sync — returning serverMessages to broadcast each interval.

```json
{
  "name": "worldTick",
  "intervalMs": 1000,
  "keepAlive": false,
  "script": { "js": "lib.world.tick(roomId)" }
}
```
