# RemoteBucketOwnerConfig

**Level:** `section` · **Family:** [RemoteBucket](../ontology/families.md#remotebucket) (domain `Service`)

**Ontology:** [RemoteBucketOwnerConfig in Part 1](../ontology/RemoteBucketOwnerConfig.md)

**Activation:** the pattern is switched on by `hasOwnerDataObject`.

Optional pairing with another data object. When configured, each file in the bucket has a foreign key relation to the owner data object (e.g., a product's images, a user's documents). This enables filtering files by owner and cascading deletes.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasOwnerDataObject` | `Boolean` | yes |  |  |  | Enable pairing this bucket with a data object. When true, each file record includes a foreign key to the specified data object. |
| `configuration` | [`RemoteBucketOwnerConfigSettings`](./RemoteBucketOwnerConfigSettings.md) | no |  |  |  | Configuration for the owner data-object pairing. |

## Constraints

Property rules:

- `hasOwnerDataObject` must be present. Enforced only while `hasOwnerDataObject` is on. (`REQUIRED_FIELD_MISSING`)
