# CryptoBatchSpec

**Level:** `subsection` · **Family:** [ComputeJob](./families.md#computejob) (domain `Service`)

**Specification:** [CryptoBatchSpec in Part 2](../spec/CryptoBatchSpec.md)

Schema-only v1 specification for crypto-batch ComputeJobs, including proposed bulk hashing, verification and archive presets. Current nodejs generation has no crypto-batch execution arm: it does not generate batching, key/KMS resolution, crypto workflows, audit logs or verification reports from this spec. Any future implementation requires a libraryWrapped-only contract with required audit logging; primitives must come from a vetted library. Runtime semantics for the declared fields remain undecided.

## Contained in

- [ComputeJobSpec](./ComputeJobSpec.md) as `cryptoBatch`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
