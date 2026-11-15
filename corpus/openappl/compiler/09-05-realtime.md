---
title: Realtime
---

# 9.5 Realtime

Two patterns push data to connected clients: **realtime hubs**
([`RealtimeHub`](../spec/RealtimeHub.md)), which are rooms where users exchange messages
and signals, and **event subscriptions** ([`EventSubscription`](../spec/EventSubscription.md)),
which stream bus events to clients.

## Transport

The transport is free per target language; the event vocabulary and payloads below are
the contract. The reference uses Socket.IO on its primary target, and SignalR or STOMP
over WebSocket on others.

- A compiler that does not use the reference transport **MUST** make its transport
  discoverable: the reference answers `GET <hubPath>/negotiate` with a description of
  the transport when it is not Socket.IO.
- The hub namespace is `/<serviceName>-api/hub/<hubName>`.
- The client authenticates with its session token in the handshake (`auth.token`); in a
  multi-tenant project it also sends `auth.tenantCodename`. A handshake without a valid
  session is refused.

> **To verify:** the current realtime support of each reference target (some had raw
> WebSocket or none at the last check). A compiler may refuse the realtime family in its
> profile.

## Hubs

**Rooms.** A room is a record of the hub's room object (`roomSettings.roomDataObject`). A
user joins a room after the room authorization: moderation state and eligibility, then
absolute roles, `checkRoles`, check scripts, authorization sources and scripts, which
give the user a **hub role** (`canRead`, `canSend`, allowed message types, moderated,
`canModerate`, `canDeleteAny`, `canManageRoom`) or deny. A failed moderation lookup
**MUST** deny.

**Messages** are stored in the hub's message object (`<hubName>Message` by default:
`roomId`, `senderId`, `messageType`, `content`, `timestamp`, `status`). Moderated messages
are stored `pending`, shown to moderators, and broadcast only when approved.

**Client → server events:**
`hub:join`, `hub:leave`, `hub:send`, `hub:event`, `hub:requestState`; moderators
`hub:block`, `hub:unblock`, `hub:silence`, `hub:unsilence`, `hub:approve`, `hub:reject`,
`hub:grantSpeak`, `hub:revokeSpeak`; users `hub:requestSpeak`.

**Server → client events:**
`hub:joined`, `hub:history`, `hub:state`, `hub:presence`, `hub:messageArrived`,
`hub:messagePending`, `hub:messageRejected`, `hub:messageDeleted`, `hub:blocked`,
`hub:silenced`, `hub:speakRequested`, `hub:speakGranted`, `hub:error { roomId?, error, code? }`.

**Signals** sent with `hub:event` (typing, recording, read and delivery receipts,
presence) are broadcast to the room as `hub:<event>` when the hub's event settings
enable them, and are never stored.

**Data events.** With `autoBridgeDataEvents` (default on), changes to the service's data
objects are relayed to the room the record belongs to as
`hub:<objectName>.<created|updated|deleted>`. A hub can also bridge any bus topic
(`kafkaEvents[]`) to `hub:<eventName>`.

> Generated table goes here (S9): the hub event catalogue with payload shapes and error
> codes.

**REST routes per hub** (same room authorization): `GET /<hub>/:roomId/messages`,
`POST /<hub>/:roomId/messages`, `DELETE /<hub>/:roomId/messages/:messageId`,
`GET /<hub>/:roomId/eligible`. A store failure **MUST** answer 5xx, never an empty page.

## Event subscriptions

An event subscription streams chosen bus topics to clients, over WebSocket or SSE
(`basics.transport`).

- WebSocket: namespace `/<serviceName>-api/events/<name>`; the client sends
  `subscribe { topics }` and `unsubscribe`; the server sends `subscribed`, `unsubscribed`,
  `event` and `error`.
- SSE: `GET /events/<name>/stream?topics=a,b`; the first frame is
  `event: subscribed` with `{ topics, rejected }`. No topics: **400**; no authorised topic:
  **403**.
- Each event is authorised per client from the object's access level, the record's owner
  and tenant markers, and the subscription's scripts; a failing script drops the event.
- Delivery is not buffered per client. Clients load state over REST after `subscribed`
  and apply events idempotently.
