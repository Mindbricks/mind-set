# NativeBucket

**Level:** `chapter` · **Family:** [NativeBucket](./families.md#nativebucket) (domain `Service`)

**Specification:** [NativeBucket in Part 2](../spec/NativeBucket.md)

A self-hosted object-storage bucket backed by a platform-PROVISIONED, SeaweedFS (S3-API-compatible) store (docs/ADR-native-bucket-pattern.md, docs/ADR-seaweedfs-nativebucket.md). Full object-store semantics (presign, large files, streaming, server-side encryption) with NO cloud account, NO cloud credentials, and NO cloud cost — on-prem / data-sovereignty friendly. The designer just declares the bucket; the hosting platform provisions and manages the SeaweedFS store (lifecycle, root creds, default-bucket creation). Unlike RemoteBucket there is NO `bucketStorage.providerName` to configure — the managed store is implicit and project-scoped. Each native bucket creates a metadata data object named {name}RemoteFile (the SAME twin suffix RemoteBucket uses) holding storageKey + file info; binary content lives in the managed SeaweedFS store. That twin is materialized at BUILD time, so listBlueprint(dataObjects) does not list it, but it is nevertheless a legal childObject / fetch target at design time. Locally backed by the FARM SeaweedFS S3 gateway (mb-seaweedfs, S3 API :19900, dev creds minioadmin/minioadmin); in deploy the deployer stands up a per-project SeaweedFS store. Reuses RemoteBucket's basics/authorization/owner sub-patterns and the RemoteBucket S3 adapter under the hood. Upload and download routes are auto-generated at /nativebucket/{name}/. Prefer DbBucket for small files stored directly as BYTEA in PostgreSQL; prefer RemoteBucket when you want to configure your own cloud provider.

### Runtime helpers callable from your code

Generated from the designer runtime helper registry (`src/patterns/designer-runtime-helpers.ts`). Names are the Node.js surface; the Languages column lists the generated languages that emit a native equivalent, whose call and return shapes may differ. See the Runtime libraries guide for the import aliases.

| Helper | How your code reaches it | What it does | Languages |
| --- | --- | --- | --- |
| `readBucketObject` | `const { readBucketObject } = require("bucketLayer/bucket-router")` | Read one object's bytes in process: `readBucketObject(bucketName, storageKey, opts?)` accepts optional `maxBytes` and `kind`, and resolves `{ bucket, storageKey, body, contentType, size }`. A trusted server-side read with no read gate; authorize your own caller first. | nodejs, java, dotnet, rust |
| `writeBucketObject` | `const { writeBucketObject } = require("bucketLayer/bucket-router")` | Store one object in process through the bucket's own upload route body (gate, MIME sniff, scan, size cap, twin row): `writeBucketObject(bucketName, input, opts?)` takes required Buffer `input.body`, optional `fileName`, `contentType`, `fields`, and optional `opts.caller` / `opts.kind`; resolves the upload answer (`storageKey`, ...). `fields` are the multipart fields an upload would carry: a twin column flagged `uploadSettings.fromUploadField` is set from the field of the same name. | nodejs, java, dotnet, rust |
| `deleteBucketObject` | `const { deleteBucketObject } = require("bucketLayer/bucket-router")` | Delete one object in process through the bucket's own delete route body and gate: `deleteBucketObject(bucketName, storageKey, opts?)` accepts optional `caller` and `kind`. Removes the object only; delete the twin row through its dbLayer function. | nodejs, java, dotnet, rust |

## Contained in

- [Service](./Service.md) as `nativeBuckets` (a list)

Blueprint paths:

- `services.nativeBuckets`

## Contains

- `bucketBasics`: [RemoteBucketBasics](./RemoteBucketBasics.md)
- `bucketStorage`: [NativeBucketStorage](./NativeBucketStorage.md)
- `bucketAuthorization`: [RemoteBucketAuthorization](./RemoteBucketAuthorization.md)
- `ownerDataObject`: [RemoteBucketOwnerConfig](./RemoteBucketOwnerConfig.md)
- `remoteBucketSettings`: [RemoteBucketSettings](./RemoteBucketSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
