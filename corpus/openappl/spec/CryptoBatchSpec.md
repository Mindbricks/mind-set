# CryptoBatchSpec

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [CryptoBatchSpec in Part 1](../ontology/CryptoBatchSpec.md)

Schema-only v1 specification for crypto-batch ComputeJobs, including proposed bulk hashing, verification and archive presets. Current nodejs generation has no crypto-batch execution arm: it does not generate batching, key/KMS resolution, crypto workflows, audit logs or verification reports from this spec. Any future implementation requires a libraryWrapped-only contract with required audit logging; primitives must come from a vetted library. Runtime semantics for the declared fields remain undecided.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `op` | `String` | no |  |  |  | The crypto operation: `hash\|sign\|verify\|encrypt-archive`. Kept as String in v1. |
| `algorithm` | `String` | no |  |  |  | The algorithm (e.g. `sha256`, `blake3`, `ed25519`, `argon2`). Kept as String in v1 — resolved to a vetted crate, never generated. |
| `keyRef` | `String` | no |  |  |  | Declared key-store key identifier, not key material. Crypto-batch is schema-only in v1; current nodejs generation does not resolve this reference or run crypto operations. The key registry, caller authorization, version/rotation rules and missing-key behavior remain unspecified. |
| `kmsRef` | `String` | no |  |  |  | Declared cloud KMS key identifier/ARN. Crypto-batch is schema-only in v1; current nodejs generation does not resolve this reference or invoke a KMS. Providers, credentials, supported operations, keyRef precedence and failure behavior remain unspecified. |
| `batching` | `String` | no |  |  |  | Declared file/record batching configuration as a String. Crypto-batch is schema-only in v1; current nodejs generation has no crypto-batch execution arm and does not consume this value. String grammar, item source, batch boundaries, ordering/concurrency and failure behavior remain unspecified. |
| `auditLog` | `Boolean` | no |  |  |  | Whether an audit log of every operation is recorded. REQUIRED for crypto-batch — should be true. |
| `verificationReport` | `Boolean` | no |  |  |  | Declared request for per-item verification results, default false. Crypto-batch is schema-only in v1; current nodejs generation produces no report through this flag. Report shape/location, size limits, applicable operations, failure representation and the distinction from required audit logs remain unspecified. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
