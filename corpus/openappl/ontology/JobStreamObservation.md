# JobStreamObservation

**Level:** `section` · **Family:** [JobStream](./families.md#jobstream) (domain `Service`)

**Specification:** [JobStreamObservation in Part 2](../spec/JobStreamObservation.md)

Configures reconnectable SSE observation and durable event replay for a job stream. The reconnectable observation config of a JobStream (section): the SSE `channelName` clients tail, `reconnectable` + `retainEventsSeconds` (the durable per-job outbox a reconnect replays everything-since-cursor from, by jobId), and `relayTargetApiProgress` (relay the target API's own progress events into the outbox; otherwise only started+ended are observed).

## Contained in

- [JobStream](./JobStream.md) as `observation`

Blueprint paths:

- `services.jobStreams.observation`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
