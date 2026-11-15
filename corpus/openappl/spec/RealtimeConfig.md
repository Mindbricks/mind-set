# RealtimeConfig

**Level:** `section` · **Family:** [ServiceSettings](../ontology/families.md#servicesettings) (domain `Service`)

**Ontology:** [RealtimeConfig in Part 1](../ontology/RealtimeConfig.md)

Service-level configuration for the Socket.IO server powering realtime hubs. Only active when the service has at least one RealtimeHub. Controls the scaling adapter, heartbeat timings, and connection limits.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `adapter` | `HubScalingAdapter` | no | `"redis"` | `redis`, `memory` |  | The Socket.IO adapter for multi-instance scaling. Use 'redis' for production (broadcasts events across instances via Redis pub/sub) or 'memory' for single-instance development. |
| `heartbeatInterval` | `Integer` | no | `25000` |  |  | How often the Socket.IO server sends heartbeat pings to connected clients, in milliseconds. Default: 25000 (25 seconds). |
| `heartbeatTimeout` | `Integer` | no | `20000` |  |  | How long the server waits for a heartbeat response before considering the client disconnected, in milliseconds. Must be less than heartbeatInterval. Default: 20000 (20 seconds). |
| `maxConnectionsPerUser` | `Integer` | no | `10` |  |  | Maximum number of concurrent Socket.IO connections allowed per authenticated user. Prevents resource exhaustion from excessive client connections. Default: 10. |

## Constraints

Property rules:

- `adapter` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
