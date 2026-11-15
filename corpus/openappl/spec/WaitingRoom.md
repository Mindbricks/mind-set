# WaitingRoom

**Level:** `chapter` · **Family:** [WaitingRoom](../ontology/families.md#waitingroom) (domain `Service`)

**Ontology:** [WaitingRoom in Part 1](../ontology/WaitingRoom.md)

**Name:** an instance is named by `roomBasics.name`.

A PULL-mode admission-control queue pattern (docs/ADR-async-job-orchestration-patterns.md, the WaitingRoom section) — the Taylor-Swift-ticketing turnstile. A `WaitingRoom` meters a thundering herd through N gated Redis `rooms` so a bound **public** BusinessApi is never stampeded: clients join the room (a Redis sorted-set keyed by arrival/fairness), see a live `position` over the room's OWN realtime channel, and a metered cron-promoter advances front-of-room → next room → final admission at each room's `admissionRatePerSecond`. When admitted the room mints a one-shot, time-boxed `QueToken` (Redis-backed, single-use, queue-scoped) and the CLIENT calls the target BusinessApi DIRECTLY with it. CONTRAST `JobStream` (push): a WaitingRoom does NOT hide or proxy the target — the target BusinessApi keeps its public REST/SSE/WS route and merely GAINS the `QueToken` gate (`authOptions.queueTokenRequired: <waitingRoomName>`), an additional M2M-parity check beyond login. From ONE declaration codegen emits: a join edge (ZADD into room 0 + return a waiter handle), the metered promoter, the position realtime channel, the admission token-mint, and the Redis one-shot `QueToken` verify the gated target consumes. The position channel is SEPARATE from the target API's own event channel.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `roomBasics` | [`WaitingRoomBasics`](./WaitingRoomBasics.md) | yes |  |  |  | The waiting room's scalar identity + global policy (WaitingRoomBasics): name/codeName/description, the fairness policy (fifo default \| randomizedDraw to defeat bots), and the abandonment TTL (a waiter who stops heart-beating / idles past it is dropped from its Redis room so it stops holding a slot). Grouped into a section because a chapter is a container of sections, not loose scalar columns (the ComputeJob.jobBasics idiom). |
| `rooms` | [`WaitingRoomStages`](./WaitingRoomStages.md) | yes |  |  |  | The staged admission gates (WaitingRoomStages): an ordered list of N rooms (`stages`), each with an `admissionRatePerSecond` (the CEILING the adaptive metered promoter drains that room's front at), an optional `minAdmissionRatePerSecond` floor, and an optional `capacity`. The promoter advances front-of-room 0 → room 1 → … → final admission, each hop rate-limited by the destination room's rate — and it is CLOSED-LOOP: under DB saturation an internal PI controller backs each room's effective rate off toward its floor, recovering to the ceiling as the database recovers (`WAITINGROOM_ADAPTIVE_DISABLED=true` reverts to a static ceiling drain). REQUIRED — a WaitingRoom with no room has no gate to meter. |
| `token` | [`QueTokenSettings`](./QueTokenSettings.md) | no |  |  |  | The admission token config (QueTokenSettings): the one-shot, time-boxed `ttlSeconds` and Redis-backed single-use semantics of the `QueToken` minted when a waiter reaches final admission. The token is queue-scoped (only valid for THIS room's bound target) and, when `singleUse` is true (the default), consumed on first use by the target's `QueToken` gate. Null = a single-use token with the default TTL. |
| `targetApi` | [`WaitingRoomTargetBinding`](./WaitingRoomTargetBinding.md) | yes |  |  |  | Binds the PUBLIC BusinessApi this room fronts (WaitingRoomTargetBinding): the target's `api` name (a businessLogic[] BusinessApi in THIS service) + the `action`. UNLIKE JobStream, the binding does NOT suppress the target — the target KEEPS its public route and GAINS the `QueToken` gate (the client calls it directly with the minted token). REQUIRED — a WaitingRoom with no target has nothing to admit clients to. |
| `positionChannel` | [`WaitingRoomPositionChannel`](./WaitingRoomPositionChannel.md) | no |  |  |  | The room's OWN realtime/SSE position channel config (WaitingRoomPositionChannel): the channel/event name clients subscribe to for live position (ZRANK) + admission ("you're in, here is your token") updates. This is SEPARATE from the target BusinessApi's own event channel — it carries queue lifecycle only. Null = a sensible-default SSE position channel named after the room. |

## Constraints

Property rules:

- `roomBasics`, `rooms`, `targetApi` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `WAITINGROOM_NO_ROOMS` | error | WaitingRoom "…" must declare at least one room (rooms.stages is empty) — a metered queue needs a gate to throttle. |
| `WAITINGROOM_ROOM_RATE_INVALID` | error | WaitingRoom "…" room … admissionRatePerSecond must be a positive number. |
| `WAITINGROOM_TARGET_API_MISSING` | error | WaitingRoom "…" targetApi must reference a BusinessApi by name (api). |
| `WAITINGROOM_TARGET_API_UNKNOWN` | error | WaitingRoom "…" targetApi.api "…" does not match any businessLogic[].basics.apiOptions.name in this service. |
