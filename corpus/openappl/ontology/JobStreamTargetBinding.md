# JobStreamTargetBinding

**Level:** `section` · **Family:** [JobStream](./families.md#jobstream) (domain `Service`)

**Specification:** [JobStreamTargetBinding in Part 2](../spec/JobStreamTargetBinding.md)

Binds a job stream to a processing BusinessApi in the same service. Binds the processing BusinessApi a JobStream drives (section): the target `api` name (a businessLogic[] BusinessApi in THIS service) + `action`, the enqueue `inputMapping` MScript, `resultLinkField`, and `keepPublicRoute`. The binding emits a Kafka WORKER controller on the job topic and suppresses the target's public REST route unless `keepPublicRoute` is set.

## Contained in

- [JobStream](./JobStream.md) as `targetApi`

Blueprint paths:

- `services.jobStreams.targetApi`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
