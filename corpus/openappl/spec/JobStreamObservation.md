# JobStreamObservation

**Level:** `section` · **Family:** [JobStream](../ontology/families.md#jobstream) (domain `Service`)

**Ontology:** [JobStreamObservation in Part 1](../ontology/JobStreamObservation.md)

Configures reconnectable SSE observation and durable event replay for a job stream. The reconnectable observation config of a JobStream (section): the SSE `channelName` clients tail, `reconnectable` + `retainEventsSeconds` (the durable per-job outbox a reconnect replays everything-since-cursor from, by jobId), and `relayTargetApiProgress` (relay the target API's own progress events into the outbox; otherwise only started+ended are observed).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `channelName` | `String` | no |  |  |  | The SSE channel / event name the observation edge emits lifecycle frames on. Defaults to the stream name. |
| `reconnectable` | `Boolean` | no | `true` |  |  | When true (default), the per-job event outbox is retained so a refreshed SSE observation by jobId REPLAYS everything-since-cursor (queue phase OR api phase) before live-tailing — the key to closing the tab and coming back. When false, only a live tail is offered (no replay). |
| `relayTargetApiProgress` | `Boolean` | no | `false` |  |  | When true, the worker RELAYS the target BusinessApi's own SSE/progress events into the job outbox (use when the target is itself progress-emitting). When false (default), only `started` and `ended` are emitted (the target is a solid REST API). |
| `retainEventsSeconds` | `Integer` | no | `86400` |  |  | How long (seconds) the durable per-job outbox events are retained for replay-on-reconnect after the job ends. Defaults to a safe window when absent. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
