# GrpcCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [GrpcCallAction in Part 1](../ontology/GrpcCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Calls a FOREIGN (non-OpenAPPL) gRPC server during Business API execution (docs/ADR-grpc-interservice-and-grpccall.md, Part B). The gRPC counterpart of `ApiCallAction`: instead of a URL it targets a named gRPC client (declared in `serviceSettings.grpcClients[]`) and an rpc method. The request message is built from compiled MScript `request.fields` (like ApiCallAction compiles its body/headers); the call rides the shared `grpcUnaryCall` engine (the same engine the interservice gRPC path uses) with the grpcClient's static metadata attached; the decoded Response is extracted by `responsePath` and stored in context (and optionally written to the response). For an OpenAPPL target, prefer `InterserviceCallAction` (transport auto-selects gRPC with zero proto config); use `GrpcCallAction` for third-party gRPC services whose proto you supply via the grpcClient.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `grpcClientName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Codename of the foreign gRPC client to call. Must match an entry in this service's `serviceSettings.grpcClients[].name`. The grpcClient supplies the proto (package/service), endpoint, static metadata, and TLS. |
| `grpcMethodName` | `String` | yes |  |  |  | The rpc method name to invoke on the grpcClient's `service` (must be declared in the grpcClient's proto, e.g. `CreateCharge`). Unary by default; set `streaming: true` for a SERVER-streaming method (`rpc X(Req) returns (stream Resp)`). Client-streaming and bidi are not yet supported. |
| `request` | [`GrpcCallRequest`](./GrpcCallRequest.md) | no |  |  |  | The request message sent to the gRPC method. Its `fields` map proto field names to MScript expressions evaluated against the current API context — exactly like ApiCallAction's body parameters. A method that takes no arguments may omit this or leave `fields` empty. |
| `responsePath` | `String` | no |  |  |  | Optional dotted path into the decoded Response message to extract the value of interest (e.g. `charge.id`, `result.items`). When null, the full decoded Response message is stored. Applied after the call returns. For a `streaming` call it is applied PER streamed message. |
| `isArray` | `Boolean` | yes |  |  |  | If true, the extracted value (`responsePath` result, or the whole Response) is expected to be an array and is treated as such during response and context processing. Ignored when `streaming` is true (a streamed result is always the collected array). |
| `streaming` | `Boolean` | yes |  |  |  | If true, the `grpcMethodName` is a SERVER-streaming rpc (`rpc X(Req) returns (stream Resp)`). The call collects every streamed Response message into an array and returns it (the simplest result for a BusinessApi value; `responsePath` is applied per-item and `isArray` is implied). When false/absent the call is unary. Client-streaming/bidi and an async-iterator (stream-to-client) consumption mode are follow-ons. |

## Constraints

Property rules:

- `grpcClientName`, `grpcMethodName`, `isArray`, `streaming` must be present. (`REQUIRED_FIELD_MISSING`)
- `grpcClientName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `GRPC_CLIENT_NOT_FOUND` | error | gRPC client "…" is not declared in this service's serviceSettings.grpcClients. |

## Example

Use to integrate a third-party / non-OpenAPPL gRPC service. Declare the foreign server once under serviceSettings.grpcClients[] (endpoint + inline proto + package/service + any static auth metadata), then call one of its rpc methods here, mapping the request fields from context via MScript and extracting the part of the response you need with responsePath.

```json
{
  "name": "createCharge",
  "description": "Charge the buyer via the external payments gRPC service.",
  "grpcClientName": "paymentGrpc",
  "grpcMethodName": "CreateCharge",
  "request": {
    "fields": [
      {
        "protoField": "amount",
        "value": { "js": "this.data.totalCents" }
      },
      {
        "protoField": "currency",
        "value": { "js": "this.data.currency" }
      },
      {
        "protoField": "customerId",
        "value": { "js": "this.session.userId" }
      }
    ]
  },
  "responsePath": "charge.id",
  "isArray": false,
  "contextPropertyName": "chargeId",
  "writeToResponse": true
}
```
