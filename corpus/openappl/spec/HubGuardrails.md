# HubGuardrails

**Level:** `section` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubGuardrails in Part 1](../ontology/HubGuardrails.md)

Safety limits, rate controls, moderation settings, and caching for the hub. Prevents resource exhaustion, abuse, and oversized payloads. All values have sensible defaults but should be tuned for production use cases. Not every field is enforced on every runtime: see maxUsersPerRoom and connectionTimeout.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `maxUsersPerRoom` | `Integer` | no | `1000` |  |  | Maximum number of concurrent users allowed in a single room. Enforced only by the Java ('Room is at capacity') and Python ('Room is full') runtimes, which reject a join over the cap; the Node.js, .NET and Go runtimes never check it, so their rooms are uncapped. Default: 1000. |
| `maxRoomsPerUser` | `Integer` | no | `50` |  |  | Maximum number of rooms a single user can be joined to simultaneously. Prevents memory exhaustion from users joining too many rooms. Default: 50. |
| `messageRateLimit` | `Integer` | no | `60` |  |  | Maximum number of messages a single user can send per minute across all rooms; hub:send and the REST send share the budget. A message over the limit is refused ('Rate limit exceeded', REST 429) until older messages leave the sliding 60-second window. The Node.js runtime counts per service instance. Default: 60. |
| `maxMessageSize` | `Integer` | no | `65536` |  |  | Maximum message payload size. A hub:send frame or REST send body whose JSON text is longer is rejected ('Message too large', REST 413); the Node.js runtime counts characters of the whole frame, and its Socket.IO transport also drops any frame over 1 MB. Default: 65536 (64 KB). |
| `connectionTimeout` | `Integer` | no | `300000` |  |  | Not enforced: no runtime reads this value, so an idle connection is never disconnected for inactivity. In the Node.js runtime a dead connection is dropped by the Socket.IO heartbeat, which serviceSettings.realtimeConfig.heartbeatInterval and heartbeatTimeout configure. Kept so stored blueprints stay valid. Default: 300000 (5 minutes). |
| `authCacheTTL` | `Integer` | no | `300` |  |  | Time-to-live in seconds for the Redis auth cache. After a user's authorization for a room is resolved, the resulting hubRole name is cached in Redis. Subsequent joins and REST calls for that room within the TTL skip the role checks (absoluteRoles, checkRoles, checkScript, authSources, authScripts); the room, eligibility and block checks still run, and a block or unblock clears the entry. 0 disables caching only on the .NET and Java runtimes; the Node.js and Python runtimes read 0 as the default 300. Default: 300 (5 minutes). |
| `globalModeration` | `Boolean` | no | `false` |  |  | When true, ALL messages in the hub require moderator approval before being broadcast, regardless of the sender's hubRole. When false, only messages from roles with 'moderated: true' go through moderation. Messages a hubLogic messageHandler processes and server or system messages are never held. Default: false. |
| `defaultSilenced` | `Boolean` | no | `false` |  |  | When true, all users join rooms in a silenced state (canSend overridden to false) regardless of their hubRole. Users with canModerate permission are exempt. Other users must request speak permission (`hub:requestSpeak`), which a moderator can grant (`hub:grantSpeak`). In the Node.js runtime a grant lives on the user's connected sockets only: it is lost on reconnect or re-join, and the REST send stays refused. Useful for webinar/classroom/town-hall scenarios. Default: false. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
