---
title: Add a realtime channel
---

# Add a realtime channel

Use a `RealtimeHub` when the surface needs bidirectional, room-scoped
messaging: chat rooms, live game lobbies, collaborative editors,
presence indicators. The hub mounts a Socket.IO namespace at
`/<service>-api/hub/<hubName>` and relays the service's DataObject
changes into the rooms automatically.

> **Audience.** AI agent or human author adding live updates to an
> existing service. Assumes at least one DataObject that represents a
> "room". Declaring a hub is what turns the service's Socket.IO server
> on; there is no separate switch.

## When to reach for a hub

- Per-room broadcast: typing indicators, message timelines, voice
  recording state.
- Relaying data changes into the room ("a message was edited", "a
  member joined").
- Server-driven push without polling: live counters, leaderboards,
  game-clock ticks.

For one-shot streams from one BusinessApi to one caller (LLM token
stream, file export progress), reach for **SSE** on the BusinessApi's
`controllers.sseSettings` instead: it's a simpler surface and doesn't
require room semantics.

## Step 1: pick the room data object

A hub binds to an existing DataObject that represents the unit clients
join. For chat that's `chatRoom`; for support it might be
`supportTicket`; for games it's `match`. The hub does not own the room
table; it consumes one you already have.

```json
{
  "objectSettings": { "basicSettings": { "name": "chatRoom" } },
  "properties": [
    { "basicSettings": { "name": "title", "type": "String", "isRequired": true } },
    { "basicSettings": { "name": "isActive", "type": "Boolean", "defaultValue": true } },
    {
      "basicSettings":    { "name": "ownerId", "type": "ID", "hasRelation": true },
      "relationSettings": {
        "relationName":         "owner",
        "relationTargetObject": "user",
        "relationTargetKey":    "id"
      }
    }
  ]
}
```

A membership object (here `chatMember`, with `userId` and `chatRoomId`)
tells the hub who belongs to which room.

## Step 2: declare the hub

Append to `services[*].realtimeHubs` (the service in this recipe is named
`chat`):

```json
{
  "hubBasics": {
    "name":        "chatHub",
    "description": "Per-room chat with typing + presence."
  },
  "roomSettings": {
    "roomDataObject":  "chatRoom",
    "roomEligibility": { "js": "room.isActive == true" },
    "absoluteRoles":   ["superAdmin"],
    "authSources": [
      { "name": "roomOwner", "sourceObject": "chatRoom",   "userField": "ownerId", "roomField": "id",         "hubRole": "owner" },
      { "name": "member",    "sourceObject": "chatMember", "userField": "userId",  "roomField": "chatRoomId", "hubRole": "member" }
    ]
  },
  "hubRoles": [
    { "name": "owner",  "canRead": true, "canSend": true, "canModerate": true, "canDeleteAny": true },
    { "name": "member", "canRead": true, "canSend": true, "canModerate": false }
  ],
  "messageSettings": {
    "messageTypes": ["text", "image", "system"]
  },
  "eventSettings": {
    "enableTypingIndicator": true,
    "enablePresence":        true,
    "enableReadReceipts":    true,
    "autoBridgeDataEvents":  true
  },
  "historySettings": {
    "historyEnabled": true,
    "historyLimit":   100
  },
  "guardrails": {
    "messageRateLimit": 60,
    "maxMessageSize":   32768
  }
}
```

What this gives you:

- A Socket.IO namespace at `/chat-api/hub/chatHub` (Socket.IO path
  `/chat-api/socket.io/`) and REST routes at `/chat-api/chat-hub/:roomId/...`
  for message history, REST sends, deletes and the eligibility check.
- An auto-generated message data object (`chatHubMessage`) persisting
  every message with the chosen `messageTypes`, and the `chatHubModeration`
  store for blocks and silences.
- Standard event handlers for typing, presence, and read receipts,
  toggled by booleans in `eventSettings`.
- `autoBridgeDataEvents: true` relays every create / update / delete of
  the service's DataObjects to the room the record names, as
  `hub:<objectName>.<verb>`: `hub:chatMember.created` when a member row is
  added, `hub:chatRoom.updated` when the room is renamed. With `system` in
  `messageTypes` each relayed event is also stored as a system message.

## Step 3: connect from the client

Standard Socket.IO client; the handshake carries the session JWT in its
`auth` payload (plus `tenantCodename` in a multi-tenant project).

```js
import { io } from 'socket.io-client';

const socket = io(`${origin}/chat-api/hub/chatHub`, {
  path: '/chat-api/socket.io/',
  auth: { token: jwt }
});

// memberships do not survive a reconnect: join on every connect
socket.on('connect', () => socket.emit('hub:join', { roomId: 'room_123' }));

socket.on('hub:joined',             ({ roomId, hubRole }) => markJoined(roomId, hubRole));
socket.on('hub:history',            ({ messages }) => renderHistory(messages));
socket.on('hub:messageArrived',     ({ sender, message }) => render(sender, message));
socket.on('hub:typing',             ({ userId }) => showTyping(userId));
socket.on('hub:presence',           ({ event, user }) => updatePresence(event, user));
socket.on('hub:chatMember.created', (member) => addMember(member));
socket.on('hub:error',              ({ error, code }) => showError(error, code));
```

Outbound messages use `hub:send`, with the type's fields under `content`;
signals such as typing go through `hub:event`:

```js
socket.emit('hub:send', {
  roomId:      'room_123',
  messageType: 'text',
  content:     { body: 'hello world' }
});

socket.emit('hub:event', { roomId: 'room_123', event: 'typing' });
```

## Custom events

Beyond the standard set, declare app-specific signals in
`eventSettings.customEvents`:

```json
{
  "customEvents": [
    { "name": "cursorMove", "direction": "clientToRoom" }
  ]
}
```

A client emits `hub:event { roomId, event: "cursorMove", data: { x, y } }`
and the room's readers receive `hub:cursorMove { roomId, userId, x, y }`.
A `serverToRoom` or `serverToClient` entry generates no server code:
server-driven signals (game ticks, counters) come from
`hubLogic.scheduledActions` server messages, or from a
`eventSettings.kafkaEvents[]` entry that relays a topic (for example one a
BusinessApi publishes with a `PublishEventAction`) into the room its
`targetRoomExpression` picks, as `hub:<eventName>`.

## Authorization layers

The room authorization flow runs in this order on every join (and on every
REST call to the hub):

1. The room record is fetched; a missing room refuses the join.
2. `roomEligibility`: MScript against the room record (`room`, or the
   room object's name). If false, nobody joins (not even `absoluteRoles`).
3. A blocked user is refused.
4. A cached decision (`guardrails.authCacheTTL`) is reused.
5. `absoluteRoles`: the user gets the built-in `system` role.
6. `checkRoles`: required role allow-list (it can only refuse).
7. `checkScript`: extra predicate (it can only refuse).
8. `authSources[]` (DataObject lookups, e.g. a membership table), then
   `authScripts[]` (MScript), in order; the first match assigns the
   user's hub role. No match refuses the join.

The hub role determines what the user can do per
`hubRoles[].canRead` / `canSend` / `allowedMessageTypes` / `moderated` /
`canModerate` / `canDeleteAny` / `canManageRoom`.

## Variations

- **Game lobby**: set `messageSettings.messageTypes` to just
  `["system"]` plus custom message types handled by `hubLogic`, and
  lean on `customEvents` for player signals.
- **Support live-chat**: point `roomDataObject` at `supportTicket`,
  use `authSources` to grant the assigned agent and the ticket owner
  the `agent` and `customer` hub roles respectively.
- **Multi-tenant projects**: pass the tenant codename as
  `auth.tenantCodename` on the handshake (see
  [Multi-tenant connection](../capabilities/realtime.md#multi-tenant-connection)).

## See also

- [Realtime hub](../capabilities/realtime.md)
- Reference: [`RealtimeHub`](../../spec/RealtimeHub.md),
  [`HubEventSettings`](../../spec/HubEventSettings.md),
  [`HubRoomSettings`](../../spec/HubRoomSettings.md).
- For one-way streaming, see SSE under
  [Business APIs](../business-apis/sse-streaming.md).
