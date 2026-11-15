# DbBucket

**Level:** `chapter` · **Family:** [DbBucket](../ontology/families.md#dbbucket) (domain `Service`)

**Ontology:** [DbBucket in Part 1](../ontology/DbBucket.md)

**Name:** an instance is named by `bucketBasics.name`.

A database-backed file storage bucket. Stores files as BYTEA in PostgreSQL — ideal for small files like icons, avatars, and secret documents (up to 10 MB by default). Each bucket auto-generates a data object ({name}File) with metadata properties and a BYTEA column, system upload/download routes at /bucket/{name}/, and metadata CRUD APIs. Supports configurable authorization (public/private/authenticated read, role-based access, custom auth scripts) and optional pairing with an owner data object for relational file management. Prefer RemoteBucket for large files stored at your configured cloud provider, or NativeBucket for platform-managed object storage without a cloud provider.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `bucketBasics` | [`DbBucketBasics`](./DbBucketBasics.md) | yes |  |  |  | Core bucket settings: name, description, size limits, allowed file types and antivirus scanning. |
| `bucketAuthorization` | [`DbBucketAuthorization`](./DbBucketAuthorization.md) | yes |  |  |  | Read/write authorization for the bucket — who can upload and download files, via role-based access, access keys, or custom authorization scripts. |
| `ownerDataObject` | [`DbBucketOwnerConfig`](./DbBucketOwnerConfig.md) | no |  |  |  | Optional pairing with an owner data object — each file gains a foreign-key relation to it (e.g. a product's images, a user's documents), enabling owner-filtered listing and cascading deletes. |

## Constraints

Property rules:

- `bucketBasics`, `bucketAuthorization` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DB_BUCKET_DUPLICATE_NAME` | error | DbBucket name "…" is duplicated within this service. |
| `DB_BUCKET_NAME_CONFLICT` | error | DbBucket "…" collides with a system data-object name "…". |
| `DB_BUCKET_OWNER_NOT_CONFIGURED` | warning | DbBucket "…" has no owner dataObject configured. |
| `DB_BUCKET_OWNER_NOT_FOUND` | warning | DbBucket "…" references owner dataObject "…" which is not declared in this service. |
