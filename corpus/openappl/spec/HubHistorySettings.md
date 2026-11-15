# HubHistorySettings

**Level:** `section` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubHistorySettings in Part 1](../ontology/HubHistorySettings.md)

Controls whether message history is sent to clients when they join a room. When enabled, the server queries the message DataObject for the most recent messages and emits them as a 'hub:history' event immediately after join confirmation.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `historyEnabled` | `Boolean` | no | `true` |  |  | When true, sends the most recent messages to a client when they join a room. Requires autoDataObject to be true in messageSettings. |
| `historyLimit` | `Integer` | no | `50` |  |  | Number of most recent messages to send when a client joins a room. Default: 50. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
