# JobStreamBasics

**Level:** `section` · **Family:** [JobStream](./families.md#jobstream) (domain `Service`)

**Specification:** [JobStreamBasics in Part 2](../spec/JobStreamBasics.md)

Defines a job stream's identity, work topic, partition key and enqueue input schema. The job stream's scalar identity + axes (section): name/codeName/description, the Kafka job (work) topic, the optional `partitionKey` for worker consumer-group parallelism, and the enqueue `inputSchema` (the fields the enqueue edge accepts, mapped onto the target API input).

## Contained in

- [JobStream](./JobStream.md) as `streamBasics`

Blueprint paths:

- `services.jobStreams.streamBasics`

## Contains

- `inputSchema`: [JobStreamInputField](./JobStreamInputField.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
