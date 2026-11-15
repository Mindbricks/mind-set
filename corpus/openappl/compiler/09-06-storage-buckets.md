---
title: Storage buckets
---

# 9.6 Storage buckets

Files are stored through **buckets** that a service declares. There is no separate
storage service: each bucket adds a router and a file-record object to the service that
declares it.

| Pattern | Stores the bytes in | File-record object |
|---|---|---|
| `dbBuckets[]` ([`DbBucket`](../spec/DbBucket.md)) | the service's own database | `<name>File` |
| `remoteBuckets[]` | an external object store of a declared provider (`s3`, `gcs`, `azure`, `r2`, `s3Compatible`) | `<name>RemoteFile` |
| `nativeBuckets[]` | the project's own object store | `<name>RemoteFile` |

The `auth` service always declares a database bucket `userAvatars` for user avatars.

## Routes

| Kind | Routes (on the declaring service) |
|---|---|
| Remote and native | `POST /bucket/<name>/upload` (multipart through the service), `POST /bucket/<name>/upload-url` (a presigned upload URL), `GET /bucket/<name>/download/:key` (redirect to a presigned or public URL), `DELETE /bucket/<name>/object/:key`; native buckets use the prefix `/nativebucket/<name>` |
| Database | `POST /bucket/<name>/upload`, `POST /bucket/<name>/upload-url`, `GET /bucket/<name>/download/key/:accessKey` (no session), `GET /bucket/<name>/download/:id`, `POST /bucket/<name>/share-url/:key`, `GET /bucket/<name>/shared/:key`, `GET /bucket/<name>/object/:key`, `DELETE /bucket/<name>/:key` |

> Generated table goes here (S9): the bucket route catalogue.

## Rules

- Uploads and downloads use the caller's ordinary session; the bucket's authorization
  (`bucketAuthorization`: read, write and delete access, roles, key access, scripts)
  decides.
- A compiler **MUST** enforce `maxFileSizeMb` and `allowedMimeTypes` on the uploaded
  content, checking the content itself, not only the declared type.
- Downloads **MUST** be served inert: `X-Content-Type-Options: nosniff`, attachment
  disposition, and a restrictive content security policy for active content types.
- An upload answers with a `downloadUrl` (and a `publicUrl` for public delivery).
- A presigned URL is a bearer credential for its lifetime (`presignTTLSeconds`, default
  900).
- Database-bucket access keys and share links are signed tokens; without the bucket token
  secret, token routes answer **503**.
- File bytes never appear in events, projections or responses other than the download.
- With virus scanning on, a file is scanned before it is stored; outside production a
  scanner failure may skip the scan, in production it refuses the upload.

## Without credentials

- A remote bucket whose provider has no complete credentials **MUST** fall back to the
  project's native store, keeping its key prefix ([chapter 10](10-configuration-and-secrets.md#103-missing-provider-credentials)).
- A service whose native store keys are missing still starts; calls that need the store
  answer **503** `BUCKET_PROVIDER_NOT_CONFIGURED`.

> **To verify:** the full column list of `<name>RemoteFile` (from the schema text only).
