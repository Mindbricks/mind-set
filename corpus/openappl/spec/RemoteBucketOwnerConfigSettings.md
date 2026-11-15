# RemoteBucketOwnerConfigSettings

**Level:** `subsection` · **Family:** [RemoteBucket](../ontology/families.md#remotebucket) (domain `Service`)

**Ontology:** [RemoteBucketOwnerConfigSettings in Part 1](../ontology/RemoteBucketOwnerConfigSettings.md)

Configuration for the owner data object pairing.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dataObjectName` | [`LocalDataObjectName`](./LocalDataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The data object to pair with (e.g., 'user', 'product'). Files in this bucket will have a relation ID pointing to records in this data object. |
| `relationProperty` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Property name for the relation ID on the bucket file record. If null, auto-generated as '{dataObjectName}Id' (e.g., 'productId'). Must be a valid codeName. |
| `downloadRequiresActiveOwner` | `Boolean` | no | `false` |  |  | When true, every route of this bucket that hands back the file (download by storage key, access key or row id, the DbBucket /shared link, and the DbBucket metadata route GET /bucket/{bucket}/object/:key, which returns the file's whole row minus its byte columns) loads the file's metadata row and then the paired owner row through the owner data object's default read, which excludes soft-deleted (isActive=false) rows; if the file has no metadata row, no owner id, or the owner row is missing or inactive, the route answers 404 NOT_FOUND instead of serving the file. Evaluated AFTER the bucket's read gate, so an unauthorised caller still gets 401/403 and learns nothing. Model 'hidden' or 'merged' owners as soft-deleted rows (or any state the default read excludes) for this to apply. For RemoteBucket/NativeBucket the metadata row is the {name}RemoteFile twin looked up by storageKey, which your own managers must persist at upload (the router does not); a file without one is not served. Requires a local (same-service) owner data object. Default false: downloads never consult the owner row. |

## Constraints

Property rules:

- `dataObjectName` must be present. (`REQUIRED_FIELD_MISSING`)
- `relationProperty` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `dataObjectName` must be a well-formed [`LocalDataObjectName`](./LocalDataObjectName.md) (a data object of the same service). (`INVALID_LOCAL_DATA_OBJECT_NAME_FORMAT`)
