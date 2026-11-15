# ForeignPermissionProvider

**Level:** `chapter` · **Family:** [ForeignPermissionProvider](../ontology/families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Ontology:** [ForeignPermissionProvider in Part 1](../ontology/ForeignPermissionProvider.md)

Project-wide foreign permission server configuration (one foreign server, one transport). Codegen generates ONE permission client per service from this block — a gRPC stub (proto emitted from `protoSource`, called via grpcUnaryCall) or a REST caller (fetch) — shared by every api that opts in via `authOptions.foreignPermissionCheck`. `endpoint` / `headers` / `tls.caCert` `$ENV:` refs resolve at runtime.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerBasics` | [`ForeignPermissionProviderBasics`](./ForeignPermissionProviderBasics.md) | yes |  |  |  | Transport and decision policy of the foreign permission server: the grpc/rest transport selector, the endpoint, the proto/method binding (grpc) or path/method (rest), and the deny/message/status/failOpen/cache rules. |
| `tls` | [`GrpcClientTls`](./GrpcClientTls.md) | no |  |  |  | [grpc only] Optional transport security. When omitted or `mode: 'insecure'` (the dev default) the channel uses insecure credentials. `mode: 'ssl'` uses TLS; `caCert` (literal PEM or `$ENV:VAR`) overrides the system trust roots when the server presents a private/self-signed certificate. |
| `headers` | [`GrpcClientMetadataItem`](./GrpcClientMetadataItem.md)[] | no |  |  |  | [rest only] STATIC auth headers sent on every call to the permission server (e.g. an API key the server requires). Each value may be a literal or a `$ENV:VAR` reference resolved at runtime. |
| `sessionBindings` | [`ForeignPermissionSessionBinding`](./ForeignPermissionSessionBinding.md)[] | no |  |  |  | Session field → request param bindings, applied to BOTH transports. For each entry the gate pulls `this.session.<from>` (the access token is also reachable via `this.request.headers.authorization` / `this.session.accessToken`) into the merged request under `<as>`. Bindings + the per-api `foreignPermissionCheck.params` together form the request body/message. |

## Constraints

Property rules:

- `providerBasics` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `headers` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

## Migration

> **Warning:** deprecated and relocated properties. They are listed so that older blueprints can be updated; new blueprints must not use them.

| Property | Status | Use instead | Note |
| --- | --- | --- | --- |
| `type` | moved | `providerBasics.type` | Write the value at the new path. |
| `endpoint` | moved | `providerBasics.endpoint` | Write the value at the new path. |
| `protoSource` | moved | `providerBasics.protoSource` | Write the value at the new path. |
| `package` | moved | `providerBasics.package` | Write the value at the new path. |
| `service` | moved | `providerBasics.service` | Write the value at the new path. |
| `method` | moved | `providerBasics.method` | Write the value at the new path. |
| `restMethod` | moved | `providerBasics.restMethod` | Write the value at the new path. |
| `restPath` | moved | `providerBasics.restPath` | Write the value at the new path. |
| `requestIn` | moved | `providerBasics.requestIn` | Write the value at the new path. |
| `denyWhen` | moved | `providerBasics.denyWhen` | Write the value at the new path. |
| `messageFrom` | moved | `providerBasics.messageFrom` | Write the value at the new path. |
| `statusFrom` | moved | `providerBasics.statusFrom` | Write the value at the new path. |
| `failOpen` | moved | `providerBasics.failOpen` | Write the value at the new path. |
| `cacheTtlSeconds` | moved | `providerBasics.cacheTtlSeconds` | Write the value at the new path. |
