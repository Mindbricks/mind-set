# JobStreamAccess

**Level:** `section` · **Family:** [JobStream](./families.md#jobstream) (domain `Service`)

**Specification:** [JobStreamAccess in Part 2](../spec/JobStreamAccess.md)

The authorization config of a JobStream (section). A JobStream emits three raw routes — enqueue, durable SSE observation and snapshot — and suppresses the target BusinessApi's public route, so these routes are the only way to run the target and the only way to read what it produced. Without this section they authorized nothing and a job id acted as a bearer capability over the job's input, result and error. `enqueueAccess` decides who may create a job (inheriting the target api's own `authOptions` by default); every job is then bound to the creating principal + tenant, and observation/snapshot require that binding unless `observerRoles`/`observerPermission` grant a stream-wide privileged read.

## Contained in

- [JobStream](./JobStream.md) as `access`

Blueprint paths:

- `services.jobStreams.access`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
