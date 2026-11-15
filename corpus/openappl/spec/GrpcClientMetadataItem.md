# GrpcClientMetadataItem

**Level:** `section` · **Family:** [ForeignPermissionProvider](../ontology/families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Ontology:** [GrpcClientMetadataItem in Part 1](../ontology/GrpcClientMetadataItem.md)

**Name:** an instance is named by `name`.

A single STATIC gRPC metadata header sent on every call to a foreign gRPC server (see GrpcClientConfig.metadata). The value is a literal string or a `$ENV:VAR` reference resolved at runtime — NOT MScript (these are static credentials, not per-call dynamic values).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The metadata header name, preserved VERBATIM (NOT codeName-normalized — header names are dash-case by convention, e.g. `authorization` or `x-api-key`; gRPC lowercases them at runtime). |
| `value` | `String` | yes |  |  |  | The static header value, either a literal (e.g. `Bearer abc123`) or a `$ENV:VAR` reference (e.g. `$ENV:PAYMENT_GRPC_TOKEN`) resolved from the environment at runtime. |

## Constraints

Property rules:

- `name`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
