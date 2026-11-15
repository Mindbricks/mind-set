# BusinessApiControllers

**Level:** `chapter` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [BusinessApiControllers in Part 2](../spec/BusinessApiControllers.md)

Transport bindings of a `BusinessApi` (section): the optional REST, gRPC, Kafka, SSE, cron and internal-call controller settings that expose the API. Each sub-setting is independent — an API may expose any combination of transports. The internal-call binding is not a network transport: it exposes the API to in-process `API.<name>()` calls from same-service designer scripts.

## Contained in

- [BusinessApi](./BusinessApi.md) as `controllers`

Blueprint paths:

- `authentication.businessLogic.controllers`
- `services.businessLogic.controllers`

## Contains

- `restSettings`: [ApiRestSettings](./ApiRestSettings.md)
- `grpcSettings`: [ApiGrpcSettings](./ApiGrpcSettings.md)
- `kafkaSettings`: [ApiKafkaSettings](./ApiKafkaSettings.md)
- `sseSettings`: [ApiSseSettings](./ApiSseSettings.md)
- `cronSettings`: [ApiCronSettings](./ApiCronSettings.md)
- `internalCallSettings`: [ApiInternalCallSettings](./ApiInternalCallSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
