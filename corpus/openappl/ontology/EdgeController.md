# EdgeController

**Level:** `chapter` · **Family:** [EdgeController](./families.md#edgecontroller) (domain `Service`)

**Specification:** [EdgeController in Part 2](../spec/EdgeController.md)

An edge controller defines a fully customized route handled by a developer-defined function. Unlike standard Busines APIs, it gives full control over the request processing by directly calling a function from the service library. This allows advanced operations like database queries, external API calls, or dynamic responses without following the CRUD cycle. Edge controllers are ideal for building special-purpose APIs or custom flows outside the compiler's automatic route generation.

## Contained in

- [Service](./Service.md) as `edgeControllers` (a list)

Blueprint paths:

- `services.edgeControllers`

## Contains

- `edgeControllerOptions`: [EdgeControllerOptions](./EdgeControllerOptions.md)
- `edgeRestSettings`: [EdgeRestSettings](./EdgeRestSettings.md)
- `edgeKafkaSettings`: [EdgeKafkaSettings](./EdgeKafkaSettings.md)
- `edgeCronSettings`: [EdgeCronSettings](./EdgeCronSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
