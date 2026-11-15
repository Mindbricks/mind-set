# RemoteBucket

**Level:** `chapter` · **Family:** [RemoteBucket](./families.md#remotebucket) (domain `Service`)

**Specification:** [RemoteBucket in Part 2](../spec/RemoteBucket.md)

A cloud-storage-backed file bucket. Files are uploaded to an external storage provider (S3, GCS, Azure Blob, R2, or any S3-compatible store) and only their metadata is stored in the service database. Each bucket auto-generates a data object ({name}RemoteFile) with file metadata (fileName, mimeType, fileSize, storageKey, accessKey, uploaderUserId, the scan columns, etc.; designer-declared extra columns go in remoteBucketSettings.additionalColumns), system upload/download routes at /bucket/{name}/ (POST /upload multipart, POST /upload-url presigned, GET /download/:key, DELETE /object/:key — the /remotebucket/{name}/ prefix older docs cite is not mounted), and metadata CRUD APIs. Supports presigned-URL or proxy-stream download strategies, configurable authorization (public/private/authenticated read, role-based access, custom auth scripts), and optional pairing with an owner data object. Use for large files, images, videos, and documents where DbBucket's BYTEA blob storage isn't appropriate. Prefer NativeBucket when you want platform-managed object storage without configuring a cloud provider.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `readBucketObject` | `const { readBucketObject } = require("bucketLayer/bucket-router")` | Read one object's bytes in process: `readBucketObject(bucketName, storageKey, opts?)` accepts optional `maxBytes` and `kind`, and resolves `{ bucket, storageKey, body, contentType, size }`. A trusted server-side read with no read gate; authorize your own caller first. | nodejs, java, dotnet, rust |
| `writeBucketObject` | `const { writeBucketObject } = require("bucketLayer/bucket-router")` | Store one object in process through the bucket's own upload route body (gate, MIME sniff, scan, size cap, twin row): `writeBucketObject(bucketName, input, opts?)` takes required Buffer `input.body`, optional `fileName`, `contentType`, `fields`, and optional `opts.caller` / `opts.kind`; resolves the upload answer (`storageKey`, ...). `fields` are the multipart fields an upload would carry: a twin column flagged `uploadSettings.fromUploadField` is set from the field of the same name. | nodejs, java, dotnet, rust |
| `deleteBucketObject` | `const { deleteBucketObject } = require("bucketLayer/bucket-router")` | Delete one object in process through the bucket's own delete route body and gate: `deleteBucketObject(bucketName, storageKey, opts?)` accepts optional `caller` and `kind`. Removes the object only; delete the twin row through its dbLayer function. | nodejs, java, dotnet, rust |

## Contained in

- [Service](./Service.md) as `remoteBuckets` (a list)

Blueprint paths:

- `services.remoteBuckets`

## Contains

- `bucketBasics`: [RemoteBucketBasics](./RemoteBucketBasics.md)
- `bucketStorage`: [RemoteBucketStorage](./RemoteBucketStorage.md)
- `bucketAuthorization`: [RemoteBucketAuthorization](./RemoteBucketAuthorization.md)
- `ownerDataObject`: [RemoteBucketOwnerConfig](./RemoteBucketOwnerConfig.md)
- `remoteBucketSettings`: [RemoteBucketSettings](./RemoteBucketSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
