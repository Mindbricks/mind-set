# BucketProviderConfig

**Level:** `subsection` · **Family:** [ProjectSettings](./families.md#projectsettings) (domain `Project`)

**Specification:** [BucketProviderConfig in Part 2](../spec/BucketProviderConfig.md)

Provider credentials and defaults. Fields are flat across all provider types — only those relevant to the selected `provider` are read at runtime and emitted to env. Sensitive fields are marked secret and masked in API responses.

Azure auth modes (exactly one must be configured when provider='azure'):
- `connectionString` — full Azure Blob connection string (includes account name + key + endpoint).
- `useManagedIdentity=true` — authenticate via `DefaultAzureCredential` (managed identity / workload identity); no secret in config.
- `accountName` + `accountKey` — shared-key pair, supplied separately.

## Contained in

- [BucketProvider](./BucketProvider.md) as `configuration`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
