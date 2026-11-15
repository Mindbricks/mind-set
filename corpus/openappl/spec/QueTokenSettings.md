# QueTokenSettings

**Level:** `section` · **Family:** [WaitingRoom](../ontology/families.md#waitingroom) (domain `Service`)

**Ontology:** [QueTokenSettings in Part 1](../ontology/QueTokenSettings.md)

The admission token config of a WaitingRoom (section): the one-shot, time-boxed `ttlSeconds` and Redis-backed `singleUse` semantics of the QueToken minted when a waiter reaches final admission. The token is queue-scoped (only valid for this room's bound target) and consumed on first use by the target's QueToken gate.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `ttlSeconds` | `Integer` | no | `300` |  |  | The time-box (seconds) of the one-shot QueToken minted on final admission: the admitted client must call the bound target BusinessApi within this window or the token expires (the Redis key TTLs out) and the client must re-queue. Keep it short enough to deter token resale/sharing, long enough for a real checkout. Defaults to a sensible short window when absent. |
| `singleUse` | `Boolean` | no | `true` |  |  | When true (default), the token is consumed on first use — the target's QueToken gate atomically deletes the Redis key on a successful check, so a replay is rejected (true one-shot). When false, the token is reusable until its TTL expires (a session pass rather than a one-shot ticket). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
