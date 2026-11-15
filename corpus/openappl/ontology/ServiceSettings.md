# ServiceSettings

**Level:** `chapter` · **Family:** [ServiceSettings](./families.md#servicesettings) (domain `Service`)

**Specification:** [ServiceSettings in Part 2](../spec/ServiceSettings.md)

Defines the foundational settings of the service module, including basic metadata and authentication configurations. These settings must be established before designing the service's data model. They determine the service's identity, behavior within the project, and how it handles authentication. This configuration acts as the entry point for service-level behavior, ensuring consistency and security from the outset of development.

## Contained in

- [Service](./Service.md) as `serviceSettings`

Blueprint paths:

- `services.serviceSettings`

## Contains

- `serviceBasics`: [ServiceBasics](./ServiceBasics.md)
- `serviceOptions`: [ServiceOptions](./ServiceOptions.md)
- `realtimeConfig`: [RealtimeConfig](./RealtimeConfig.md)
- `grpcClients`: [GrpcClientConfig](./GrpcClientConfig.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
