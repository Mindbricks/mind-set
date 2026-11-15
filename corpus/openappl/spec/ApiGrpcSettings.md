# ApiGrpcSettings

**Level:** `section` · **Family:** [BusinessApiControllers](../ontology/families.md#businessapicontrollers) (domain `BusinessApi`)

**Ontology:** [ApiGrpcSettings in Part 1](../ontology/ApiGrpcSettings.md)

**Activation:** the pattern is switched on by `hasGrpcController`.

Enables gRPC interface for the Business API. Useful for high-performance service-to-service communication. Response shapes follow Google AIP conventions and are not configurable: single-item methods return the resource message directly, list methods return `<Method>Response { repeated <Model> data = 1; Paging paging = 2; }` (1-based paging), and errors surface as gRPC status codes — never inside the response message.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasGrpcController` | `Boolean` | yes |  |  |  | Controls whether this API exposes a gRPC method. The gRPC controller resolves the caller's session from the `authorization` metadata; a `permissionCheck` api answers a call whose credential resolved no session with 403 PERMISSION_DENIED, so pair a gRPC-exposed `permissionCheck` api with `loginRequired: true` (validation warns otherwise, PERMISSION_CHECK_ON_CALLERLESS_DOOR). |
| `responseType` | `GrpcApiResponseType` | no | `"single"` | `single`, `stream` |  | Specifies whether the gRPC method returns a single result or a stream of results. |

## Constraints

Property rules:

- `hasGrpcController` must be present. Enforced only while `hasGrpcController` is on. (`REQUIRED_FIELD_MISSING`)
- `responseType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `GRPC_RESPONSE_TYPE_REQUIRED` | error | responseType is required when hasGrpcController is true. |
