# JobStreamState

**Level:** `section` · **Family:** [JobStream](./families.md#jobstream) (domain `Service`)

**Specification:** [JobStreamState in Part 2](../spec/JobStreamState.md)

Configures a job stream's durable status record and result link. The durable job record config of a JobStream (section): the `store` backing the status lifecycle (queued→started→[progress]→ended; DB by default) and `resultLinkField` — the field on the `ended` event that carries the result reference/link the frontend navigates to.

## Contained in

- [JobStream](./JobStream.md) as `jobState`

Blueprint paths:

- `services.jobStreams.jobState`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
