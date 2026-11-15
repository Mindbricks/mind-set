# DbBucketOwnerConfig

**Level:** `section` · **Family:** [DbBucket](../ontology/families.md#dbbucket) (domain `Service`)

**Ontology:** [DbBucketOwnerConfig in Part 1](../ontology/DbBucketOwnerConfig.md)

**Activation:** the pattern is switched on by `hasOwnerDataObject`.

Optional pairing with another data object. When configured, each file in the bucket has a foreign key relation to the owner data object (e.g., a product's images, a user's documents). This enables filtering files by owner and cascading deletes.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `hasOwnerDataObject` | `Boolean` | yes |  |  |  | Enable pairing this bucket with a data object. When true, each file record includes a foreign key to the specified data object. |
| `configuration` | [`DbBucketOwnerConfigSettings`](./DbBucketOwnerConfigSettings.md) | no |  |  |  | Configuration for the owner data-object pairing. |

## Constraints

Property rules:

- `hasOwnerDataObject` must be present. Enforced only while `hasOwnerDataObject` is on. (`REQUIRED_FIELD_MISSING`)
