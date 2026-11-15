# ApiGrpcSettings

**Level:** `section` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [ApiGrpcSettings in Part 2](../spec/ApiGrpcSettings.md)

Enables gRPC interface for the Business API. Useful for high-performance service-to-service communication. Response shapes follow Google AIP conventions and are not configurable: single-item methods return the resource message directly, list methods return `<Method>Response { repeated <Model> data = 1; Paging paging = 2; }` (1-based paging), and errors surface as gRPC status codes — never inside the response message.

## Contained in

- [BusinessApiControllers](./BusinessApiControllers.md) as `grpcSettings`

Blueprint paths:

- `authentication.businessLogic.controllers.grpcSettings`
- `services.businessLogic.controllers.grpcSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
