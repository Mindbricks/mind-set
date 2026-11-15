# DbBucket

**Level:** `chapter` · **Family:** [DbBucket](./families.md#dbbucket) (domain `Service`)

**Specification:** [DbBucket in Part 2](../spec/DbBucket.md)

A database-backed file storage bucket. Stores files as BYTEA in PostgreSQL — ideal for small files like icons, avatars, and secret documents (up to 10 MB by default). Each bucket auto-generates a data object ({name}File) with metadata properties and a BYTEA column, system upload/download routes at /bucket/{name}/, and metadata CRUD APIs. Supports configurable authorization (public/private/authenticated read, role-based access, custom auth scripts) and optional pairing with an owner data object for relational file management. Prefer RemoteBucket for large files stored at your configured cloud provider, or NativeBucket for platform-managed object storage without a cloud provider.

## Contained in

- [Service](./Service.md) as `dbBuckets` (a list)

Blueprint paths:

- `services.dbBuckets`

## Contains

- `bucketBasics`: [DbBucketBasics](./DbBucketBasics.md)
- `bucketAuthorization`: [DbBucketAuthorization](./DbBucketAuthorization.md)
- `ownerDataObject`: [DbBucketOwnerConfig](./DbBucketOwnerConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
