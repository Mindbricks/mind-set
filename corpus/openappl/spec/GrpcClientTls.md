# GrpcClientTls

**Level:** `section` · **Family:** [ForeignPermissionProvider](../ontology/families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Ontology:** [GrpcClientTls in Part 1](../ontology/GrpcClientTls.md)

Transport security for a foreign gRPC client (see GrpcClientConfig.tls). `insecure` (default) matches the interservice gRPC dev default; `ssl` enables TLS with an optional CA override for private / self-signed server certificates.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mode` | `GrpcTlsMode` | no | `"insecure"` | `insecure`, `ssl` |  | `insecure` (default) uses plaintext credentials — fine for dev / trusted networks. `ssl` enables TLS. |
| `caCert` | `String` | no |  |  |  | Optional CA certificate (literal PEM string or a `$ENV:VAR` reference) used to verify the foreign server's TLS certificate when it is signed by a private / self-signed CA. Only consulted when `mode: 'ssl'`. When omitted, the system trust roots are used. |

## Constraints

Property rules:

- `mode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
